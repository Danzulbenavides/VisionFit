import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import Inventory from "../pages/Inventory";
import Orders from "../pages/Orders";
import Users from "../pages/Users";
import AuditLogs from "../pages/AuditLogs";
import AdminLayout from "../layouts/AdminLayout";
import AddProduct from "../pages/AddProduct";
import EditProduct from "../pages/EditProduct";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = sessionStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/add" element={<AddProduct />} />
        <Route path="/products/edit/:id" element={<EditProduct />} />s
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/users" element={<Users />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
