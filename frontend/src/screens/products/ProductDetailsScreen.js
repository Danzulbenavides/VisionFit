import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getProductById } from "../../api/products";

import { addToCart } from "../../api/cart";

import { getPrescriptions } from "../../api/prescriptions";

import {
  getFavoriteByProduct,
  addFavorite,
  removeFavorite,
} from "../../api/favorites";

const LENS_TYPES = [
  {
    value: "FRAME_ONLY",
    label: "Frame Only",
  },
  {
    value: "STANDARD",
    label: "Standard",
  },
  {
    value: "THIN",
    label: "Thin",
  },
  {
    value: "PROGRESSIVE",
    label: "Progressive",
  },
  {
    value: "PHOTOCHROMIC",
    label: "Photochromic",
  },
  {
    value: "BLUE_LIGHT",
    label: "Blue Light",
  },
  {
    value: "TRANSITIONS",
    label: "Transitions",
  },
  {
    value: "DRIVING",
    label: "Driving",
  },
];

const COATINGS = [
  {
    value: "NONE",
    label: "None",
  },
  {
    value: "ANTI_REFLECTIVE",
    label: "Anti-Reflective",
  },
  {
    value: "SUPER_HYDROPHOBIC",
    label: "Super Hydrophobic",
  },
  {
    value: "UV_PROTECTION",
    label: "UV Protection",
  },
  {
    value: "SCRATCH_RESISTANT",
    label: "Scratch Resistant",
  },
];

