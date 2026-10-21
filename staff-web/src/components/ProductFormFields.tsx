import { useEffect, useState, type ChangeEvent } from "react";

import {
  MAX_PRICE,
  MAX_NAME_LENGTH,
  BRAND_OPTIONS,
  CATEGORY_OPTIONS,
  FRAME_SHAPE_OPTIONS,
  GENDER_OPTIONS,
  MATERIAL_OPTIONS,
  LENS_TYPE_OPTIONS,
  COATING_OPTIONS,
  type FormErrors,
  type ProductFormValues,
} from "../utils/validators";

interface Option {
  value: string;
  label: string;
}

interface Props {
  form: ProductFormValues;
  errors: FormErrors<ProductFormValues>;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  onLensPriceChange: (key: string, value: string) => void;
  onCoatingPriceChange: (key: string, value: string) => void;
  imageFile: File | null;
  onImageFileChange: (file: File | null) => void;
  tryOnImageFile: File | null;
  onTryOnImageFileChange: (file: File | null) => void;
  onTryOnImageUrlChange: (value: string) => void;
}

function RequiredMark() {
  return <span className="required-mark">*</span>;
}

function Select({
  label,
  name,
  value,
  options,
  placeholder,
  error,
  onChange,
}: {
  label: string;
  name: keyof ProductFormValues;
  value: string;
  options: Option[];
  placeholder: string;
  required?: boolean;
  error?: string;
  onChange: Props["onChange"];
}) {
  return (
    <div className={error ? "form-group form-group-error" : "form-group"}>
      <label>{label}</label>

      <select name={name} value={value} onChange={onChange}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? <small className="field-error">{error}</small> : null}
    </div>
  );
}

