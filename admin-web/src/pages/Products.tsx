import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteProduct, getProducts } from "../api/products";

import type { Product, ProductFilters } from "../api/products";

const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  category: "",
  frameShape: "",
  material: "",
  genderCategory: "",
  minPrice: "",
  maxPrice: "",
  minStock: "",
  sort: "newest",
  page: 1,
  limit: 12,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);

  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);

  const [total, setTotal] = useState(0);

  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getProducts(filters);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setProducts(result.data?.products || []);

      setTotal(result.data?.pagination.total || 0);

      setTotalPages(result.data?.pagination.totalPages || 1);
    } catch (err: any) {
      console.error("Load products error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Unable to load products.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const updateFilter = (field: keyof ProductFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${product.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product._id);
      setError("");

      await deleteProduct(product._id);

      await loadProducts();
    } catch (err: any) {
      console.error("Delete product error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to delete product.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard-page">
      {/* HEADER */}

      <div className="page-header-row">
        <div>
          <p className="page-eyebrow">CATALOG</p>

          <h1>Products</h1>

          <p className="page-description">
            Search, filter, and manage VisionFit eyewear.
          </p>
        </div>

        <button
          className="primary-admin-button"
          onClick={() => navigate("/products/add")}
        >
          + Add Product
        </button>
      </div>

      {/* FILTERS */}

      <section className="filter-card">
        <div className="filter-grid">
          <div className="filter-field filter-search">
            <label>Search</label>

            <input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Name, brand, or description"
            />
          </div>

          <div className="filter-field">
            <label>Category</label>

            <input
              value={filters.category}
              onChange={(event) => updateFilter("category", event.target.value)}
              placeholder="Category"
            />
          </div>

          <div className="filter-field">
            <label>Frame Shape</label>

            <input
              value={filters.frameShape}
              onChange={(event) =>
                updateFilter("frameShape", event.target.value)
              }
              placeholder="e.g. RECTANGLE"
            />
          </div>

          <div className="filter-field">
            <label>Material</label>

            <input
              value={filters.material}
              onChange={(event) => updateFilter("material", event.target.value)}
              placeholder="Material"
            />
          </div>

          <div className="filter-field">
            <label>Gender</label>

            <input
              value={filters.genderCategory}
              onChange={(event) =>
                updateFilter("genderCategory", event.target.value)
              }
              placeholder="Gender"
            />
          </div>

          <div className="filter-field">
            <label>Min Price</label>

            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(event) => updateFilter("minPrice", event.target.value)}
              placeholder="0"
            />
          </div>

          <div className="filter-field">
            <label>Max Price</label>

            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(event) => updateFilter("maxPrice", event.target.value)}
              placeholder="10000"
            />
          </div>

          <div className="filter-field">
            <label>Minimum Stock</label>

            <input
              type="number"
              min="0"
              value={filters.minStock}
              onChange={(event) => updateFilter("minStock", event.target.value)}
              placeholder="0"
            />
          </div>

          <div className="filter-field">
            <label>Sort</label>

            <select
              value={filters.sort}
              onChange={(event) => updateFilter("sort", event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A–Z</option>
              <option value="name_desc">Name: Z–A</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button className="secondary-admin-button" onClick={clearFilters}>
            Clear Filters
          </button>

          <button
            className="secondary-admin-button"
            onClick={loadProducts}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </section>

      {/* RESULT COUNT */}

      <div className="product-toolbar">
        <div>
          <strong>{total}</strong>

          <span>{total === 1 ? " product" : " products"}</span>
        </div>
      </div>

      {/* ERROR */}

      {error ? <div className="admin-error">{error}</div> : null}

      {/* TABLE */}

      {loading ? (
        <div className="admin-loading">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="admin-empty">
          <h2>No products found</h2>

          <p>Try changing your search or filters.</p>
        </div>
      ) : (
        <div className="product-table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Frame Shape</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="product-cell">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="product-thumb"
                        />
                      ) : (
                        <div className="product-thumb-placeholder">VF</div>
                      )}

                      <div>
                        <strong>{product.name}</strong>

                        <span>{product.brand || "VisionFit"}</span>
                      </div>
                    </div>
                  </td>

                  <td>{product.category || "—"}</td>

                  <td>{product.frameShape || "—"}</td>

                  <td>₱{Number(product.price || 0).toLocaleString()}</td>

                  <td>{product.stock ?? 0}</td>

                  <td>
                    <span
                      className={
                        product.isActive === false
                          ? "status-badge status-inactive"
                          : "status-badge status-active"
                      }
                    >
                      {product.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td>
                    <div className="product-actions">
                      <button
                        className="secondary-admin-button"
                        onClick={() =>
                          navigate(`/products/edit/${product._id}`)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="danger-admin-button"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product._id}
                      >
                        {deletingId === product._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}

      {!loading && products.length > 0 ? (
        <div className="pagination">
          <button
            className="secondary-admin-button"
            disabled={filters.page <= 1}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                page: current.page - 1,
              }))
            }
          >
            Previous
          </button>

          <span>
            Page {filters.page} of {totalPages}
          </span>

          <button
            className="secondary-admin-button"
            disabled={filters.page >= totalPages}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                page: current.page + 1,
              }))
            }
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
