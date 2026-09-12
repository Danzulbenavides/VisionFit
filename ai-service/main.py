from fastapi import FastAPI, File, UploadFile, HTTPException
import cv2
import mediapipe as mp
import numpy as np
import math


app = FastAPI(title="VisionFit AI Service")


# =========================================================
# MEDIAPIPE
# =========================================================

mp_face_mesh = mp.solutions.face_mesh


# =========================================================
# CONSTANTS
# =========================================================

REFERENCE_FACE_WIDTH_MM = 140

MIN_ESTIMATED_PD_MM = 54
MAX_ESTIMATED_PD_MM = 76

REFERENCE_EYE_TO_FACE_RATIO = 0.43


# =========================================================
# BASIC HELPERS
# =========================================================

def distance(first, second):
    return math.sqrt(
        (first[0] - second[0]) ** 2
        + (first[1] - second[1]) ** 2
    )


def average_point(points):
    if not points:
        return None

    x = sum(point[0] for point in points) / len(points)
    y = sum(point[1] for point in points) / len(points)

    return (x, y)


def horizontal_width(points):
    if not points:
        return 0

    xs = [point[0] for point in points]

    return max(xs) - min(xs)


def clamp(value, minimum, maximum):
    return max(minimum, min(value, maximum))


def round_value(value, decimals=2):
    return round(value, decimals)


# =========================================================
# FACE SHAPE SCORING
# =========================================================

def closeness(value, target, tolerance):
    if not math.isfinite(value):
        return 0

    difference = abs(value - target)

    return clamp(1 - difference / tolerance, 0, 1)


def classify_face_shape(
    shape_length_to_width_ratio,
    forehead_to_cheek_ratio,
    forehead_to_jaw_ratio,
    cheek_to_jaw_ratio,
    lower_cheek_to_jaw_ratio,
    jaw_width,
    cheek_width,
    forehead_width,
):

    jaw_to_cheek = jaw_width / max(cheek_width, 1)

    forehead_to_cheek = (
        forehead_width / max(cheek_width, 1)
    )

    scores = {
        "OVAL": 0,
        "ROUND": 0,
        "SQUARE": 0,
        "HEART": 0,
    }

    # OVAL
    scores["OVAL"] = (
        closeness(shape_length_to_width_ratio, 1.35, 0.25) * 0.45
        + closeness(lower_cheek_to_jaw_ratio, 0.78, 0.16) * 0.20
        + closeness(forehead_to_jaw_ratio, 0.90, 0.22) * 0.15
        + closeness(cheek_to_jaw_ratio, 0.92, 0.15) * 0.10
        + closeness(forehead_to_cheek, 0.95, 0.15) * 0.10
    )

    # ROUND
    scores["ROUND"] = (
        closeness(shape_length_to_width_ratio, 1.10, 0.18) * 0.50
        + closeness(lower_cheek_to_jaw_ratio, 0.86, 0.14) * 0.15
        + closeness(forehead_to_jaw_ratio, 0.98, 0.16) * 0.15
        + closeness(cheek_to_jaw_ratio, 0.96, 0.12) * 0.10
        + closeness(forehead_to_cheek, 1.00, 0.14) * 0.10
    )

    # SQUARE
    scores["SQUARE"] = (
        closeness(shape_length_to_width_ratio, 1.15, 0.18) * 0.35
        + closeness(forehead_to_jaw_ratio, 1.00, 0.14) * 0.25
        + closeness(jaw_to_cheek, 1.04, 0.14) * 0.15
        + closeness(forehead_to_cheek, 1.00, 0.14) * 0.15
        + closeness(lower_cheek_to_jaw_ratio, 0.82, 0.14) * 0.10
    )

    # HEART
    scores["HEART"] = (
        closeness(shape_length_to_width_ratio, 1.30, 0.25) * 0.35
        + closeness(forehead_to_jaw_ratio, 1.18, 0.20) * 0.30
        + closeness(forehead_to_cheek, 1.08, 0.18) * 0.15
        + closeness(lower_cheek_to_jaw_ratio, 0.68, 0.14) * 0.20
    )

    max_score = max(scores.values())

    if max_score <= 0:
        return "OVAL", {
            key: 0 for key in scores
        }

    normalized_scores = {
        key: round_value(value / max_score, 2)
        for key, value in scores.items()
    }

    face_shape = max(
        scores,
        key=scores.get
    )

    return face_shape, normalized_scores


# =========================================================
# CONFIDENCE
# =========================================================

def calculate_confidence(
    detection_score,
    eye_center_distance,
    face_width_pixels,
    face_length_pixels,
    shape_scores,
):
    confidence = detection_score

    if eye_center_distance > 30:
        confidence += 0.02

    if face_width_pixels > 100:
        confidence += 0.02

    if face_length_pixels > 100:
        confidence += 0.01

    sorted_scores = sorted(
        shape_scores.values(),
        reverse=True
    )

    if len(sorted_scores) >= 2:
        separation = sorted_scores[0] - sorted_scores[1]

        if separation < 0.10:
            confidence -= 0.08
        elif separation < 0.20:
            confidence -= 0.04
        else:
            confidence += 0.02

    return clamp(
        round_value(confidence, 2),
        0,
        0.99
    )