export default function ProductFormFields({
  form,
  errors,
  onChange,
  onLensPriceChange,
  onCoatingPriceChange,
  imageFile,
  onImageFileChange,
  tryOnImageFile,
  onTryOnImageFileChange,
  onTryOnImageUrlChange,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState(form.imageUrl);
  const [tryOnPreviewUrl, setTryOnPreviewUrl] = useState(form.tryOnImage);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(form.imageUrl);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, form.imageUrl]);

  useEffect(() => {
    if (!tryOnImageFile) {
      setTryOnPreviewUrl(form.tryOnImage);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(tryOnImageFile);
    setTryOnPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [tryOnImageFile, form.tryOnImage]);

  // Brand is a dropdown. A brand already saved on a product that is not in
  // the list is still shown so editing never wipes it.
  const brandOptions = [...BRAND_OPTIONS];

  if (form.brand && !brandOptions.includes(form.brand)) {
    brandOptions.push(form.brand);
  }

  return (
    <>
      <p className="form-required-note">
        <span className="required-mark">*</span> Required field
      </p>
      <div
        className={errors.name ? "form-group form-group-error" : "form-group"}
      >
        <label>
          Product Name
          <RequiredMark />
        </label>

        <input
          type="text"
          name="name"
          value={form.name}
          onChange={onChange}
          maxLength={MAX_NAME_LENGTH}
        />

        {errors.name ? (
          <small className="field-error">{errors.name}</small>
        ) : null}
      </div>

      <Select
        label="Brand"
        name="brand"
        value={form.brand}
        placeholder="Select brand"
        required
        options={brandOptions.map((b) => ({ value: b, label: b }))}
        error={errors.brand}
        onChange={onChange}
      />

      <div
        className={
          errors.description ? "form-group form-group-error" : "form-group"
        }
      >
        <label>
          Description
          <RequiredMark />
        </label>

        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows={4}
          maxLength={2000}
        />

        {errors.description ? (
          <small className="field-error">{errors.description}</small>
        ) : null}
      </div>

      <div className="form-row">
        <div
          className={
            errors.price ? "form-group form-group-error" : "form-group"
          }
        >
          <label>
            Price (₱)
            <RequiredMark />
          </label>

          <input
            type="number"
            name="price"
            value={form.price}
            onChange={onChange}
            min="0"
            max={MAX_PRICE}
            step="0.01"
          />

          {errors.price ? (
            <small className="field-error">{errors.price}</small>
          ) : null}
        </div>

        <div
          className={
            errors.stock ? "form-group form-group-error" : "form-group"
          }
        >
          <label>
            Stock
            <RequiredMark />
          </label>

          <input
            type="number"
            name="stock"
            value={form.stock}
            onChange={onChange}
            min="0"
            step="1"
          />

          {errors.stock ? (
            <small className="field-error">{errors.stock}</small>
          ) : null}
        </div>
      </div>

      <div
        className={
          errors.lensTypePrices ? "form-group form-group-error" : "form-group"
        }
      >
        <label>Lens Type Prices (₱)</label>

        <div className="form-row">
          {LENS_TYPE_OPTIONS.map((option) => (
            <div className="form-group" key={option.value}>
              <label>{option.label}</label>

              <input
                type="number"
                min="0"
                max={MAX_PRICE}
                step="10"
                placeholder="0"
                value={form.lensTypePrices[option.value] ?? ""}
                onChange={(e) =>
                  onLensPriceChange(option.value, e.target.value)
                }
              />
            </div>
          ))}
        </div>

        {errors.lensTypePrices ? (
          <small className="field-error">{errors.lensTypePrices}</small>
        ) : (
          <small>
            Added to the frame price when this lens type is selected. Leave
            blank or 0 for free.
          </small>
        )}
      </div>

      <div
        className={
          errors.coatingPrices ? "form-group form-group-error" : "form-group"
        }
      >
        <label>Coating Prices (₱)</label>

        <div className="form-row">
          {COATING_OPTIONS.map((option) => (
            <div className="form-group" key={option.value}>
              <label>{option.label}</label>

              <input
                type="number"
                min="0"
                max={MAX_PRICE}
                step="10"
                placeholder="0"
                value={form.coatingPrices[option.value] ?? ""}
                onChange={(e) =>
                  onCoatingPriceChange(option.value, e.target.value)
                }
              />
            </div>
          ))}
        </div>

        {errors.coatingPrices ? (
          <small className="field-error">{errors.coatingPrices}</small>
        ) : (
          <small>
            Added to the frame price when this coating is selected. Leave blank
            or 0 for free.
          </small>
        )}
      </div>

      <div className="form-row">
        <Select
          label="Category"
          name="category"
          value={form.category}
          placeholder="Select category"
          required
          options={CATEGORY_OPTIONS}
          error={errors.category}
          onChange={onChange}
        />

        <Select
          label="Frame Shape"
          name="frameShape"
          value={form.frameShape}
          placeholder="Select frame shape"
          options={FRAME_SHAPE_OPTIONS}
          error={errors.frameShape}
          onChange={onChange}
        />
      </div>

      <div className="form-row">
        <Select
          label="Material"
          name="material"
          value={form.material}
          placeholder="Select material"
          options={MATERIAL_OPTIONS}
          error={errors.material}
          onChange={onChange}
        />

        <Select
          label="Gender Category"
          name="genderCategory"
          value={form.genderCategory}
          placeholder="Select gender"
          options={GENDER_OPTIONS}
          error={errors.genderCategory}
          onChange={onChange}
        />
      </div>

      <div className="form-group">
        <label>Product Image</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) =>
            onImageFileChange(event.target.files?.[0] || null)
          }
        />
        {previewUrl ? (
          <div style={{ marginTop: 12 }}>
            <img
              src={previewUrl}
              alt="Product preview"
              style={{
                width: 150,
                height: 150,
                objectFit: "cover",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
              }}
            />
            <div>
              <button
                type="button"
                onClick={() => onImageFileChange(null)}
                style={{ marginTop: 8 }}
              >
                {imageFile ? "Remove selected image" : "Keep current image"}
              </button>
            </div>
          </div>
        ) : (
          <small>Select a JPG, PNG, or WebP image (maximum 5 MB).</small>
        )}
        {errors.imageUrl ? (
          <small className="field-error">{errors.imageUrl}</small>
        ) : null}
      </div>
      <div className="form-group">
        <label>Virtual Try-On Frame Image (Optional)</label>
        <input
          type="file"
          accept="image/png,image/webp"
          onChange={(event) =>
            onTryOnImageFileChange(event.target.files?.[0] || null)
          }
        />
        <small>
          Upload a transparent PNG or WebP containing only the glasses frame.
          Maximum 5 MB. A regular product photo is not a suitable frame asset.
        </small>
        {tryOnPreviewUrl ? (
          <div style={{ marginTop: 12 }}>
            <img
              src={tryOnPreviewUrl}
              alt="Virtual Try-On frame preview"
              style={{
                width: 150,
                height: 100,
                objectFit: "contain",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
              }}
            />
            <div>
              <button
                type="button"
                onClick={() => {
                  onTryOnImageFileChange(null);
                  onTryOnImageUrlChange("");
                }}
                style={{ marginTop: 8 }}
              >
                Remove frame asset
              </button>
            </div>
          </div>
        ) : (
          <small>No frame asset configured. Virtual Try-On will remain unavailable for this product until one is uploaded.</small>
        )}
        {errors.tryOnImage ? (
          <small className="field-error">{errors.tryOnImage}</small>
        ) : null}
      </div>
    </>
  );
}
