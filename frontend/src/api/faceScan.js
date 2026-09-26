import { File } from "expo-file-system";
import { getToken } from "../utils/storage";

const API_URL = "http://192.168.18.206:5000/api";

export const analyzeFaceScan = async(imageUri) => {
    if (!imageUri) {
        throw new Error("No image was captured.");
    }

    const token = await getToken();

    if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
    }

    console.log("FACE SCAN URI:", imageUri);
    console.log("FACE SCAN: preparing multipart upload...");
    console.log("FACE SCAN: API:", `${API_URL}/face-scan/analyze`);

    try {
        const file = new File(imageUri);

        console.log("FACE SCAN FILE URI:", file.uri);
        console.log("FACE SCAN FILE NAME:", file.name);
        console.log("FACE SCAN FILE TYPE:", file.type);
        console.log("FACE SCAN FILE SIZE:", file.size);

        const formData = new FormData();

        formData.append("image", file);

        const response = await fetch(`${API_URL}/face-scan/analyze`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            body: formData,
        });

        console.log("FACE SCAN HTTP STATUS:", response.status);

        const text = await response.text();

        console.log("FACE SCAN RAW RESPONSE:", text);

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(
                `Server returned an invalid response (${response.status}).`,
            );
        }

        if (!response.ok) {
            throw new Error(
                data?.error?.message ||
                `Face scan failed with status ${response.status}.`,
            );
        }

        return data;
    } catch (error) {
        console.error("========================================");
        console.error("FACE SCAN UPLOAD FAILED");
        console.error("Error name:", error?.name);
        console.error("Error message:", error?.message);
        console.error("Error stack:", error?.stack);
        console.error("========================================");

        throw error;
    }
};