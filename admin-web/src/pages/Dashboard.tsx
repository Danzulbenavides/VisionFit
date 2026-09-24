import { useCallback, useEffect, useState } from "react";

import { getProducts } from "../api/products";
import { getAdminOrders, type Order } from "../api/orders";
import { getAdminUsers, type User } from "../api/users";
import {
  getAnalyticsSummary,
  getProductDataQuality,
  type AnalyticsEvents,
  type PopularFrameShape,
  type ProductDataQualityIssue,
  type ProductDataQualitySummary,
  type RecommendationAnalytics,
  type RecommendationFeedbackFaceShape,
  type RecommendationFeedbackProduct,
} from "../api/analytics";

const LOW_STOCK_THRESHOLD = 5;

const formatCurrency = (value: number) => {
  return `₱${Number(value || 0).toLocaleString()}`;
};

const formatFaceShape = (value: string) => {
  if (!value) {
    return "Unknown";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------------------
  // PRODUCT METRICS
  // -----------------------------------------

  const [productCount, setProductCount] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // -----------------------------------------
  // RECOMMENDATION ANALYTICS
  // -----------------------------------------

  const [recommendationAnalytics, setRecommendationAnalytics] =
    useState<RecommendationAnalytics>({
      totalFeedback: 0,
      helpful: 0,
      notHelpful: 0,
      helpfulRate: 0,
      averageMatchScore: 0,
    });

  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvents>({
    total: 0,
    productViews: 0,
    addToCart: 0,
    removeFromCart: 0,
    favorites: 0,
    unfavorites: 0,
    faceScans: 0,
    checkoutStarted: 0,
    orderCompletedEvents: 0,
    recommendationFeedback: 0,
  });

  const [recommendationFeedbackByProduct, setRecommendationFeedbackByProduct] =
    useState<RecommendationFeedbackProduct[]>([]);

  const [
    recommendationFeedbackByFaceShape,
    setRecommendationFeedbackByFaceShape,
  ] = useState<RecommendationFeedbackFaceShape[]>([]);

  const [popularFrameShapes, setPopularFrameShapes] = useState<
    PopularFrameShape[]
  >([]);

  const [productDataQuality, setProductDataQuality] =
    useState<ProductDataQualitySummary>({
      totalProducts: 0,
      productsWithIssues: 0,
      missingName: 0,
      missingPrice: 0,
      missingCategory: 0,
      missingFrameShape: 0,
      missingMaterial: 0,
      missingDescription: 0,
      missingImage: 0,
      missingPrescriptionData: 0,
      missingTryOnImage: 0,
    });

  const [productDataQualityIssues, setProductDataQualityIssues] = useState<
    ProductDataQualityIssue[]
  >([]);

  // -----------------------------------------
  // ORDERS / USERS
  // -----------------------------------------

  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // -----------------------------------------
  // LOAD DASHBOARD
  // -----------------------------------------

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        productsResult,
        ordersResult,
        usersResult,
        analyticsResult,
        productQualityResult,
      ] = await Promise.all([
        getProducts({
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
          limit: 100,
        }),

        getAdminOrders(),

        getAdminUsers(),

        getAnalyticsSummary(),

        getProductDataQuality(),
      ]);

      // -----------------------------------------
      // PRODUCTS
      // -----------------------------------------

      if (productsResult.error) {
        throw new Error(productsResult.error.message);
      }

      const products = productsResult.data?.products || [];

      setProductCount(productsResult.data?.pagination.total || products.length);

      setTotalUnits(
        products.reduce((sum, product) => sum + (product.stock ?? 0), 0),
      );

      setLowStockCount(
        products.filter(
          (product) =>
            (product.stock ?? 0) > 0 &&
            (product.stock ?? 0) <= LOW_STOCK_THRESHOLD,
        ).length,
      );

      // -----------------------------------------
      // ORDERS
      // -----------------------------------------

      if (ordersResult.error) {
        throw new Error(ordersResult.error.message);
      }

      setOrders(ordersResult.data || []);

      // -----------------------------------------
      // USERS
      // -----------------------------------------

      if (usersResult.error) {
        throw new Error(usersResult.error.message);
      }

      setUsers(usersResult.data || []);

      // -----------------------------------------
      // ANALYTICS
      // -----------------------------------------

      if (analyticsResult.error) {
        throw new Error(analyticsResult.error.message);
      }

      setRecommendationAnalytics(
        analyticsResult.data?.recommendationAnalytics || {
          totalFeedback: 0,
          helpful: 0,
          notHelpful: 0,
          helpfulRate: 0,
          averageMatchScore: 0,
        },
      );

      setAnalyticsEvents(
        analyticsResult.data?.events || {
          total: 0,
          productViews: 0,
          addToCart: 0,
          removeFromCart: 0,
          favorites: 0,
          unfavorites: 0,
          faceScans: 0,
          checkoutStarted: 0,
          orderCompletedEvents: 0,
          recommendationFeedback: 0,
        },
      );

      setRecommendationFeedbackByProduct(
        analyticsResult.data?.recommendationFeedbackByProduct || [],
      );

      setRecommendationFeedbackByFaceShape(
        analyticsResult.data?.recommendationFeedbackByFaceShape || [],
      );

      setPopularFrameShapes(analyticsResult.data?.popularFrameShapes || []);

      if (productQualityResult.error) {
        throw new Error(productQualityResult.error.message);
      }

      setProductDataQuality(
        productQualityResult.data?.summary || {
          totalProducts: 0,
          productsWithIssues: 0,
          missingName: 0,
          missingPrice: 0,
          missingCategory: 0,
          missingFrameShape: 0,
          missingMaterial: 0,
          missingDescription: 0,
          missingImage: 0,
          missingPrescriptionData: 0,
          missingTryOnImage: 0,
        },
      );

      setProductDataQualityIssues(productQualityResult.data?.issues || []);
    } catch (err: any) {
      console.error("Load dashboard error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // -----------------------------------------
  // ORDER METRICS
  // -----------------------------------------

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.orderStatus === "PENDING",
  ).length;

  const processingOrders = orders.filter(
    (order) => order.orderStatus === "PROCESSING",
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.orderStatus === "DELIVERED",
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.orderStatus === "CANCELLED",
  ).length;

  const totalSales = orders
    .filter((order) => order.orderStatus !== "CANCELLED")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  // -----------------------------------------
  // USER METRICS
  // -----------------------------------------

  const totalUsers = users.length;

  const activeUsers = users.filter((user) => user.isActive).length;

  const customerCount = users.filter((user) => user.role === "CUSTOMER").length;

  // -----------------------------------------
  // RECENT ORDERS
  // -----------------------------------------

  const recentOrders = [...orders]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();

      const dateB = new Date(b.createdAt || 0).getTime();

      return dateB - dateA;
    })
    .slice(0, 5);

  // -----------------------------------------
  // ACTIVITY CHART DATA
  // -----------------------------------------

  const activityChartData = [
    {
      label: "Product views",
      value: analyticsEvents.productViews,
    },
    {
      label: "Face scans",
      value: analyticsEvents.faceScans,
    },
    {
      label: "Add-to-cart",
      value: analyticsEvents.addToCart,
    },
    {
      label: "Favorites",
      value: analyticsEvents.favorites,
    },
    {
      label: "Checkout started",
      value: analyticsEvents.checkoutStarted,
    },
    {
      label: "Completed orders",
      value: analyticsEvents.orderCompletedEvents,
    },
  ];

  const maxActivityCount = Math.max(
    ...activityChartData.map((item) => item.value),
    1,
  );

  // -----------------------------------------
  // RENDER
  // -----------------------------------------

  return (
    <div className="dashboard-page">
      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="page-header-row">
        <div>
          <p className="page-eyebrow">OVERVIEW</p>

          <h1>Dashboard</h1>

          <p className="page-description">
            Overview of VisionFit products, orders, inventory, users, and
            analytics.
          </p>
        </div>

        <button
          className="secondary-admin-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* ===================================== */}
      {/* ERROR */}
      {/* ===================================== */}

      {error ? <div className="admin-error">{error}</div> : null}

      {/* ===================================== */}
      {/* PRIMARY METRICS */}
      {/* ===================================== */}

      <div className="inventory-summary-grid">
        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Products</span>

          <strong>{productCount}</strong>

          <span className="inventory-summary-description">
            Active catalog products
          </span>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Orders</span>

          <strong>{totalOrders}</strong>

          <span className="inventory-summary-description">
            Total customer orders
          </span>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Users</span>

          <strong>{totalUsers}</strong>

          <span className="inventory-summary-description">
            Registered accounts
          </span>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Sales</span>

          <strong>{formatCurrency(totalSales)}</strong>

          <span className="inventory-summary-description">
            Excluding cancelled orders
          </span>
        </div>
      </div>

      {/* ===================================== */}
      {/* SECONDARY METRICS */}
      {/* ===================================== */}

      <div className="dashboard-section-grid">
        {/* INVENTORY */}

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <p className="page-eyebrow">INVENTORY</p>

              <h2>Stock Overview</h2>
            </div>
          </div>

          <div className="dashboard-metric-list">
            <div className="dashboard-metric-row">
              <span>Total units</span>

              <strong>{totalUnits}</strong>
            </div>

            <div className="dashboard-metric-row">
              <span>Low stock</span>

              <strong>{lowStockCount}</strong>
            </div>
          </div>
        </section>

        {/* USERS */}

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <p className="page-eyebrow">USERS</p>

              <h2>User Overview</h2>
            </div>
          </div>

          <div className="dashboard-metric-list">
            <div className="dashboard-metric-row">
              <span>Customers</span>

              <strong>{customerCount}</strong>
            </div>

            <div className="dashboard-metric-row">
              <span>Active users</span>

              <strong>{activeUsers}</strong>
            </div>
          </div>
        </section>

        {/* ORDERS */}

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <p className="page-eyebrow">ORDERS</p>

              <h2>Order Overview</h2>
            </div>
          </div>

          <div className="dashboard-metric-list">
            <div className="dashboard-metric-row">
              <span>Pending</span>

              <strong>{pendingOrders}</strong>
            </div>

            <div className="dashboard-metric-row">
              <span>Processing</span>

              <strong>{processingOrders}</strong>
            </div>

            <div className="dashboard-metric-row">
              <span>Delivered</span>

              <strong>{deliveredOrders}</strong>
            </div>

            <div className="dashboard-metric-row">
              <span>Cancelled</span>

              <strong>{cancelledOrders}</strong>
            </div>
          </div>
        </section>
      </div>

      {/* ===================================== */}
      {/* RECOMMENDATION ANALYTICS */}
      {/* ===================================== */}

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <p className="page-eyebrow">RECOMMENDATIONS</p>

            <h2>Recommendation Analytics</h2>
          </div>
        </div>

        <div className="dashboard-metric-list">
          <div className="dashboard-metric-row">
            <span>Total feedback</span>

            <strong>{recommendationAnalytics.totalFeedback}</strong>
          </div>

          <div className="dashboard-metric-row">
            <span>Helpful</span>

            <strong>{recommendationAnalytics.helpful}</strong>
          </div>

          <div className="dashboard-metric-row">
            <span>Not helpful</span>

            <strong>{recommendationAnalytics.notHelpful}</strong>
          </div>

          <div className="dashboard-metric-row">
            <span>Helpful rate</span>

            <strong>{recommendationAnalytics.helpfulRate}%</strong>
          </div>

          <div className="dashboard-metric-row">
            <span>Average match score</span>

            <strong>{recommendationAnalytics.averageMatchScore}%</strong>
          </div>
        </div>
      </section>

      {/* ===================================== */}
      {/* POPULAR FRAME SHAPES */}
      {/* ===================================== */}

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <p className="page-eyebrow">FRAME ANALYTICS</p>

            <h2>Popular Frame Shapes</h2>

            <p className="page-description">
              Frame shapes ranked by recorded product views.
            </p>
          </div>
        </div>

        {popularFrameShapes.length === 0 ? (
          <div className="admin-empty">
            <h3>No frame-shape activity yet</h3>

            <p>
              Popular frame shapes will appear after customers view eyewear
              products.
            </p>
          </div>
        ) : (
          <div className="product-table-wrapper">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Frame Shape</th>
                  <th>Product Views</th>
                </tr>
              </thead>

              <tbody>
                {popularFrameShapes.map((item) => (
                  <tr key={item.frameShape}>
                    <td>
                      <strong>{formatFaceShape(item.frameShape)}</strong>
                    </td>

                    <td>{item.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===================================== */}
      {/* PRODUCT FEEDBACK */}
      {/* ===================================== */}

      <section className="dashboard-card dashboard-recent-orders">
        <div className="dashboard-card-header">
          <div>
            <p className="page-eyebrow">PRODUCT FEEDBACK</p>

            <h2>Recommendation Feedback by Product</h2>
          </div>
        </div>

        {/* ===================================== */}
        {/* FEEDBACK BY FACE SHAPE */}
        {/* ===================================== */}

        <section className="dashboard-card dashboard-recent-orders">
          <div className="dashboard-card-header">
            <div>
              <p className="page-eyebrow">FACE SHAPE ANALYTICS</p>

              <h2>Recommendation Feedback by Face Shape</h2>

              <p className="page-description">
                Summary of recommendation feedback grouped by detected face
                shape.
              </p>
            </div>
          </div>

          {recommendationFeedbackByFaceShape.length === 0 ? (
            <div className="admin-empty">
              <h3>No face-shape feedback yet</h3>

              <p>
                Face-shape statistics will appear after customers submit
                feedback from a new face scan.
              </p>
            </div>
          ) : (
            <div className="product-table-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Face Shape</th>
                    <th>Total Feedback</th>
                    <th>Helpful</th>
                    <th>Not Helpful</th>
                    <th>Helpful Rate</th>
                    <th>Avg. Match Score</th>
                  </tr>
                </thead>

                <tbody>
                  {recommendationFeedbackByFaceShape.map((item) => (
                    <tr key={item.faceShape}>
                      <td>
                        <strong>{formatFaceShape(item.faceShape)}</strong>
                      </td>

                      <td>{item.totalFeedback}</td>

                      <td>{item.helpful}</td>

                      <td>{item.notHelpful}</td>

                      <td>{item.helpfulRate}%</td>

                      <td>{item.averageMatchScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {recommendationFeedbackByProduct.length === 0 ? (
          <div className="admin-empty">
            <h3>No recommendation feedback yet</h3>

            <p>
              Product-level feedback will appear here after customers submit
              recommendation feedback.
            </p>
          </div>
        ) : (
          <div className="product-table-wrapper">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Total Feedback</th>
                  <th>Helpful</th>
                  <th>Not Helpful</th>
                  <th>Avg. Match Score</th>
                </tr>
              </thead>

              <tbody>
                {recommendationFeedbackByProduct.map((product) => (
                  <tr key={product.productId}>
                    <td>
                      <strong>{product.name}</strong>
                    </td>

                    <td>{product.totalFeedback}</td>

                    <td>{product.helpful}</td>

                    <td>{product.notHelpful}</td>

                    <td>{product.averageMatchScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===================================== */}
      {/* PRODUCT DATA QUALITY */}
      {/* ===================================== */}

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <p className="page-eyebrow">DATA QUALITY</p>

            <h2>Product Data Quality</h2>

            <p className="page-description">
              Validation summary for the active eyewear catalog.
            </p>
          </div>
        </div>

        {/* SUMMARY */}

        <div className="dashboard-section-grid">
          <section className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <p className="page-eyebrow">CATALOG</p>

                <h2>Quality Overview</h2>
              </div>
            </div>

            <div className="dashboard-metric-list">
              <div className="dashboard-metric-row">
                <span>Total active products</span>

                <strong>{productDataQuality.totalProducts}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Products with issues</span>

                <strong>{productDataQuality.productsWithIssues}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Missing product images</span>

                <strong>{productDataQuality.missingImage}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Missing Try-On images</span>

                <strong>{productDataQuality.missingTryOnImage}</strong>
              </div>
            </div>
          </section>

          {/* FIELD ISSUES */}

          <section className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <p className="page-eyebrow">FIELD CHECK</p>

                <h2>Missing Information</h2>
              </div>
            </div>

            <div className="dashboard-metric-list">
              <div className="dashboard-metric-row">
                <span>Missing names</span>

                <strong>{productDataQuality.missingName}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Missing prices</span>

                <strong>{productDataQuality.missingPrice}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Missing categories</span>

                <strong>{productDataQuality.missingCategory}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Missing frame shapes</span>

                <strong>{productDataQuality.missingFrameShape}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Missing materials</span>

                <strong>{productDataQuality.missingMaterial}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Missing descriptions</span>

                <strong>{productDataQuality.missingDescription}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Missing prescription data</span>

                <strong>{productDataQuality.missingPrescriptionData}</strong>
              </div>
            </div>
          </section>
        </div>

        {/* PRODUCTS WITH ISSUES */}

        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #E5E5E5",
          }}
        >
          <div style={{ marginBottom: "18px" }}>
            <p className="page-eyebrow">ATTENTION REQUIRED</p>

            <h3 style={{ margin: 0 }}>Products With Data Issues</h3>
          </div>

          {productDataQualityIssues.length === 0 ? (
            <div className="admin-empty">
              <h3>No product data issues detected</h3>

              <p>
                All active products currently pass the configured catalog
                checks.
              </p>
            </div>
          ) : (
            <div className="product-table-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Frame Shape</th>
                    <th>Issues</th>
                  </tr>
                </thead>

                <tbody>
                  {productDataQualityIssues.map((product) => (
                    <tr key={product.productId}>
                      <td>
                        <strong>{product.name || "Unnamed Product"}</strong>
                      </td>

                      <td>{product.category || "Missing"}</td>

                      <td>{product.frameShape || "Missing"}</td>

                      <td>
                        <div>
                          {product.issues.map((issue) => (
                            <span
                              key={issue}
                              style={{
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ===================================== */}
      {/* STATISTICAL SUMMARY */}
      {/* ===================================== */}

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <p className="page-eyebrow">STATISTICS</p>

            <h2>Statistical Summary</h2>

            <p className="page-description">
              Descriptive summary of collected VisionFit activity and
              recommendation data.
            </p>
          </div>
        </div>

        {/* INTERPRETATION OF RESULTS */}

        <div
          style={{
            marginTop: "28px",
            paddingTop: "24px",
            borderTop: "1px solid #E5E5E5",
          }}
        >
          <div style={{ marginBottom: "14px" }}>
            <p className="page-eyebrow">INTERPRETATION</p>

            <h3 style={{ margin: 0 }}>Interpretation of Results</h3>
          </div>

          <div
            style={{
              backgroundColor: "#F7F7F7",
              borderRadius: "12px",
              padding: "16px",
              lineHeight: "1.6",
            }}
          >
            <p style={{ marginTop: 0 }}>
              The dashboard currently contains{" "}
              <strong>{analyticsEvents.total}</strong> tracked user events.
            </p>

            <p>
              Product views, face scans, and add-to-cart events each account for{" "}
              <strong>
                {Math.max(
                  analyticsEvents.productViews,
                  analyticsEvents.faceScans,
                  analyticsEvents.addToCart,
                )}
              </strong>{" "}
              recorded events in the current dataset.
            </p>

            <p>
              The recommendation dataset contains{" "}
              <strong>{recommendationAnalytics.totalFeedback}</strong> feedback
              responses, with a recorded helpful rate of{" "}
              <strong>{recommendationAnalytics.helpfulRate}%</strong>.
            </p>

            <p style={{ marginBottom: 0 }}>
              The current results describe the activity recorded in VisionFit
              and can be updated as additional user interactions are collected.
            </p>
          </div>
        </div>

        {/* --------------------------------- */}
        {/* COUNTS + DESCRIPTIVE MEASURES */}
        {/* --------------------------------- */}

        <div className="dashboard-section-grid">
          {/* ACTIVITY COUNTS */}

          <section className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <p className="page-eyebrow">USER ACTIVITY</p>

                <h2>Activity Counts</h2>
              </div>
            </div>

            <div className="dashboard-metric-list">
              <div className="dashboard-metric-row">
                <span>Total tracked events</span>

                <strong>{analyticsEvents.total}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Product views</span>

                <strong>{analyticsEvents.productViews}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Face scans</span>

                <strong>{analyticsEvents.faceScans}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Add-to-cart events</span>

                <strong>{analyticsEvents.addToCart}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Favorites</span>

                <strong>{analyticsEvents.favorites}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Checkout started</span>

                <strong>{analyticsEvents.checkoutStarted}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Completed order events</span>

                <strong>{analyticsEvents.orderCompletedEvents}</strong>
              </div>
            </div>
          </section>

          {/* DESCRIPTIVE MEASURES */}

          <section className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <p className="page-eyebrow">RECOMMENDATION DATA</p>

                <h2>Descriptive Measures</h2>
              </div>
            </div>

            <div className="dashboard-metric-list">
              <div className="dashboard-metric-row">
                <span>Feedback responses</span>

                <strong>{recommendationAnalytics.totalFeedback}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Helpful responses</span>

                <strong>{recommendationAnalytics.helpful}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Not helpful responses</span>

                <strong>{recommendationAnalytics.notHelpful}</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Helpful rate</span>

                <strong>{recommendationAnalytics.helpfulRate}%</strong>
              </div>

              <div className="dashboard-metric-row">
                <span>Mean match score</span>

                <strong>{recommendationAnalytics.averageMatchScore}%</strong>
              </div>
            </div>
          </section>
        </div>

        {/* --------------------------------- */}
        {/* ACTIVITY DISTRIBUTION */}
        {/* --------------------------------- */}

        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #E5E5E5",
          }}
        >
          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <p className="page-eyebrow">VISUAL SUMMARY</p>

            <h3 style={{ margin: 0 }}>Activity Distribution</h3>

            <p
              className="page-description"
              style={{
                marginTop: "6px",
              }}
            >
              Comparison of recorded VisionFit user activities.
            </p>
          </div>

          <div>
            {activityChartData.map((item) => {
              const width =
                item.value === 0 ? 0 : (item.value / maxActivityCount) * 100;

              return (
                <div
                  key={item.label}
                  style={{
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                      fontSize: "13px",
                    }}
                  >
                    <span>{item.label}</span>

                    <strong>{item.value}</strong>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "10px",
                      backgroundColor: "#F0F0F0",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${width}%`,
                        height: "100%",
                        backgroundColor: "#222222",
                        borderRadius: "999px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================== */}
      {/* RECENT ORDERS */}
      {/* ===================================== */}

      <section className="dashboard-card dashboard-recent-orders">
        <div className="dashboard-card-header">
          <div>
            <p className="page-eyebrow">ACTIVITY</p>

            <h2>Recent Orders</h2>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading recent orders...</div>
        ) : recentOrders.length === 0 ? (
          <div className="admin-empty">
            <h3>No orders yet</h3>

            <p>Customer orders will appear here once they are created.</p>
          </div>
        ) : (
          <div className="product-table-wrapper">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <strong>{order.orderNumber}</strong>
                    </td>

                    <td>{formatCurrency(order.total)}</td>

                    <td>
                      <div>
                        <strong>{order.paymentMethod}</strong>

                        <span>{order.paymentStatus}</span>
                      </div>
                    </td>

                    <td>
                      <span className="status-badge">{order.orderStatus}</span>
                    </td>

                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
