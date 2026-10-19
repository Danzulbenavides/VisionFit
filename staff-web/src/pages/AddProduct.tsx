import { useState, type React } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../api/products";
import ProductFormFields from "../components/ProductFormFields";
import {
  validateProductForm,
  type FormErrors,
  type ProductFormValues,
} from "../utils/validators";

const LENS_PRICE_DEFAULTS: Record<string, string> = {
  FRAME_ONLY: "0",
  STANDARD: "500",
  THIN: "800",
  PROGRESSIVE: "1500",
  PHOTOCHROMIC: "1200",
  BLUE_LIGHT: "700",
  TRANSITIONS: "1200",
  DRIVING: "900",
};

const COATING_PRICE_DEFAULTS: Record<string, string> = {
  NONE: "0",
  ANTI_REFLECTIVE: "300",
  SUPER_HYDROPHOBIC: "500",
  UV_PROTECTION: "200",
  SCRATCH_RESISTANT: "150",
};

const toPriceMap = (prices: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(prices).map(([key, value]) => [key, Number(value) || 0]),
  );

const AddProduct = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    brand: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    frameShape: "",
    material: "",
    genderCategory: "",
    imageUrl: "",
    lensTypePrices: { ...LENS_PRICE_DEFAULTS },
    coatingPrices: { ...COATING_PRICE_DEFAULTS },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors<ProductFormValues>>({});
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const handleLensPriceChange = (key: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      lensTypePrices: { ...previous.lensTypePrices, [key]: value },
    }));

    setFieldErrors((previous) => ({ ...previous, lensTypePrices: undefined }));
  };

  const handleCoatingPriceChange = (key: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      coatingPrices: { ...previous.coatingPrices, [key]: value },
    }));

    setFieldErrors((previous) => ({ ...previous, coatingPrices: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateProductForm(form);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await createProduct({
        name: form.name.trim(),
        brand: form.brand.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        lensTypePrices: toPriceMap(form.lensTypePrices),
        coatingPrices: toPriceMap(form.coatingPrices),
        stock: Number(form.stock),
        category: form.category,
        frameShape: form.frameShape,
        material: form.material,
        genderCategory: form.genderCategory,
        images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
      });

      setSuccess("Product created successfully.");

      setTimeout(() => {
        navigate("/products");
      }, 1000);
    } catch (err) {
      console.error("Create product error:", err);

      let errorMessage = "Failed to create product.";
      if (err !== null && typeof err === "object") {
        if ("response" in err && err.response !== null) {
          const response = err.response;
          if (response !== null && typeof response === "object" && "data" in response && response.data !== null) {
            const data = response.data;
            if (data !== null && typeof data === "object") {
              if ("error" in data && data.error !== null && typeof data.error === "object" && "message" in data.error && data.error.message !== null) {
                errorMessage = String(data.error.message);
              } else if ("message" in data && data.message !== null) {
                errorMessage = String(data.message);
              }
            }
          }
        } else if ("message" in err && err.message !== null) {
          errorMessage = String((err as { message: unknown }).message);
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Add Product</h1>
          <p>Create a new eyewear product.</p>
        </div>
      </div>

      <form className="product-form" onSubmit={handleSubmit} noValidate>
        <ProductFormFields
          form={form}
          errors={fieldErrors}
          onChange={handleChange}
          onLensPriceChange={handleLensPriceChange}
          onCoatingPriceChange={handleCoatingPriceChange}
        />

        {error && <div className="form-error">{error}</div>}

        {success && <div className="form-success">{success}</div>}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/products")}
            disabled={loading}
          >
            Cancel
          </button>

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
