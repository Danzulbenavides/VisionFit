import apiClient from "./client";

export interface RecommendationAnalytics {
  totalFeedback: number;
  helpful: number;
  notHelpful: number;
  helpfulRate: number;
  averageMatchScore: number;
}

export interface AnalyticsEvents {
  total: number;
  productViews: number;
  addToCart: number;
  removeFromCart: number;
  favorites: number;
  unfavorites: number;
  faceScans: number;
  checkoutStarted: number;
  orderCompletedEvents: number;
  recommendationFeedback: number;
}
export interface PopularFrameShape {
  frameShape: string;
  views: number;
}
export interface AnalyticsSummaryResponse {
  data?: {
    events?: AnalyticsEvents;

    recommendationAnalytics?: RecommendationAnalytics;

    popularFrameShapes?: PopularFrameShape[];

    recommendationFeedbackByProduct?: RecommendationFeedbackProduct[];
    recommendationFeedbackByFaceShape?: RecommendationFeedbackFaceShape[];

    orders?: {
      total: number;
      delivered: number;
      cancelled: number;
      revenue: number;
    };

    topViewedProducts?: unknown[];
    topFavoritedProducts?: unknown[];
    topAddedToCartProducts?: unknown[];
  };

  error?: {
    message: string;
  };
}
export interface RecommendationFeedbackProduct {
  productId: string;
  name: string;
  totalFeedback: number;
  helpful: number;
  notHelpful: number;
  averageMatchScore: number;
}

export interface RecommendationFeedbackFaceShape {
  faceShape: string;
  totalFeedback: number;
  helpful: number;
  notHelpful: number;
  helpfulRate: number;
  averageMatchScore: number;
}
export const getAnalyticsSummary =
  async (): Promise<AnalyticsSummaryResponse> => {
    const response = await apiClient.get("/admin/analytics/summary");

    return response.data;
  };
export interface ProductDataQualitySummary {
  totalProducts: number;
  productsWithIssues: number;
  missingName: number;
  missingPrice: number;
  missingCategory: number;
  missingFrameShape: number;
  missingMaterial: number;
  missingDescription: number;
  missingImage: number;
  missingPrescriptionData: number;
  missingTryOnImage: number;
}

export interface ProductDataQualityIssue {
  productId: string;
  name?: string;
  frameShape?: string;
  category?: string;
  issues: string[];
}

export interface ProductDataQualityResponse {
  data?: {
    summary?: ProductDataQualitySummary;
    issues?: ProductDataQualityIssue[];
  };

  error?: {
    message: string;
  };
}
export const getProductDataQuality =
  async (): Promise<ProductDataQualityResponse> => {
    const response = await apiClient.get("/admin/analytics/product-quality");

    return response.data;
  };