# =========================================================
# FACE ANALYSIS
# =========================================================

def analyze_face(image, detected_rotation):
    height, width = image.shape[:2]

    rgb_image = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB
    )

    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
    ) as face_mesh:

        result = face_mesh.process(rgb_image)

    if not result.multi_face_landmarks:
        return None

    face_landmarks = result.multi_face_landmarks[0]

    points = []

    for landmark in face_landmarks.landmark:
        points.append(
            (
                landmark.x * width,
                landmark.y * height
            )
        )

    # =====================================================
    # EYES
    # =====================================================

    left_eye_points = [
        points[index]
        for index in [
            33,
            133,
            159,
            145
        ]
    ]

    right_eye_points = [
        points[index]
        for index in [
            362,
            263,
            386,
            374
        ]
    ]

    eye_center_left = average_point(
        left_eye_points
    )

    eye_center_right = average_point(
        right_eye_points
    )

    if not eye_center_left or not eye_center_right:
        return None

    eye_center_distance = distance(
        eye_center_left,
        eye_center_right
    )

    if eye_center_distance <= 0:
        return None

    eye_center = average_point(
        [
            eye_center_left,
            eye_center_right
        ]
    )

    # =====================================================
    # FACE WIDTHS
    # =====================================================

    jaw_width = distance(
        points[234],
        points[454]
    )

    cheek_width = distance(
        points[123],
        points[352]
    )

    lower_cheek_width = distance(
        points[172],
        points[397]
    )

    forehead_width = distance(
        points[70],
        points[300]
    )

    eyebrow_width = horizontal_width(
        [
            points[70],
            points[63],
            points[105],
            points[66],
            points[107],
            points[336],
            points[296],
            points[334],
            points[293],
            points[300],
        ]
    )

    face_width_pixels = max(
        jaw_width,
        cheek_width,
        forehead_width
    )

    if face_width_pixels <= 0:
        return None

    # =====================================================
    # FACE HEIGHT
    # =====================================================

    face_x_values = [point[0] for point in points]
    face_y_values = [point[1] for point in points]

    face_box_width = (
        max(face_x_values) - min(face_x_values)
    )

    face_box_height = (
        max(face_y_values) - min(face_y_values)
    )

    left_brow = average_point(
        [
            points[70],
            points[63],
            points[105],
            points[66],
            points[107],
        ]
    )

    right_brow = average_point(
        [
            points[336],
            points[296],
            points[334],
            points[293],
            points[300],
        ]
    )

    brow_center = average_point(
        [
            left_brow,
            right_brow
        ]
    )

    # MediaPipe face landmark 152 is near the chin.
    chin = points[152]

    if brow_center and chin:
        landmark_face_length_pixels = distance(
            brow_center,
            chin
        )
    else:
        landmark_face_length_pixels = face_box_height

    face_length_pixels = max(
        landmark_face_length_pixels,
        face_box_height * 0.75
    )

    # =====================================================
    # RATIOS
    # =====================================================

    length_to_width_ratio = (
        face_length_pixels /
        max(face_width_pixels, 1)
    )

    forehead_to_cheek_ratio = (
        forehead_width /
        max(cheek_width, 1)
    )

    forehead_to_jaw_ratio = (
        forehead_width /
        max(jaw_width, 1)
    )

    cheek_to_jaw_ratio = (
        cheek_width /
        max(jaw_width, 1)
    )

    lower_cheek_to_jaw_ratio = (
        lower_cheek_width /
        max(jaw_width, 1)
    )

    # =====================================================
    # SHAPE GEOMETRY
    # =====================================================

    eyebrow_to_eye_gap = 0

    if brow_center and eye_center:
        eyebrow_to_eye_gap = abs(
            brow_center[1] - eye_center[1]
        )

    brow_to_chin_distance = (
        abs(chin[1] - brow_center[1])
        if brow_center
        else face_box_height
    )

    estimated_forehead_extension = max(
        eyebrow_to_eye_gap * 1.5,
        face_box_height * 0.08
    )

    landmark_shape_length = (
        brow_to_chin_distance
        + estimated_forehead_extension
    )

    shape_width_pixels = (
        cheek_width * 0.65
        + jaw_width * 0.20
        + forehead_width * 0.15
    )

    shape_length_pixels = (
        face_box_height * 0.60
        + landmark_shape_length * 0.40
    )

    shape_length_to_width_ratio = (
        shape_length_pixels /
        max(shape_width_pixels, 1)
    )

    # =====================================================
    # ESTIMATED PHYSICAL WIDTH
    # =====================================================

    estimated_face_width = REFERENCE_FACE_WIDTH_MM

    pixels_per_millimeter = (
        face_width_pixels /
        estimated_face_width
    )

    # =====================================================
    # PD ESTIMATION
    # =====================================================

    eye_to_face_ratio = (
        eye_center_distance /
        max(face_width_pixels, 1)
    )

    reference_eye_distance_mm = (
        REFERENCE_FACE_WIDTH_MM *
        REFERENCE_EYE_TO_FACE_RATIO
    )

    estimated_pd = (
        reference_eye_distance_mm *
        (
            eye_to_face_ratio /
            REFERENCE_EYE_TO_FACE_RATIO
        )
    )

    estimated_pd = clamp(
        estimated_pd,
        MIN_ESTIMATED_PD_MM,
        MAX_ESTIMATED_PD_MM
    )

    estimated_pd = round(
        estimated_pd
    )

    # =====================================================
    # FACE LENGTH
    # =====================================================

    if pixels_per_millimeter <= 0:
        estimated_face_length = 0
    else:
        estimated_face_length = clamp(
            round(
                face_length_pixels /
                pixels_per_millimeter
            ),
            50,
            300
        )

    # =====================================================
    # FACE SHAPE
    # =====================================================

    face_shape, shape_scores = classify_face_shape(
        shape_length_to_width_ratio,
        forehead_to_cheek_ratio,
        forehead_to_jaw_ratio,
        cheek_to_jaw_ratio,
        lower_cheek_to_jaw_ratio,
        jaw_width,
        cheek_width,
        forehead_width,
    )

    # =====================================================
    # CONFIDENCE
    # =====================================================

    # MediaPipe does not expose the same detector score
    # as TinyFaceDetector, so use a reasonable baseline.
    detection_score = 0.90

    confidence = calculate_confidence(
        detection_score,
        eye_center_distance,
        face_width_pixels,
        face_length_pixels,
        shape_scores,
    )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "faceShape": face_shape,

        "pupilDistance": estimated_pd,

        "faceWidth": clamp(
            round(estimated_face_width),
            50,
            300
        ),

        "faceLength": estimated_face_length,

        "confidence": confidence,

        "debug": {
            "detectedRotation": detected_rotation,

            "faceBox": {
                "x": round_value(min(face_x_values)),
                "y": round_value(min(face_y_values)),
                "width": round_value(face_box_width),
                "height": round_value(face_box_height),
            },

            "eyeCenterDistancePixels": round_value(
                eye_center_distance
            ),

            "faceWidthPixels": round_value(
                face_width_pixels
            ),

            "jawWidthPixels": round_value(
                jaw_width
            ),

            "cheekWidthPixels": round_value(
                cheek_width
            ),

            "foreheadWidthPixels": round_value(
                forehead_width
            ),

            "faceLengthPixels": round_value(
                face_length_pixels
            ),

            "shapeWidthPixels": round_value(
                shape_width_pixels
            ),

            "shapeLengthPixels": round_value(
                shape_length_pixels
            ),

            "eyebrowToEyeGapPixels": round_value(
                eyebrow_to_eye_gap
            ),

            "browToChinDistancePixels": round_value(
                brow_to_chin_distance
            ),

            "estimatedForeheadExtensionPixels": round_value(
                estimated_forehead_extension
            ),

            "shapeLengthToWidthRatio": round_value(
                shape_length_to_width_ratio,
                4
            ),

            "eyeToFaceRatio": round_value(
                eye_to_face_ratio,
                4
            ),

            "lengthToWidthRatio": round_value(
                length_to_width_ratio,
                4
            ),

            "foreheadToCheekRatio": round_value(
                forehead_to_cheek_ratio,
                4
            ),

            "foreheadToJawRatio": round_value(
                forehead_to_jaw_ratio,
                4
            ),

            "cheekToJawRatio": round_value(
                cheek_to_jaw_ratio,
                4
            ),

            "lowerCheekToJawRatio": round_value(
                lower_cheek_to_jaw_ratio,
                4
            ),

            "estimatedPd": estimated_pd,

            "pixelsPerMillimeter": round_value(
                pixels_per_millimeter,
                4
            ),

            "shapeScores": shape_scores,
        }
    }


# =========================================================
# MAIN AI ENDPOINT
# =========================================================

@app.post("/analyze-face")
async def analyze_face_endpoint(
    file: UploadFile = File(...)
):

    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="Image content type is required."
        )

    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed."
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    original_image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if original_image is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to decode the uploaded image."
        )

    # =====================================================
    # TRY FOUR ORIENTATIONS
    # =====================================================

    rotations = [0, 90, 180, 270]

    for rotation in rotations:

        if rotation == 0:
            oriented = original_image

        elif rotation == 90:
            oriented = cv2.rotate(
                original_image,
                cv2.ROTATE_90_CLOCKWISE
            )

        elif rotation == 180:
            oriented = cv2.rotate(
                original_image,
                cv2.ROTATE_180
            )

        else:
            oriented = cv2.rotate(
                original_image,
                cv2.ROTATE_90_COUNTERCLOCKWISE
            )

        analysis = analyze_face(
            oriented,
            rotation
        )

        if analysis is not None:
            return {
                "success": True,
                **analysis
            }

    raise HTTPException(
        status_code=422,
        detail=(
            "No face detected. Please face the camera "
            "directly, make sure your entire face is "
            "visible, and try again."
        )
    )