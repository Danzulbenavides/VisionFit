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
}

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
  else if (name.length > 150) errors.name = "Product name must be at most 150 characters.";

  if (form.brand.trim().length > 100) errors.brand = "Brand must be at most 100 characters.";

  const description = form.description.trim();
  if (!description) errors.description = "Description is required.";
  else if (description.length > 2000) errors.description = "Description must be at most 2000 characters.";

  const price = Number(form.price);
  if (form.price.trim() === "") errors.price = "Price is required.";
  else if (!Number.isFinite(price) || price <= 0) errors.price = "Price must be greater than 0.";
  else if (price > 1000000) errors.price = "Price is too large.";

  const stock = Number(form.stock);
  if (form.stock.trim() === "") errors.stock = "Stock is required.";
  else if (!Number.isInteger(stock) || stock < 0) errors.stock = "Stock must be a whole number, 0 or higher.";
  else if (stock > 100000) errors.stock = "Stock is too large.";

  if (!oneOf(form.category, CATEGORY_OPTIONS)) errors.category = "Select a category.";
  if (!oneOf(form.frameShape, FRAME_SHAPE_OPTIONS)) errors.frameShape = "Select a frame shape.";
  if (!oneOf(form.material, MATERIAL_OPTIONS)) errors.material = "Select a material.";
  if (!oneOf(form.genderCategory, GENDER_OPTIONS)) errors.genderCategory = "Select a gender category.";

  const url = form.imageUrl.trim();
  if (url && !/^https?:\/\/\S+\.\S+/i.test(url)) {
    errors.imageUrl = "Image URL must start with http:// or https://";
  }

  return errors;
};
