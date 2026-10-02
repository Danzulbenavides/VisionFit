import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";

import { getProducts } from "../../api/products";
import ProductCard from "../../components/ProductCard";

// These values must match the backend enums exactly
const FRAME_SHAPES = [
  "SQUARE",
  "RECTANGLE",
  "ROUND",
  "CAT_EYE",
  "BROWLINE",
  "AVIATOR",
  "BUTTERFLY",
  "GEOMETRIC",
];

const CATEGORIES = ["EYEGLASSES", "SUNGLASSES", "BLUE_LIGHT"];

const MATERIALS = ["TR90", "ACETATE", "PLASTIC", "METAL", "TITANIUM", "MIXED"];

const GENDERS = ["WOMEN", "MEN", "UNISEX"];

// CAT_EYE -> "Cat Eye", BLUE_LIGHT -> "Blue Light", TR90 stays "TR90"
const prettify = (value) =>
  value
    .split("_")
    .map((word) =>
      /\d/.test(word) ? word : word.charAt(0) + word.slice(1).toLowerCase(),
    )
    .join(" ");

// ---------- filter input helpers ----------
const MAX_PRICE = 1000000;
const MAX_STOCK = 100000;

// Digits and one dot, max 2 decimals
const filterMoney = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");

  if (firstDot === -1) return cleaned.slice(0, 7);

  const whole = cleaned.slice(0, firstDot).slice(0, 7);
  const decimals = cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);

  return `${whole}.${decimals}`;
};

const filterDigits = (value) => value.replace(/\D/g, "").slice(0, 6);

const validateMoney = (value, label) => {
  const v = value.trim();

  if (!v) return "";
  if (v === "." || Number.isNaN(Number(v))) return `Enter a valid ${label}.`;
  if (Number(v) > MAX_PRICE) return `${label} is too large.`;

  return "";
};

const validateFilters = ({ minPrice, maxPrice, minStock }) => {
  const errors = {
    minPrice: validateMoney(minPrice, "minimum price"),
    maxPrice: validateMoney(maxPrice, "maximum price"),
    minStock: "",
  };

  if (
    !errors.minPrice &&
    !errors.maxPrice &&
    minPrice.trim() &&
    maxPrice.trim() &&
    Number(minPrice) > Number(maxPrice)
  ) {
    errors.maxPrice = "Max price must be higher than min price.";
  }

  if (minStock.trim()) {
    const stock = Number(minStock);

    if (!Number.isInteger(stock) || stock < 0) {
      errors.minStock = "Enter a whole number, 0 or higher.";
    } else if (stock > MAX_STOCK) {
      errors.minStock = "Minimum stock is too large.";
    }
  }

  return errors;
};

