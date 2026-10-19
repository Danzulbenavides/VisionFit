import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../api/products";

const LENS_TYPE_OPTIONS = [
  { value: "FRAME_ONLY", label: "Frame Only" },
  { value: "STANDARD", label: "Standard" },
  { value: "THIN", label: "Thin" },
  { value: "PROGRESSIVE", label: "Progressive" },
  { value: "PHOTOCHROMIC", label: "Photochromic" },
  { value: "BLUE_LIGHT", label: "Blue Light" },
  { value: "TRANSITIONS", label: "Transitions" },
  { value: "DRIVING", label: "Driving" },
];

const COATING_OPTIONS = [
  { value: "NONE", label: "None" },
  { value: "ANTI_REFLECTIVE", label: "Anti-Reflective" },
  { value: "SUPER_HYDROPHOBIC", label: "Super Hydrophobic" },
  { value: "UV_PROTECTION", label: "UV Protection" },
  { value: "SCRATCH_RESISTANT", label: "Scratch Resistant" },
];

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

  const handleLensPriceChange = (key: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      lensTypePrices: { ...previous.lensTypePrices, [key]: value },
    }));
  };

  const handleCoatingPriceChange = (key: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      coatingPrices: { ...previous.coatingPrices, [key]: value },
    }));
  };

  const toPriceMap = (prices: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(prices).map(([key, value]) => [key, Number(value) || 0]),
    );

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

        <div className="form-group">
          <label>Lens Type Prices (₱)</label>

          <div className="form-row">
            {LENS_TYPE_OPTIONS.map((option) => (
              <div className="form-group" key={option.value}>
                <label>{option.label}</label>

                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="0"
                  value={form.lensTypePrices[option.value]}
                  onChange={(e) =>
                    handleLensPriceChange(option.value, e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <small>
            Added to the frame price when this lens type is selected. Leave
            blank or 0 for free.
          </small>
        </div>

        <div className="form-group">
          <label>Coating Prices (₱)</label>

          <div className="form-row">
            {COATING_OPTIONS.map((option) => (
              <div className="form-group" key={option.value}>
                <label>{option.label}</label>

                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="0"
                  value={form.coatingPrices[option.value]}
                  onChange={(e) =>
                    handleCoatingPriceChange(option.value, e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <small>
            Added to the frame price when this coating is selected. Leave blank
            or 0 for free.
          </small>
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
