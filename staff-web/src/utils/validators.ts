// Shared form validators for the admin web.
// Every function returns an error message, or "" when the value is valid.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_REGEX = /^[A-Za-z][A-Za-z\s-]*$/;
export const PH_PHONE_REGEX = /^09\d{9}$/;

export const validateName = (value: string, label = "Name"): string => {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2) return `${label} must be at least 2 characters.`;
  if (v.length > 50) return `${label} must be at most 50 characters.`;
  if (!NAME_REGEX.test(v)) return `${label} may only contain letters, spaces and hyphens.`;
  return "";
};

export const validateEmail = (value: string): string => {
  const v = value.trim();
  if (!v) return "Email is required.";
  if (!EMAIL_REGEX.test(v)) return "Enter a valid email address.";
  return "";
};

export const validatePhone = (value: string): string => {
  const v = value.trim();
  if (!v) return "Phone number is required.";
  if (!PH_PHONE_REGEX.test(v)) {
    return "Enter a valid 11-digit mobile number starting with 09.";
  }
  return "";
};

export const PASSWORD_HINT =
  "At least 8 characters with an uppercase letter, lowercase letter, number and special character.";

export const validatePassword = (value: string): string => {
  if (!value) return "Password is required.";
  if (
    value.length < 8 ||
    !/[A-Z]/.test(value) ||
    !/[a-z]/.test(value) ||
    !/\d/.test(value) ||
    !/[^A-Za-z0-9]/.test(value)
  ) {
    return PASSWORD_HINT;
  }
  return "";
};

// ---------- dropdown options (must match backend enums) ----------

export const CATEGORY_OPTIONS = [
  { value: "EYEGLASSES", label: "Eyeglasses" },
  { value: "SUNGLASSES", label: "Sunglasses" },
  { value: "BLUE_LIGHT", label: "Blue Light" },
];

export const FRAME_SHAPE_OPTIONS = [
  { value: "SQUARE", label: "Square" },
  { value: "RECTANGLE", label: "Rectangle" },
  { value: "ROUND", label: "Round" },
  { value: "CAT_EYE", label: "Cat Eye" },
  { value: "BROWLINE", label: "Browline" },
  { value: "AVIATOR", label: "Aviator" },
  { value: "BUTTERFLY", label: "Butterfly" },
  { value: "GEOMETRIC", label: "Geometric" },
];

export const MATERIAL_OPTIONS = [
  { value: "TR90", label: "TR90" },
  { value: "ACETATE", label: "Acetate" },
  { value: "PLASTIC", label: "Plastic" },
  { value: "METAL", label: "Metal" },
  { value: "TITANIUM", label: "Titanium" },
  { value: "MIXED", label: "Mixed" },
];

export const GENDER_OPTIONS = [
  { value: "WOMEN", label: "Women" },
  { value: "MEN", label: "Men" },
  { value: "UNISEX", label: "Unisex" },
];

export const LENS_TYPE_OPTIONS = [
  { value: "FRAME_ONLY", label: "Frame Only" },
  { value: "STANDARD", label: "Standard" },
  { value: "THIN", label: "Thin" },
  { value: "PROGRESSIVE", label: "Progressive" },
  { value: "PHOTOCHROMIC", label: "Photochromic" },
  { value: "BLUE_LIGHT", label: "Blue Light" },
  { value: "TRANSITIONS", label: "Transitions" },
  { value: "DRIVING", label: "Driving" },
];

export const COATING_OPTIONS = [
  { value: "NONE", label: "None" },
  { value: "ANTI_REFLECTIVE", label: "Anti-Reflective" },
  { value: "SUPER_HYDROPHOBIC", label: "Super Hydrophobic" },
  { value: "UV_PROTECTION", label: "UV Protection" },
  { value: "SCRATCH_RESISTANT", label: "Scratch Resistant" },
];