const SORT_OPTIONS = [
  {
    label: "Newest",
    value: "newest",
  },
  {
    label: "Oldest",
    value: "oldest",
  },
  {
    label: "Price: Low to High",
    value: "price_asc",
  },
  {
    label: "Price: High to Low",
    value: "price_desc",
  },
  {
    label: "Name: A to Z",
    value: "name_asc",
  },
  {
    label: "Name: Z to A",
    value: "name_desc",
  },
  {
    label: "Stock: Low to High",
    value: "stock_asc",
  },
  {
    label: "Stock: High to Low",
    value: "stock_desc",
  },
];

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");

  const [frameShape, setFrameShape] = useState("");

  const [category, setCategory] = useState("");

  const [material, setMaterial] = useState("");

  const [genderCategory, setGenderCategory] = useState("");

  const [minPrice, setMinPrice] = useState("");

  const [maxPrice, setMaxPrice] = useState("");

  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [filterVisible, setFilterVisible] = useState(false);

  const [sortVisible, setSortVisible] = useState(false);

  const [minStock, setMinStock] = useState("");

  const [filterErrors, setFilterErrors] = useState({});

  // "overrides" lets us load with new values right away, before React has
  // finished updating the state (used by Sort and Clear filters)
  const loadProducts = async (pageNumber = 1, overrides = {}) => {
    try {
      setLoading(true);
      setError("");

      const current = {
        search,
        frameShape,
        category,
        material,
        genderCategory,
        minPrice,
        maxPrice,
        minStock,
        sort,
        ...overrides,
      };

      const params = {
        page: pageNumber,
        limit: 10,
      };

      if (current.search.trim()) {
        params.search = current.search.trim();
      }

      if (current.frameShape) {
        params.frameShape = current.frameShape;
      }

      if (current.category) {
        params.category = current.category;
      }

      if (current.material) {
        params.material = current.material;
      }

      if (current.genderCategory) {
        params.genderCategory = current.genderCategory;
      }

      if (current.minPrice.trim()) {
        params.minPrice = current.minPrice.trim();
      }

      if (current.maxPrice.trim()) {
        params.maxPrice = current.maxPrice.trim();
      }

      if (current.minStock.trim()) {
        params.minStock = current.minStock.trim();
      }

      if (current.sort) {
        params.sort = current.sort;
      }

      const result = await getProducts(params);

      if (result.error) {
        setError(result.error.message);

        return;
      }

      setProducts(result.data.products || []);

      setPagination(result.data.pagination || null);

      setPage(pageNumber);
    } catch (err) {
      // No console.error: it shows a red toast in Expo. The message below
      // is what the user sees.
      setError(
        err.response?.data?.error?.message || "Unable to load products.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(1);
  }, []);

  const handleSearch = () => {
    loadProducts(1);
  };

  const applyFilters = () => {
    const errors = validateFilters({ minPrice, maxPrice, minStock });

    setFilterErrors(errors);

    // Keep the modal open so the user can fix the highlighted fields
    if (Object.values(errors).some((message) => message)) {
      return;
    }

    setFilterVisible(false);
    loadProducts(1);
  };

  const clearFilters = () => {
    setFrameShape("");
    setCategory("");
    setMaterial("");
    setGenderCategory("");
    setMinPrice("");
    setMaxPrice("");
    setMinStock("");
    setFilterErrors({});

    setFilterVisible(false);

    loadProducts(1, {
      frameShape: "",
      category: "",
      material: "",
      genderCategory: "",
      minPrice: "",
      maxPrice: "",
      minStock: "",
    });
  };

  const applySort = (value) => {
    setSort(value);
    setSortVisible(false);

    loadProducts(1, { sort: value });
  };

  const priceBorder = (field) =>
    filterErrors[field] ? { borderColor: "#D93025" } : null;

  const selectedSortLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.label || "Newest";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop Eyewear</Text>

        <Text style={styles.subtitle}>Find your perfect frame.</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search frames..."
          value={search}
          maxLength={100}
          autoCorrect={false}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />

        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          style={styles.controlButton}
          onPress={() => setFilterVisible(true)}
        >
          <Text style={styles.controlText}>Filters</Text>
        </Pressable>

        <Pressable
          style={styles.controlButton}
          onPress={() => setSortVisible(true)}
        >
          <Text style={styles.controlText}>{selectedSortLabel}</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>Loading eyewear...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() =>
                navigation.navigate("ProductDetails", {
                  productId: item._id,
                })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No eyewear found</Text>

              <Text style={styles.emptyText}>
                Try changing your search or filters.
              </Text>
            </View>
          }
          ListFooterComponent={
            pagination && pagination.totalPages > 1 ? (
              <View style={styles.pagination}>
                <Pressable
                  disabled={!pagination.hasPreviousPage}
                  onPress={() => loadProducts(page - 1)}
                >
                  <Text
                    style={[
                      styles.pageButton,
                      !pagination.hasPreviousPage && styles.disabled,
                    ]}
                  >
                    Previous
                  </Text>
                </Pressable>

                <Text style={styles.pageNumber}>
                  Page {page} of {pagination.totalPages}
                </Text>

                <Pressable
                  disabled={!pagination.hasNextPage}
                  onPress={() => loadProducts(page + 1)}
                >
                  <Text
                    style={[
                      styles.pageButton,
                      !pagination.hasNextPage && styles.disabled,
                    ]}
                  >
                    Next
                  </Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}

      {/* FILTER MODAL */}

      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>

              <Pressable onPress={() => setFilterVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            >
              {/* Frame Shape */}
              <Text style={styles.filterLabel}>Frame Shape</Text>

              <View style={styles.optionRow}>
                {FRAME_SHAPES.map((shape) => (
                  <Pressable
                    key={shape}
                    style={[
                      styles.option,
                      frameShape === shape && styles.optionSelected,
                    ]}
                    onPress={() =>
                      setFrameShape(frameShape === shape ? "" : shape)
                    }
                  >
                    <Text style={styles.optionText}>{prettify(shape)}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Category */}
              <Text style={styles.filterLabel}>Category</Text>

              <View style={styles.optionRow}>
                {CATEGORIES.map((item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.option,
                      category === item && styles.optionSelected,
                    ]}
                    onPress={() => setCategory(category === item ? "" : item)}
                  >
                    <Text style={styles.optionText}>{prettify(item)}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Material */}
              <Text style={styles.filterLabel}>Material</Text>

              <View style={styles.optionRow}>
                {MATERIALS.map((item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.option,
                      material === item && styles.optionSelected,
                    ]}
                    onPress={() => setMaterial(material === item ? "" : item)}
                  >
                    <Text style={styles.optionText}>{prettify(item)}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Gender */}
              <Text style={styles.filterLabel}>Gender</Text>

              <View style={styles.optionRow}>
                {GENDERS.map((item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.option,
                      genderCategory === item && styles.optionSelected,
                    ]}
                    onPress={() =>
                      setGenderCategory(genderCategory === item ? "" : item)
                    }
                  >
                    <Text style={styles.optionText}>{prettify(item)}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Price */}
              <Text style={styles.filterLabel}>Price Range</Text>

              <View style={styles.priceRow}>
                <TextInput
                  style={[styles.priceInput, priceBorder("minPrice")]}
                  placeholder="Min (₱)"
                  keyboardType="decimal-pad"
                  value={minPrice}
                  onChangeText={(value) => {
                    setMinPrice(filterMoney(value));
                    setFilterErrors((previous) => ({ ...previous, minPrice: "", maxPrice: "" }));
                  }}
                />

                <Text style={styles.priceDash}>—</Text>

                <TextInput
                  style={[styles.priceInput, priceBorder("maxPrice")]}
                  placeholder="Max (₱)"
                  keyboardType="decimal-pad"
                  value={maxPrice}
                  onChangeText={(value) => {
                    setMaxPrice(filterMoney(value));
                    setFilterErrors((previous) => ({ ...previous, maxPrice: "" }));
                  }}
                />
              </View>

              {filterErrors.minPrice ? (
                <Text style={styles.fieldError}>{filterErrors.minPrice}</Text>
              ) : null}

              {filterErrors.maxPrice ? (
                <Text style={styles.fieldError}>{filterErrors.maxPrice}</Text>
              ) : null}

              {/* Minimum Stock */}
              <Text style={styles.filterLabel}>Minimum Stock</Text>

              <TextInput
                style={[styles.priceInput, priceBorder("minStock")]}
                placeholder="Minimum stock (whole number)"
                keyboardType="number-pad"
                value={minStock}
                onChangeText={(value) => {
                  setMinStock(filterDigits(value));
                  setFilterErrors((previous) => ({ ...previous, minStock: "" }));
                }}
              />

              {filterErrors.minStock ? (
                <Text style={styles.fieldError}>{filterErrors.minStock}</Text>
              ) : null}

              {/* Actions */}
              <View style={styles.filterActions}>
                <Pressable style={styles.clearButton} onPress={clearFilters}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </Pressable>

                <Pressable style={styles.applyButton} onPress={applyFilters}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldError: {
    color: "#D93025",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 13,
    color: "#666666",
  },

  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  searchButton: {
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: "#111111",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  searchButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  controlsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },

  controlButton: {
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },

  controlText: {
    fontSize: 12,
    fontWeight: "600",
  },

  list: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 30,
  },

  columnWrapper: {
    justifyContent: "space-between",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  filterContent: {
    paddingBottom: 30,
  },

  loadingText: {
    marginTop: 12,
    color: "#666666",
  },

  errorBox: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FCEAEA",
  },

  errorText: {
    fontSize: 13,
  },

  empty: {
    paddingTop: 80,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  emptyText: {
    color: "#777777",
  },

  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 18,
  },

  pageButton: {
    fontWeight: "700",
  },

  disabled: {
    color: "#BBBBBB",
  },

  pageNumber: {
    color: "#666666",
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 20,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 18,
  },

  closeText: {
    fontWeight: "600",
  },

  filterLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },

  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },

  option: {
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  optionSelected: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },

  optionText: {
    fontSize: 11,
    fontWeight: "600",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 22,
  },

  priceInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 10,
    paddingHorizontal: 12,
  },

  priceDash: {
    color: "#777777",
  },

  filterActions: {
    flexDirection: "row",
    gap: 10,
  },

  clearButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  clearButtonText: {
    fontWeight: "700",
  },

  applyButton: {
    flex: 2,
    height: 48,
    backgroundColor: "#111111",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  applyButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  sortOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 30,
  },

  sortContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
  },

  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  sortOptionText: {
    fontSize: 15,
  },
});