function formatValue(value) {
  if (!value) {
    return "";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ProductDetailsScreen({ route, navigation }) {
  const { productId } = route.params;

  /*
   * A face image may be supplied when returning
   * from FaceScan or when opening this screen
   * from Recommendations.
   */
  const initialImageUri = route?.params?.imageUri || null;

  const [product, setProduct] = useState(null);

  const [loading, setLoading] = useState(true);

  const [adding, setAdding] = useState(false);

  const [error, setError] = useState("");

  const [lensType, setLensType] = useState("FRAME_ONLY");

  const [coating, setCoating] = useState("NONE");

  const [quantity, setQuantity] = useState(1);

  const [prescriptions, setPrescriptions] = useState([]);

  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const [prescriptionVisible, setPrescriptionVisible] = useState(false);

  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);

  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [faceImageUri, setFaceImageUri] = useState(initialImageUri);

  const requiresPrescription = lensType !== "FRAME_ONLY";

  // =========================================
  // LOAD PRODUCT
  // =========================================

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getProductById(productId);

        if (result.error) {
          setError(result.error.message);
          return;
        }

        setProduct(result.data);
      } catch (err) {
        console.error("Product details error:", err);

        setError(
          err.response?.data?.error?.message || "Unable to load product.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  // =========================================
  // LOAD PRESCRIPTIONS
  // =========================================

  useEffect(() => {
    const loadPrescriptions = async () => {
      try {
        setPrescriptionLoading(true);

        const result = await getPrescriptions();

        if (result.error) {
          return;
        }

        setPrescriptions(result.data || []);
      } catch (err) {
        console.error("Load prescriptions error:", err);
      } finally {
        setPrescriptionLoading(false);
      }
    };

    loadPrescriptions();
  }, []);

  // =========================================
  // LOAD FAVORITE STATUS
  // =========================================

  useEffect(() => {
    const loadFavoriteStatus = async () => {
      try {
        const result = await getFavoriteByProduct(productId);

        if (!result.error) {
          setIsFavorite(true);
        } else {
          setIsFavorite(false);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setIsFavorite(false);
          return;
        }

        console.error("Load favorite status error:", err);
      }
    };

    loadFavoriteStatus();
  }, [productId]);

  // =========================================
  // UPDATE FACE IMAGE AFTER RETURN FROM SCAN
  // =========================================

  useEffect(() => {
    const returnedImageUri = route?.params?.imageUri || null;

    if (returnedImageUri) {
      console.log("PRODUCT DETAILS: RECEIVED FACE IMAGE", returnedImageUri);

      setFaceImageUri(returnedImageUri);
    }
  }, [route?.params?.imageUri]);

  // =========================================
  // CLEAR PRESCRIPTION WHEN FRAME ONLY
  // =========================================

  useEffect(() => {
    if (!requiresPrescription) {
      setSelectedPrescription(null);
    }
  }, [requiresPrescription]);

  // =========================================
  // TOGGLE FAVORITE
  // =========================================

  const toggleFavorite = async () => {
    if (!product) {
      return;
    }

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        const result = await removeFavorite(product._id);

        if (result.error) {
          Alert.alert("Unable to Remove", result.error.message);
          return;
        }

        setIsFavorite(false);

        return;
      }

      const result = await addFavorite(product._id);

      if (result.error) {
        Alert.alert("Unable to Favorite", result.error.message);
        return;
      }

      setIsFavorite(true);
    } catch (err) {
      console.error("Favorite error:", err);

      Alert.alert(
        "Unable to Update Favorite",
        err.response?.data?.error?.message ||
          "Unable to update your favorites.",
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  // =========================================
  // QUANTITY
  // =========================================

  const increaseQuantity = () => {
    if (!product) {
      return;
    }

    if (quantity < product.stock) {
      setQuantity((current) => current + 1);
    }
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  // =========================================
  // VIRTUAL TRY-ON
  // =========================================

  const handleVirtualTryOn = () => {
    if (!product?._id) {
      return;
    }

    if (!product.tryOnImage) {
      Alert.alert(
        "Virtual Try-On Unavailable",
        "This frame does not have a Virtual Try-On asset configured yet.",
      );

      return;
    }

    /*
     * We already have a face photo.
     * Go directly to Virtual Try-On.
     */
    if (faceImageUri) {
      navigation.navigate("VirtualTryOn", {
        product,
        productId: product._id,
        imageUri: faceImageUri,
      });

      return;
    }

    /*
     * No face photo yet.
     *
     * Send the user through Face Scan and
     * tell FaceScanScreen where to return.
     */
    navigation.navigate("FaceScan", {
      returnTo: "ProductDetails",
      returnProductId: product._id,
    });
  };

  // =========================================
  // ADD TO CART
  // =========================================

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    if (product.stock < 1) {
      Alert.alert("Out of Stock", "This product is currently unavailable.");
      return;
    }

    if (quantity > product.stock) {
      Alert.alert(
        "Insufficient Stock",
        "The selected quantity is greater than the available stock.",
      );

      return;
    }

    if (requiresPrescription && !selectedPrescription) {
      Alert.alert(
        "Prescription Required",
        "Please select a prescription before adding prescription lenses to your cart.",
      );

      return;
    }

    try {
      setAdding(true);

      const payload = {
        productId: product._id,

        quantity,

        lensType,

        prescriptionId: requiresPrescription ? selectedPrescription._id : null,

        coating,
      };

      console.log("Adding to cart:", payload);

      const result = await addToCart(payload);

      if (result.error) {
        Alert.alert("Unable to Add", result.error.message);
        return;
      }

      Alert.alert(
        "Added to Cart",
        `${product.name} has been added to your cart.`,
        [
          {
            text: "Continue Shopping",
            style: "cancel",
          },
          {
            text: "View Cart",
            onPress: () =>
              navigation.navigate("MainTabs", {
                screen: "Cart",
              }),
          },
        ],
      );
    } catch (err) {
      console.error("Add to cart status:", err.response?.status);

      console.error(
        "Add to cart response:",
        JSON.stringify(err.response?.data, null, 2),
      );

      console.error(
        "Add to cart request:",
        JSON.stringify(err.config?.data, null, 2),
      );

      Alert.alert(
        "Unable to Add",
        err.response?.data?.error?.message ||
          "Unable to add this product to your cart.",
      );
    } finally {
      setAdding(false);
    }
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Product not found."}</Text>
      </View>
    );
  }

  const image = product.images?.[0];

  const selectedLens = LENS_TYPES.find((item) => item.value === lensType);

  const selectedCoating = COATINGS.find((item) => item.value === coating);

  const hasTryOnImage = Boolean(product.tryOnImage);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* =========================================
          PRODUCT IMAGE
      ========================================== */}

      <View style={styles.imageContainer}>
        {image ? (
          <Image
            source={{
              uri: image,
            }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>VisionFit</Text>
          </View>
        )}
      </View>

      {/* =========================================
          VIRTUAL TRY-ON
      ========================================== */}

      <Pressable
        style={[
          styles.tryOnButton,
          !hasTryOnImage && styles.tryOnButtonDisabled,
        ]}
        onPress={handleVirtualTryOn}
        disabled={!hasTryOnImage}
      >
        <Text style={styles.tryOnButtonText}>
          {hasTryOnImage ? "Try This Frame On" : "Virtual Try-On Unavailable"}
        </Text>
      </Pressable>

      <Text style={styles.tryOnHint}>
        {hasTryOnImage
          ? faceImageUri
            ? "Use your latest face scan to preview this frame."
            : "Complete a face scan to preview this frame."
          : "This frame does not have a Virtual Try-On asset yet."}
      </Text>

      {/* =========================================
          PRODUCT INFORMATION
      ========================================== */}

      <View style={styles.productHeaderRow}>
        <View style={styles.productHeaderInfo}>
          <Text style={styles.brand}>{product.brand}</Text>

          <Text style={styles.name}>{product.name}</Text>

          <Text style={styles.price}>
            ₱{Number(product.price).toLocaleString()}
          </Text>
        </View>

        <Pressable
          style={styles.favoriteButton}
          onPress={toggleFavorite}
          disabled={favoriteLoading}
        >
          <Text style={styles.favoriteIcon}>{isFavorite ? "♥" : "♡"}</Text>
        </Pressable>
      </View>

      <Text style={styles.stock}>
        {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
      </Text>

      <View style={styles.divider} />

      {/* =========================================
          DESCRIPTION
      ========================================== */}

      <Text style={styles.sectionTitle}>Description</Text>

      <Text style={styles.description}>
        {product.description || "No description available."}
      </Text>

      {/* =========================================
          FRAME DETAILS
      ========================================== */}

      <Text style={styles.sectionTitle}>Frame Details</Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Shape</Text>

          <Text style={styles.infoValue}>{product.frameShape}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Material</Text>

          <Text style={styles.infoValue}>{product.material}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Category</Text>

          <Text style={styles.infoValue}>{product.category}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Gender</Text>

          <Text style={styles.infoValue}>{product.genderCategory}</Text>
        </View>
      </View>

      {/* =========================================
          LENS TYPE
      ========================================== */}

      <Text style={styles.sectionTitle}>Lens Type</Text>

      <Text style={styles.helperText}>Choose the type of lens you want.</Text>

      <View style={styles.options}>
        {LENS_TYPES.map((option) => {
          const selected = lensType === option.value;

          return (
            <Pressable
              key={option.value}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => setLensType(option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* =========================================
          PRESCRIPTION
      ========================================== */}

      {requiresPrescription ? (
        <>
          <Text style={styles.sectionTitle}>Prescription</Text>

          {prescriptionLoading ? (
            <View style={styles.prescriptionLoading}>
              <ActivityIndicator />

              <Text style={styles.prescriptionLoadingText}>
                Loading prescriptions...
              </Text>
            </View>
          ) : prescriptions.length === 0 ? (
            <View style={styles.prescriptionNotice}>
              <Text style={styles.prescriptionTitle}>
                No saved prescriptions
              </Text>

              <Text style={styles.prescriptionText}>
                Add a prescription before purchasing prescription lenses.
              </Text>

              <Pressable
                style={styles.addPrescriptionButton}
                onPress={() => navigation.navigate("AddPrescription")}
              >
                <Text style={styles.addPrescriptionButtonText}>
                  Add Prescription
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Pressable
                style={styles.prescriptionSelector}
                onPress={() => setPrescriptionVisible(true)}
              >
                <View>
                  <Text style={styles.selectorLabel}>
                    Selected Prescription
                  </Text>

                  <Text style={styles.selectorValue}>
                    {selectedPrescription
                      ? selectedPrescription.name
                      : "Choose a prescription"}
                  </Text>
                </View>

                <Text style={styles.selectorArrow}>›</Text>
              </Pressable>

              {selectedPrescription ? (
                <View style={styles.selectedPrescription}>
                  <Text style={styles.selectedPrescriptionTitle}>
                    {selectedPrescription.name}
                  </Text>

                  <Text style={styles.selectedPrescriptionText}>
                    OD: {selectedPrescription.OD?.sph} /{" "}
                    {selectedPrescription.OD?.cyl} /{" "}
                    {selectedPrescription.OD?.axis}
                  </Text>

                  <Text style={styles.selectedPrescriptionText}>
                    OS: {selectedPrescription.OS?.sph} /{" "}
                    {selectedPrescription.OS?.cyl} /{" "}
                    {selectedPrescription.OS?.axis}
                  </Text>

                  <Text style={styles.selectedPrescriptionText}>
                    PD: {selectedPrescription.pd} mm
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </>
      ) : null}

      {/* =========================================
          COATING
      ========================================== */}

      <Text style={styles.sectionTitle}>Lens Coating</Text>

      <View style={styles.options}>
        {COATINGS.map((option) => {
          const selected = coating === option.value;

          return (
            <Pressable
              key={option.value}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => setCoating(option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* =========================================
          QUANTITY
      ========================================== */}

      <Text style={styles.sectionTitle}>Quantity</Text>

      <View style={styles.quantityRow}>
        <Pressable style={styles.quantityButton} onPress={decreaseQuantity}>
          <Text style={styles.quantityButtonText}>−</Text>
        </Pressable>

        <Text style={styles.quantity}>{quantity}</Text>

        <Pressable
          style={[
            styles.quantityButton,
            quantity >= product.stock && styles.disabledButton,
          ]}
          onPress={increaseQuantity}
          disabled={quantity >= product.stock}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </Pressable>
      </View>

      {/* =========================================
          SUMMARY
      ========================================== */}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Your Selection</Text>

        <Text style={styles.summaryText}>Lens: {selectedLens?.label}</Text>

        <Text style={styles.summaryText}>
          Coating: {selectedCoating?.label}
        </Text>

        {requiresPrescription ? (
          <Text style={styles.summaryText}>
            Prescription:{" "}
            {selectedPrescription ? selectedPrescription.name : "Not selected"}
          </Text>
        ) : null}

        <Text style={styles.summaryText}>Quantity: {quantity}</Text>

        <Text style={styles.summaryPrice}>
          Total frame price: ₱
          {(Number(product.price) * quantity).toLocaleString()}
        </Text>
      </View>

      {/* =========================================
          ADD TO CART
      ========================================== */}

      <Pressable
        style={[
          styles.addButton,
          (adding || product.stock < 1) && styles.disabledAddButton,
        ]}
        onPress={handleAddToCart}
        disabled={adding || product.stock < 1}
      >
        {adding ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.addButtonText}>
            {product.stock < 1 ? "Out of Stock" : "Add to Cart"}
          </Text>
        )}
      </Pressable>

      {/* =========================================
          PRESCRIPTION PICKER MODAL
      ========================================== */}

      <Modal
        visible={prescriptionVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPrescriptionVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.prescriptionModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Prescription</Text>

              <Pressable onPress={() => setPrescriptionVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>

            {prescriptionLoading ? (
              <ActivityIndicator size="large" />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {prescriptions.map((prescription) => {
                  const selected =
                    selectedPrescription?._id === prescription._id;

                  return (
                    <Pressable
                      key={prescription._id}
                      style={[
                        styles.prescriptionOption,
                        selected && styles.prescriptionOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedPrescription(prescription);

                        setPrescriptionVisible(false);
                      }}
                    >
                      <View>
                        <Text style={styles.prescriptionOptionTitle}>
                          {prescription.name}
                        </Text>

                        <Text style={styles.prescriptionOptionType}>
                          {formatValue(prescription.prescriptionType)}
                        </Text>

                        <Text style={styles.prescriptionOptionValues}>
                          OD {prescription.OD?.sph} / {prescription.OD?.cyl} /{" "}
                          {prescription.OD?.axis}
                        </Text>

                        <Text style={styles.prescriptionOptionValues}>
                          OS {prescription.OS?.sph} / {prescription.OS?.cyl} /{" "}
                          {prescription.OS?.axis}
                        </Text>
                      </View>

                      {selected ? <Text style={styles.check}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <Pressable
              style={styles.newPrescriptionButton}
              onPress={() => {
                setPrescriptionVisible(false);

                navigation.navigate("AddPrescription");
              }}
            >
              <Text style={styles.newPrescriptionButtonText}>
                + Add New Prescription
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    color: "#666666",
  },

  errorText: {
    color: "#444444",
    textAlign: "center",
  },

  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#F2F2F2",
    marginBottom: 14,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#888888",
  },

  // =========================================
  // VIRTUAL TRY-ON
  // =========================================

  tryOnButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 7,
  },

  tryOnButtonDisabled: {
    backgroundColor: "#D6D6D6",
  },

  tryOnButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  tryOnHint: {
    color: "#777777",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginBottom: 20,
  },

  productHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  productHeaderInfo: {
    flex: 1,
    marginRight: 15,
  },

  brand: {
    fontSize: 13,
    color: "#777777",
    marginBottom: 5,
  },

  name: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },

  price: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 5,
  },

  favoriteButton: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },

  favoriteIcon: {
    fontSize: 24,
  },

  stock: {
    fontSize: 13,
    color: "#666666",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 22,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#555555",
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },

  infoItem: {
    width: "50%",
    marginBottom: 16,
  },

  infoLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "700",
  },

  helperText: {
    fontSize: 13,
    color: "#777777",
    marginBottom: 12,
  },

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  option: {
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  optionSelected: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },

  optionText: {
    fontSize: 12,
    fontWeight: "600",
  },

  optionTextSelected: {
    color: "#FFFFFF",
  },

  prescriptionLoading: {
    alignItems: "center",
    paddingVertical: 20,
  },

  prescriptionLoadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#777777",
  },

  prescriptionNotice: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 12,
  },

  prescriptionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 5,
  },

  prescriptionText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#666666",
  },

  prescriptionSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },

  selectorLabel: {
    fontSize: 11,
    color: "#888888",
    marginBottom: 4,
  },

  selectorValue: {
    fontSize: 14,
    fontWeight: "700",
  },

  selectorArrow: {
    fontSize: 26,
    color: "#777777",
  },

  selectedPrescription: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  selectedPrescriptionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },

  selectedPrescriptionText: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 3,
  },

  addPrescriptionButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#111111",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  addPrescriptionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 20,
  },

  quantityButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  quantityButtonText: {
    fontSize: 22,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.3,
  },

  quantity: {
    width: 55,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },

  summary: {
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },

  summaryText: {
    fontSize: 13,
    marginBottom: 5,
    color: "#555555",
  },

  summaryPrice: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },

  addButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  disabledAddButton: {
    opacity: 0.5,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  prescriptionModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: "80%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  closeText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "600",
  },

  prescriptionOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },

  prescriptionOptionSelected: {
    borderColor: "#111111",
    backgroundColor: "#F5F5F5",
  },

  prescriptionOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },

  prescriptionOptionType: {
    fontSize: 11,
    color: "#888888",
    marginBottom: 7,
  },

  prescriptionOptionValues: {
    fontSize: 11,
    color: "#666666",
    marginBottom: 2,
  },

  check: {
    fontSize: 18,
    fontWeight: "800",
  },

  newPrescriptionButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  newPrescriptionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
