import { useCallback, useEffect, useState } from "react";

import { getProducts } from "../api/products";

import type { Product, ProductFilters } from "../api/products";

const INVENTORY_FILTERS: ProductFilters = {
  search: "",
  category: "",
  frameShape: "",
  material: "",
  genderCategory: "",
  minPrice: "",
  maxPrice: "",
  minStock: "",
  sort: "name_asc",
  page: 1,
  limit: 100,
};

const LOW_STOCK_THRESHOLD = 5;

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getProducts(INVENTORY_FILTERS);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setProducts(result.data?.products || []);
    } catch (err: any) {
      console.error("Load inventory error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Unable to load inventory.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const totalProducts = products.length;

  const totalUnits = products.reduce(
    (sum, product) => sum + (product.stock ?? 0),
    0,
  );

  const lowStockProducts = products.filter(
    (product) =>
      (product.stock ?? 0) > 0 && (product.stock ?? 0) <= LOW_STOCK_THRESHOLD,
  );

  const outOfStockProducts = products.filter(
    (product) => (product.stock ?? 0) === 0,
  );

  const inStockProducts = products.filter(
    (product) => (product.stock ?? 0) > LOW_STOCK_THRESHOLD,
  );

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return {
        label: "Out of Stock",
        className: "status-badge status-inactive",
      };
    }

    if (stock <= LOW_STOCK_THRESHOLD) {
      return {
        label: "Low Stock",
        className: "status-badge status-warning",
      };
    }

    return {
      label: "In Stock",
      className: "status-badge status-active",
    };
  };

  return (
    <div className="dashboard-page">
      {/* HEADER */}

      <div className="page-header-row">
        <div>
          <p className="page-eyebrow">INVENTORY</p>

          <h1>Inventory</h1>

          <p className="page-description">
            Monitor product stock levels and identify items that need attention.
          </p>
        </div>

        <button
          className="secondary-admin-button"
          onClick={loadInventory}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* ERROR */}

      {error ? <div className="admin-error">{error}</div> : null}

      {/* SUMMARY CARDS */}

      <div className="inventory-summary-grid">
        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Products</span>

          <strong>{totalProducts}</strong>

          <span className="inventory-summary-description">
            Active catalog items
          </span>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Total Units</span>

          <strong>{totalUnits}</strong>

          <span className="inventory-summary-description">
            Current stock across products
          </span>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Low Stock</span>

          <strong>{lowStockProducts.length}</strong>

          <span className="inventory-summary-description">
            {`1–${LOW_STOCK_THRESHOLD} units remaining`}
          </span>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Out of Stock</span>

          <strong>{outOfStockProducts.length}</strong>

          <span className="inventory-summary-description">
            Products with zero stock
          </span>
        </div>
      </div>

      {/* INVENTORY TABLE */}

      {loading ? (
        <div className="admin-loading">Loading inventory...</div>
      ) : products.length === 0 ? (
        <div className="admin-empty">
          <h2>No inventory found</h2>

          <p>There are currently no active products in the catalog.</p>
        </div>
      ) : (
        <div className="product-table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const stock = product.stock ?? 0;

                const status = getStockStatus(stock);

                return (
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

                    <td>₱{Number(product.price || 0).toLocaleString()}</td>

                    <td>
                      <strong>{stock}</strong>
                    </td>

                    <td>
                      <span className={status.className}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* STOCK ALERT */}

      {!loading && lowStockProducts.length > 0 ? (
        <section className="inventory-alert-card">
          <div>
            <p className="page-eyebrow">STOCK ALERT</p>

            <h2>
              {lowStockProducts.length} product
              {lowStockProducts.length === 1 ? "" : "s"} need attention
            </h2>

            <p>
              These products currently have
              {` ${LOW_STOCK_THRESHOLD} `}
              or fewer units remaining.
            </p>
          </div>

          <div className="inventory-alert-list">
            {lowStockProducts.map((product) => (
              <div className="inventory-alert-item" key={product._id}>
                <span>{product.name}</span>

                <strong>{product.stock ?? 0} left</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* INVENTORY STATUS */}

      {!loading && products.length > 0 ? (
        <div className="inventory-status-summary">
          <span>
            In Stock: <strong>{inStockProducts.length}</strong>
          </span>

          <span>
            Low Stock: <strong>{lowStockProducts.length}</strong>
          </span>

          <span>
            Out of Stock: <strong>{outOfStockProducts.length}</strong>
          </span>
        </div>
      ) : null}
    </div>
  );
}
