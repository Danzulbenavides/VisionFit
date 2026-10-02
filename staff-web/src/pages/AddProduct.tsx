import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../api/products";
import ProductFormFields from "../components/ProductFormFields";
import {
  validateProductForm,
  type FormErrors,
  type ProductFormValues,
} from "../utils/validators";

const AddProduct = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    brand: "VisionFit",
    description: "",
    price: "",
    stock: "",
    category: "",
    frameShape: "",
    material: "",
    genderCategory: "",
    imageUrl: "",
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

  const handleSubmit = async (e: FormEvent) => {
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
    } catch (err: any) {
      console.error("Create product error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create product.",
      );
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