// Brand is a dropdown too. "OTHER" reveals a text box.
export const BRAND_OPTIONS = [
  "VisionFit",
  "Ray-Ban",
  "Oakley",
  "Persol",
  "Gentle Monster",
  "Local Brand",
];

export interface ProductFormValues {
  name: string;
  brand: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  frameShape: string;
  material: string;
  genderCategory: string;
  imageUrl: string;
  tryOnImage: string;
  lensTypePrices: Record<string, string>;
  coatingPrices: Record<string, string>;
}

// Highest price a product can be listed at (₱)
export const MAX_PRICE = 50000;

// Longest product name allowed (characters)
export const MAX_NAME_LENGTH = 35;

export type FormErrors<T> = Partial<Record<keyof T, string>>;

const oneOf = (value: string, options: { value: string }[]) =>
  options.some((o) => o.value === value);

export const validateProductForm = (
  form: ProductFormValues,
): FormErrors<ProductFormValues> => {
  const errors: FormErrors<ProductFormValues> = {};

  const name = form.name.trim();
  if (!name) errors.name = "Product name is required.";
  else if (name.length < 2) errors.name = "Product name must be at least 2 characters.";
  else if (name.length > MAX_NAME_LENGTH) errors.name = `Product name must be at most ${MAX_NAME_LENGTH} characters.`;

  if (!form.brand.trim()) errors.brand = "Select a brand.";

  const description = form.description.trim();
  if (!description) errors.description = "Description is required.";
  else if (description.length > 2000) errors.description = "Description must be at most 2000 characters.";

  const price = Number(form.price);
  if (form.price.trim() === "") errors.price = "Price is required.";
  else if (!Number.isFinite(price) || price <= 0) errors.price = "Price must be greater than 0.";
  else if (price > MAX_PRICE) errors.price = `Price cannot be more than ₱${MAX_PRICE.toLocaleString()}.`;

  const validatePriceMap = (
    prices: Record<string, string> | undefined,
    field: "lensTypePrices" | "coatingPrices",
    label: string,
  ) => {
    if (!prices) return;

    for (const rawValue of Object.values(prices)) {
      if (rawValue.trim() === "") continue;

      const value = Number(rawValue);

      if (!Number.isFinite(value) || value < 0) {
        errors[field] = `${label} prices must be 0 or higher.`;
        break;
      }

      if (value > MAX_PRICE) {
        errors[field] = `${label} prices cannot be more than ₱${MAX_PRICE.toLocaleString()}.`;
        break;
      }
    }
  };

  validatePriceMap(form.lensTypePrices, "lensTypePrices", "Lens");
  validatePriceMap(form.coatingPrices, "coatingPrices", "Coating");

  const stock = Number(form.stock);
  if (form.stock.trim() === "") errors.stock = "Stock is required.";
  else if (!Number.isInteger(stock) || stock < 0) errors.stock = "Stock must be a whole number, 0 or higher.";
  else if (stock > 1000) errors.stock = "Stock is too large.";

  if (!oneOf(form.category, CATEGORY_OPTIONS)) errors.category = "Select a category.";
  if (!oneOf(form.frameShape, FRAME_SHAPE_OPTIONS)) errors.frameShape = "Select a frame shape.";
  if (!oneOf(form.material, MATERIAL_OPTIONS)) errors.material = "Select a material.";
  if (!oneOf(form.genderCategory, GENDER_OPTIONS)) errors.genderCategory = "Select a gender category.";

  const url = form.imageUrl.trim();
  if (url && !/^https?:\/\/\S+\.\S+/i.test(url)) {
    errors.imageUrl = "Image URL must start with http:// or https://";
  }

  const tryOnUrl = form.tryOnImage.trim();
  if (tryOnUrl && !/^https?:\/\/\S+\.\S+/i.test(tryOnUrl)) {
    errors.tryOnImage = "Virtual Try-On image must be an http:// or https:// URL.";
  }

  return errors;
};
