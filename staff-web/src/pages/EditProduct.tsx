import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import apiClient from "../api/client";
import {
  updateProduct,
  uploadProductImage,
  type Product,
} from "../api/products";
import ProductFormFields from "../components/ProductFormFields";
import {
  validateProductForm,
  LENS_TYPE_OPTIONS,
  COATING_OPTIONS,
  type FormErrors,
  type ProductFormValues,
} from "../utils/validators";

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
    tryOnImage: "",
    lensTypePrices: {} as Record<string, string>,
    coatingPrices: {} as Record<string, string>,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tryOnImageFile, setTryOnImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors<ProductFormValues>>(
    {},
  );
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
          tryOnImage: loadedProduct.tryOnImage || "",
          lensTypePrices: Object.fromEntries(
            LENS_TYPE_OPTIONS.map((option) => [
              option.value,
              loadedProduct.lensTypePrices?.[option.value] !== undefined
                ? String(loadedProduct.lensTypePrices[option.value])
                : "",
            ]),
          ),
          coatingPrices: Object.fromEntries(
            COATING_OPTIONS.map((option) => [
              option.value,
              loadedProduct.coatingPrices?.[option.value] !== undefined
                ? String(loadedProduct.coatingPrices[option.value])
                : "",
            ]),
          ),
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

    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const handleImageFileChange = (file: File | null) => {
    if (
      file &&
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setError("The image must be 5 MB or smaller.");
      return;
    }
    setError("");
    setImageFile(file);
  };

  const handleTryOnImageFileChange = (file: File | null) => {
    if (file && !["image/png", "image/webp"].includes(file.type)) {
      setTryOnImageFile(null);
      setError("Choose a transparent PNG or WebP frame image.");
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setTryOnImageFile(null);
      setError("The frame image must be 5 MB or smaller.");
      return;
    }
    setError("");
    setTryOnImageFile(file);
  };

  const handleTryOnImageUrlChange = (value: string) => {
    setForm((previous) => ({ ...previous, tryOnImage: value }));
    setFieldErrors((previous) => ({ ...previous, tryOnImage: undefined }));
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

  const toPriceMap = (prices: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(prices).map(([key, value]) => [key, Number(value) || 0]),
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!id) {
      setError("Product ID is missing.");
      return;
    }

    const validationErrors = validateProductForm(form);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const uploadedImage = imageFile
        ? await uploadProductImage(imageFile)
        : null;
      const uploadedTryOnImage = tryOnImageFile
        ? await uploadProductImage(tryOnImageFile)
        : null;
      const imageUrl = uploadedImage?.url || form.imageUrl.trim();

      await updateProduct(id, {
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
        images: imageUrl ? [imageUrl] : [],
        tryOnImage: uploadedTryOnImage?.url || form.tryOnImage.trim(),
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

      <form className="product-form" onSubmit={handleSubmit} noValidate>
        <ProductFormFields
          form={form}
          errors={fieldErrors}
          onChange={handleChange}
          onLensPriceChange={handleLensPriceChange}
          onCoatingPriceChange={handleCoatingPriceChange}
          imageFile={imageFile}
          onImageFileChange={handleImageFileChange}
          tryOnImageFile={tryOnImageFile}
          onTryOnImageFileChange={handleTryOnImageFileChange}
          onTryOnImageUrlChange={handleTryOnImageUrlChange}
        />

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
