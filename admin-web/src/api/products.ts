import apiClient from "./client";

export interface Product {
  _id: string;
  name: string;
  brand?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  frameShape?: string;
  material?: string;
  genderCategory?: string;
  imageUrl?: string;
  images?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilters {
  search: string;
  category: string;
  frameShape: string;
  material: string;
  genderCategory: string;
  minPrice: string;
  maxPrice: string;
  minStock: string;
  sort: string;
  page: number;
  limit: number;
}

export interface ProductListResponse {
  data?: {
    products: Product[];

    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };

    filters?: ProductFilters;
  };

  error?: {
    message: string;
  };
}

export const getProducts = async (
  filters: ProductFilters,
): Promise<ProductListResponse> => {
  const response = await apiClient.get("/products", {
    params: {
      search: filters.search || undefined,
      category: filters.category || undefined,
      frameShape: filters.frameShape || undefined,
      material: filters.material || undefined,
      genderCategory: filters.genderCategory || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      minStock: filters.minStock || undefined,
      sort: filters.sort,
      page: filters.page,
      limit: filters.limit,
    },
  });

  return response.data;
};

export interface CreateProductData {
  name: string;
  brand: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  frameShape: string;
  material: string;
  genderCategory: string;
  images: string[];
}

export const createProduct = async (
  product: CreateProductData,
): Promise<Product> => {
  const response = await apiClient.post("/products", product);

  return response.data.data;
};
export interface UpdateProductData {
  name?: string;
  brand?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  frameShape?: string;
  material?: string;
  genderCategory?: string;
  images?: string[];
}

export const updateProduct = async (
  id: string,
  product: UpdateProductData,
): Promise<Product> => {
  const response = await apiClient.patch(`/products/${id}`, product);

  return response.data.data;
};
export const deleteProduct = async (id: string): Promise<Product> => {
  const response = await apiClient.delete(`/products/${id}`);

  return response.data.data;
};
