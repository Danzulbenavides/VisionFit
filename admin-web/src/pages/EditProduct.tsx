import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import apiClient from "../api/client";
import { updateProduct, type Product } from "../api/products";

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setError("Product ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get(`/products/${id}`);

        const loadedProduct: Product = response.data.data;

        if (!loadedProduct) {
          throw new Error("Product not found.");
        }

        setProduct(loadedProduct);

        setForm({
          name: loadedProduct.name || "",
          brand: loadedProduct.brand || "",
          description: loadedProduct.description || "",
          price:
            loadedProduct.price !== undefined
              ? String(loadedProduct.price)
              : "",
          stock:
            loadedProduct.stock !== undefined
              ? String(loadedProduct.stock)
              : "",
          category: loadedProduct.category || "",
          frameShape: loadedProduct.frameShape || "",
          material: loadedProduct.material || "",
          genderCategory: loadedProduct.genderCategory || "",
          imageUrl: loadedProduct.images?.[0] || "",
        });
      } catch (err: any) {
        console.error("Load product error:", err);

        setError(
          err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            err?.message ||
            "Unable to load product.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

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

    if (!id) {
      setError("Product ID is missing.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateProduct(id, {
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

      setSuccess("Product updated successfully.");

      setTimeout(() => {
        navigate("/products");
      }, 1000);
    } catch (err: any) {
      console.error("Update product error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update product.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="admin-empty">
        <h2>Product not found</h2>

        {error && <p>{error}</p>}

        <button
          className="secondary-admin-button"
          onClick={() => navigate("/products")}
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">CATALOG</p>

          <h1>Edit Product</h1>

          <p className="page-description">
            Update the information for this VisionFit product.
          </p>
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

          <small>The URL is stored in the product's images array.</small>
        </div>

        {error && <div className="form-error">{error}</div>}

        {success && <div className="form-success">{success}</div>}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/products")}
            disabled={saving}
          >
            Cancel
          </button>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
