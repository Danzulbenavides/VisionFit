import type { ChangeEvent } from "react";

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
  required,
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
}: Props) {
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
      <div className={errors.name ? "form-group form-group-error" : "form-group"}>
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

        {errors.name ? <small className="field-error">{errors.name}</small> : null}
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

      <div className={errors.description ? "form-group form-group-error" : "form-group"}>
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
        <div className={errors.price ? "form-group form-group-error" : "form-group"}>
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

          {errors.price ? <small className="field-error">{errors.price}</small> : null}
        </div>

        <div className={errors.stock ? "form-group form-group-error" : "form-group"}>
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

          {errors.stock ? <small className="field-error">{errors.stock}</small> : null}
        </div>
      </div>

      <div className={errors.lensTypePrices ? "form-group form-group-error" : "form-group"}>
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
                onChange={(e) => onLensPriceChange(option.value, e.target.value)}
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

      <div className={errors.coatingPrices ? "form-group form-group-error" : "form-group"}>
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
                onChange={(e) => onCoatingPriceChange(option.value, e.target.value)}
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

      <div className={errors.imageUrl ? "form-group form-group-error" : "form-group"}>
        <label>Image URL</label>

        <input
          type="text"
          name="imageUrl"
          value={form.imageUrl}
          onChange={onChange}
          placeholder="https://example.com/image.jpg"
        />

        {errors.imageUrl ? (
          <small className="field-error">{errors.imageUrl}</small>
        ) : (
          <small>This will be stored in the product's images array.</small>
        )}
      </div>
    </>
  );
}
