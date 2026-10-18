import { useState, useEffect } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { getAnalyticsSummary, getAnalyticsTrends } from "../api/analytics";
import { getProducts } from "../api/products";
import { getAdminOrders } from "../api/orders";
import type { AnalyticsEvents, RecommendationAnalytics, AnalyticsTrendsDatum } from "../api/analytics";
import "./Dashboard.css";

const formatCurrency = (value: number) => `₱${Number(value || 0).toLocaleString("en-PH")}`;

const LOW_STOCK_THRESHOLD = 10;
const COLORS = { primary: "#3b82f6", good: "#10b981", bad: "#ef4444" };

const ChartEmpty = ({ message }: { message: string }) => (
  <div className="sd-empty">{message}</div>
);

const Metric = ({ label, value, tone }: { label: string; value: string | number; tone?: "warn" | "good" | "bad" }) => (
  <div className="sd-metric-row">
    <span>{label}</span>
    <strong className={tone ? `sd-tone-${tone}` : undefined}>{value}</strong>
  </div>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsTrends, setAnalyticsTrends] = useState<AnalyticsTrendsDatum[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [processingOrders, setProcessingOrders] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState(0);
  const [cancelledOrders, setCancelledOrders] = useState(0);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvents | null>(null);
  const [recommendationAnalytics, setRecommendationAnalytics] = useState<RecommendationAnalytics | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const productsPromise = getProducts({
          search: "", category: "", frameShape: "", material: "", genderCategory: "",
          minPrice: "", maxPrice: "", minStock: "", sort: "newest", page: 1, limit: 100,
        }).then(
          (response) => ({ productsResponse: response, error: null }),
          (error) => ({ productsResponse: null, error })
        );
        const ordersPromise = getAdminOrders().then(
          (response) => ({ ordersResponse: response, error: null }),
          (error) => ({ ordersResponse: null, error })
        );
        const summaryPromise = getAnalyticsSummary().then(
          (response) => ({ summaryResponse: response, error: null }),
          (error) => ({ summaryResponse: null, error })
        );
        const trendsPromise = getAnalyticsTrends().then(
          (response) => ({ trendsResponse: response, error: null }),
          (error) => ({ trendsResponse: null, error })
        );

        const [productsResult, ordersResult, summaryResult, trendsResult] = await Promise.all([
          productsPromise, ordersPromise, summaryPromise, trendsPromise,
        ]);

        const { productsResponse, error: productsError } = productsResult;
        const { ordersResponse, error: ordersError } = ordersResult;
        const { summaryResponse, error: summaryError } = summaryResult;
        const { trendsResponse, error: trendsError } = trendsResult;

        if (productsResponse?.data?.products) {
          const products = productsResponse.data.products;
          setProductCount(products.length);
          setTotalUnits(products.reduce((sum, p) => sum + (p.stock || 0), 0));
          setLowStockCount(products.filter((p) => (p.stock || 0) < LOW_STOCK_THRESHOLD).length);
        } else if (productsError) {
          console.warn("Failed to load products data:", productsError);
          setProductCount(0); setTotalUnits(0); setLowStockCount(0);
        }

        if (ordersResponse?.data) {
          const orders = ordersResponse.data;
          setTotalOrders(orders.length);
          setPendingOrders(orders.filter((o) => o.orderStatus === "PENDING").length);
          setProcessingOrders(orders.filter((o) => o.orderStatus === "PROCESSING").length);
          setDeliveredOrders(orders.filter((o) => o.orderStatus === "DELIVERED").length);
          setCancelledOrders(orders.filter((o) => o.orderStatus === "CANCELLED").length);
          setTotalSales(
            orders.filter((o) => o.orderStatus !== "CANCELLED").reduce((sum, o) => sum + (o.total || 0), 0)
          );
        } else if (ordersError) {
          console.warn("Failed to load orders data:", ordersError);
          setTotalOrders(0); setPendingOrders(0); setProcessingOrders(0);
          setDeliveredOrders(0); setCancelledOrders(0); setTotalSales(0);
        }

        if (summaryResponse?.data) {
          const data = summaryResponse.data;
          setAnalyticsEvents(data.events ?? null);
          setRecommendationAnalytics(data.recommendationAnalytics ?? null);
        } else if (summaryError) {
          console.warn("Failed to load analytics summary:", summaryError);
          setAnalyticsEvents(null);
          setRecommendationAnalytics(null);
        }

        if (trendsResponse?.data) {
          setAnalyticsTrends(trendsResponse.data);
        } else if (trendsError) {
          console.warn("Failed to load analytics trends:", trendsError);
          setAnalyticsTrends([]);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) return <div className="sd-state">Loading dashboard...</div>;
  if (error) return <div className="sd-state sd-state-error">Error: {error}</div>;

  // ---- Chart data (derived only from API responses) ----
  const eventData = analyticsEvents
    ? [
        { name: "Product Views", value: analyticsEvents.productViews ?? 0 },
        { name: "Face Scans", value: analyticsEvents.faceScans ?? 0 },
        { name: "Add to Cart", value: analyticsEvents.addToCart ?? 0 },
        { name: "Favorites", value: analyticsEvents.favorites ?? 0 },
        { name: "Checkout Started", value: analyticsEvents.checkoutStarted ?? 0 },
        { name: "Completed Orders", value: analyticsEvents.orderCompletedEvents ?? 0 },
        { name: "Rec. Feedback", value: analyticsEvents.recommendationFeedback ?? 0 },
      ]
    : [];
  const hasEvents = eventData.some((d) => d.value > 0);

  const helpful = recommendationAnalytics?.helpful ?? 0;
  const notHelpful = recommendationAnalytics?.notHelpful ?? 0;
  const ratedTotal = helpful + notHelpful;
  const feedbackData = [
    { name: "Helpful", value: helpful, color: COLORS.good },
    { name: "Not Helpful", value: notHelpful, color: COLORS.bad },
  ];
  // Computed from counts, guarded against divide-by-zero. Not capped.
  const helpfulRate = ratedTotal > 0 ? (helpful / ratedTotal) * 100 : null;

  const matchScore = recommendationAnalytics?.averageMatchScore;

  return (
    <div className="sd-page">
      <header className="sd-header">
        <h1>Staff Dashboard</h1>
        <p>Inventory, orders, and recommendation activity at a glance.</p>
      </header>

      {/* Row 1: summary cards */}
      <div className="sd-grid sd-grid-3">
        <section className="sd-card">
          <div className="sd-card-head"><span className="sd-eyebrow">Products</span><h2>Product Inventory</h2></div>
          <Metric label="Total Products" value={productCount} />
          <Metric label="Total Units" value={totalUnits.toLocaleString()} />
          <Metric label="Low Stock" value={lowStockCount} tone={lowStockCount > 0 ? "warn" : undefined} />
        </section>

        <section className="sd-card">
          <div className="sd-card-head"><span className="sd-eyebrow">Orders</span><h2>Order Overview</h2></div>
          <Metric label="Pending" value={pendingOrders} tone={pendingOrders > 0 ? "warn" : undefined} />
          <Metric label="Processing" value={processingOrders} />
          <Metric label="Delivered" value={deliveredOrders} tone="good" />
          <Metric label="Cancelled" value={cancelledOrders} tone={cancelledOrders > 0 ? "bad" : undefined} />
        </section>

        <section className="sd-card">
          <div className="sd-card-head"><span className="sd-eyebrow">Sales</span><h2>Sales Performance</h2></div>
          <Metric label="Total Orders" value={totalOrders} />
          <Metric label="Total Sales" value={formatCurrency(totalSales)} tone="good" />
        </section>
      </div>

      {/* Row 2: charts */}
      <div className="sd-grid sd-grid-3">
        <section className="sd-card">
          <div className="sd-card-head"><span className="sd-eyebrow">Events</span><h2>Event Counts by Type</h2></div>
          <div className="sd-chart">
            {hasEvents ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} interval={0} />
                  <Tooltip formatter={(v) => [v, "Count"]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                  <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty message="No event data recorded yet." />
            )}
          </div>
        </section>

        <section className="sd-card">
          <div className="sd-card-head"><span className="sd-eyebrow">Feedback</span><h2>Recommendation Feedback</h2></div>
          <div className="sd-chart">
            {ratedTotal > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={feedbackData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                    {feedbackData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty message="No helpful / not-helpful feedback data available." />
            )}
          </div>
        </section>

        <section className="sd-card">
          <div className="sd-card-head"><span className="sd-eyebrow">Trends</span><h2>Order Trends (Last 30 Days)</h2></div>
          <div className="sd-chart">
            {analyticsTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsTrends} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                  <Tooltip labelFormatter={(l) => `Date: ${l}`} formatter={(v) => [v, "Orders"]} />
                  <Line type="monotone" dataKey="orderCount" name="Orders" stroke={COLORS.primary}
                        strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty message="No orders in the last 30 days." />
            )}
          </div>
        </section>
      </div>

      {/* Row 3: recommendation analytics */}
      <section className="sd-card">
        <div className="sd-card-head"><span className="sd-eyebrow">Recommendations</span><h2>Recommendation Analytics</h2></div>
        {recommendationAnalytics ? (
          <div className="sd-grid sd-grid-3 sd-kpis">
            <div className="sd-kpi"><span>Total Feedback</span><strong>{recommendationAnalytics.totalFeedback}</strong></div>
            <div className="sd-kpi"><span>Helpful Rate</span><strong>{helpfulRate === null ? "—" : `${helpfulRate.toFixed(1)}%`}</strong></div>
            <div className="sd-kpi"><span>Avg. Match Score</span><strong>{typeof matchScore === "number" ? matchScore.toFixed(2) : "—"}</strong></div>
          </div>
        ) : (
          <ChartEmpty message="No recommendation data available." />
        )}
      </section>
    </div>
  );
};

export default Dashboard;