import apiClient from "./client";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lensType?: string;
  prescriptionId?: string | null;
  prescriptionSnapshot?: unknown;
  coating?: string;
}

export interface AddressSnapshot {
  firstName: string;
  lastName: string;
  country: string;
  street: string;
  apartment?: string | null;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
}

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderCustomer {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface Order {
  _id: string;
  userId: OrderCustomer | string;
  orderNumber: string;
  items: OrderItem[];
  addressSnapshot: AddressSnapshot;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: "COD" | "E_WALLET" | "CARD";
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrdersResponse {
  data?: Order[];
  error?: {
    message: string;
  };
}

export const getAdminOrders = async (): Promise<OrdersResponse> => {
  const response = await apiClient.get("/orders/admin");

  return response.data;
};

export const updateOrderStatus = async (
  id: string,
  orderStatus: OrderStatus,
): Promise<Order> => {
  const response = await apiClient.patch(`/orders/${id}/status`, {
    orderStatus,
  });

  return response.data.data;
};
