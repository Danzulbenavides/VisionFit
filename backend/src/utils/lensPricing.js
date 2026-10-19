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
// unitPrice = frame price + lens price + coating price
// =========================================

export const calculateUnitPrice = (product, lensType, coating) => {
  const framePrice = Number(product?.price || 0);
  const lensPrice = getLensTypePrice(product, lensType);
  const coatingPrice = getCoatingPrice(product, coating);

  return {
    framePrice,
    lensPrice,
    coatingPrice,
    unitPrice: framePrice + lensPrice + coatingPrice,
  };
};
