// =========================================
// LENS TYPE & COATING PRICING
// =========================================

export const LENS_TYPES = [
  "FRAME_ONLY",
  "STANDARD",
  "THIN",
  "PROGRESSIVE",
  "PHOTOCHROMIC",
  "BLUE_LIGHT",
  "TRANSITIONS",
  "DRIVING",
];

export const COATINGS = [
  "NONE",
  "ANTI_REFLECTIVE",
  "SUPER_HYDROPHOBIC",
  "UV_PROTECTION",
  "SCRATCH_RESISTANT",
];

// =========================================
// DEFAULT PRICES
// Used as schema defaults for new products
// and by scripts/set-lens-prices.js.
// =========================================

export const DEFAULT_LENS_TYPE_PRICES = {
  FRAME_ONLY: 0,
  STANDARD: 500,
  THIN: 800,
  PROGRESSIVE: 1500,
  PHOTOCHROMIC: 1200,
  BLUE_LIGHT: 700,
  TRANSITIONS: 1200,
  DRIVING: 900,
};

export const DEFAULT_COATING_PRICES = {
  NONE: 0,
  ANTI_REFLECTIVE: 300,
  SUPER_HYDROPHOBIC: 500,
  UV_PROTECTION: 200,
  SCRATCH_RESISTANT: 150,
};

// =========================================
// PRICE LOOKUPS
// =========================================

export const getLensTypePrice = (product, lensType) => {
  return Number(product?.lensTypePrices?.[lensType] || 0);
};

export const getCoatingPrice = (product, coating) => {
  return Number(product?.coatingPrices?.[coating] || 0);
};

// =========================================
// UNIT PRICE CALCULATION
// unitPrice = frame price + lens prices + coating prices
// lensType/coating may be a single string (legacy cart/order docs)
// or an array of selections - each selection's add-on is summed.
// =========================================

export const normalizeSelections = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value) {
    return [value];
  }
  return [];
};

export const calculateUnitPrice = (product, lensType, coating) => {
  const framePrice = Number(product?.price || 0);
  const lensPrice = normalizeSelections(lensType).reduce(
    (sum, value) => sum + getLensTypePrice(product, value),
    0,
  );
  const coatingPrice = normalizeSelections(coating).reduce(
    (sum, value) => sum + getCoatingPrice(product, value),
    0,
  );

  return {
    framePrice,
    lensPrice,
    coatingPrice,
    unitPrice: framePrice + lensPrice + coatingPrice,
  };
};
