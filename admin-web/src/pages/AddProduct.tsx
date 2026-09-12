import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../api/products";

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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

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

      <form className="product-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name</label>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            maxLength={150}
            required
          />
        </div>

        <div className="form-group">
          <label>Brand</label>

          <input
            type="text"
            name="brand"
            value={form.brand}
            onChange={handleChange}
            maxLength={100}
            placeholder="VisionFit"
          />
        </div>

        <div className="form-group">
          <label>Description</label>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            maxLength={2000}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price</label>

            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Stock</label>

            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              min="0"
              step="1"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              <option value="EYEGLASSES">Eyeglasses</option>
              <option value="SUNGLASSES">Sunglasses</option>
              <option value="BLUE_LIGHT">Blue Light</option>
            </select>
          </div>

          <div className="form-group">
            <label>Frame Shape</label>

            <select
              name="frameShape"
              value={form.frameShape}
              onChange={handleChange}
              required
            >
              <option value="">Select frame shape</option>
              <option value="SQUARE">Square</option>
              <option value="RECTANGLE">Rectangle</option>
              <option value="ROUND">Round</option>
              <option value="CAT_EYE">Cat Eye</option>
              <option value="BROWLINE">Browline</option>
              <option value="AVIATOR">Aviator</option>
              <option value="BUTTERFLY">Butterfly</option>
              <option value="GEOMETRIC">Geometric</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Material</label>

            <select
              name="material"
              value={form.material}
              onChange={handleChange}
              required
            >
              <option value="">Select material</option>
              <option value="TR90">TR90</option>
              <option value="ACETATE">Acetate</option>
              <option value="PLASTIC">Plastic</option>
              <option value="METAL">Metal</option>
              <option value="TITANIUM">Titanium</option>
              <option value="MIXED">Mixed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Gender Category</label>

            <select
              name="genderCategory"
              value={form.genderCategory}
              onChange={handleChange}
              required
            >
              <option value="">Select gender</option>
              <option value="WOMEN">Women</option>
              <option value="MEN">Men</option>
              <option value="UNISEX">Unisex</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Image URL</label>

          <input
            type="text"
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />

          <small>This will be stored in the product's images array.</small>
        </div>

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
