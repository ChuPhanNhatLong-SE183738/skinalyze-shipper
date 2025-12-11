import { BACKEND_URL } from "@/config/env";
import axios from "axios";

// Product type
export interface Product {
  productId: string;
  productName: string;
  productDescription: string;
  stock: number;
  brand: string;
  sellingPrice: number;
  productImages: string[];
  ingredients: string;
  suitableFor: string[];
  reviews: any[];
  salePercentage: string;
  createdAt: string;
  updatedAt: string;
}

// Order Item type
export interface OrderItem {
  orderItemId: string;
  orderId: string;
  product: Product;
  productId: string;
  priceAtTime: string;
  quantity: number;
}

// Transaction type
export interface Transaction {
  transactionId: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "FAILED";
  totalAmount: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

// User/Staff type
export interface User {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  photoUrl: string | null;
  dob: string;
  role: string;
  balance: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Customer type (simplified without user for my-deliveries)
export interface Customer {
  customerId: string;
  aiUsageAmount: number;
  allergicTo: string[];
  pastDermatologicalHistory: string[];
  purchaseHistory: any[];
  createdAt: string;
  updatedAt: string;
}

// Order type (simplified for my-deliveries)
export interface SimpleOrder {
  orderId: string;
  customer: Customer;
  customerId: string;
  transactionId: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPING"
    | "DELIVERED"
    | "REJECTED"
    | "CANCELLED";
  shippingAddress: string;
  notes: string | null;
  rejectionReason: string | null;
  processedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Full Order with items and transaction
export interface FullOrder {
  orderId: string;
  customer: {
    customerId: string;
    user: {
      userId: string;
      email: string;
      fullName: string;
      phone: string;
      photoUrl: string | null;
      dob: string;
      role: string;
      balance: string;
      isActive: boolean;
      isVerified: boolean;
    };
    aiUsageAmount: number;
    allergicTo: string[];
    pastDermatologicalHistory: string[];
    purchaseHistory: any[];
    createdAt: string;
    updatedAt: string;
  };
  customerId: string;
  transaction: Transaction;
  transactionId: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPING"
    | "DELIVERED"
    | "REJECTED"
    | "CANCELLED";
  shippingAddress: string;
  notes: string | null;
  rejectionReason: string | null;
  processedBy: string | null;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// Shipping Log API Response Types
export interface ShippingLogResponse {
  shippingLogId: string;
  order: FullOrder | SimpleOrder;
  orderId: string;
  shippingFee: string | null;
  carrierName: string | null;
  note: string | null;
  unexpectedCase: string | null;
  isCodCollected: boolean;
  isCodTransferred: boolean;
  status:
    | "PENDING"
    | "ASSIGNED"
    | "PICKED_UP"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "FAILED"
    | "RETURNED"
    | "CANCELLED";
  totalAmount: string | null;
  codCollectDate: string | null;
  codTransferDate: string | null;
  estimatedDeliveryDate: string | null;
  returnedDate: string | null;
  deliveredDate: string | null;
  shippingStaff?: User;
  shippingStaffId: string | null;
  batchCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface APIResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

class OrderService {
  private accessToken: string = "";

  /**
   * Set access token for authentication
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Get headers with authentication
   */
  private getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  /**
   * Get available shipping logs (orders without assigned staff)
   */
  async getAvailableOrders(): Promise<ShippingLogResponse[]> {
    try {
      const response = await axios.get<APIResponse<ShippingLogResponse[]>>(
        `${BACKEND_URL}/api/v1/shipping-logs/available`,
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error fetching available orders:", error);
      throw error;
    }
  }

  /**
   * Get my deliveries (orders assigned to current staff)
   */
  async getMyDeliveries(): Promise<ShippingLogResponse[]> {
    try {
      const response = await axios.get<APIResponse<ShippingLogResponse[]>>(
        `${BACKEND_URL}/api/v1/shipping-logs/my-deliveries`,
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error fetching my deliveries:", error);
      throw error;
    }
  }

  /**
   * Get shipping log detail by ID
   */
  async getShippingLogDetail(
    shippingLogId: string
  ): Promise<ShippingLogResponse> {
    try {
      const response = await axios.get<APIResponse<ShippingLogResponse>>(
        `${BACKEND_URL}/api/v1/shipping-logs/${shippingLogId}`,
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error fetching shipping log detail:", error);
      throw error;
    }
  }

  /**
   * Get shipping logs by order ID (may return multiple logs for same order)
   */
  async getShippingLogsByOrderId(
    orderId: string
  ): Promise<ShippingLogResponse[]> {
    try {
      const response = await axios.get<APIResponse<ShippingLogResponse[]>>(
        `${BACKEND_URL}/api/v1/shipping-logs/order/${orderId}`,
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error fetching shipping logs by order ID:", error);
      throw error;
    }
  }

  /**
   * Assign shipping log to current staff (self-assign)
   */
  async assignToMe(shippingLogId: string): Promise<ShippingLogResponse> {
    try {
      const response = await axios.post<APIResponse<ShippingLogResponse>>(
        `${BACKEND_URL}/api/v1/shipping-logs/${shippingLogId}/assign-to-me`,
        {},
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error assigning order to me:", error);
      throw error;
    }
  }

  /**
   * Update shipping log status
   */
  async updateShippingStatus(
    shippingLogId: string,
    status:
      | "PICKED_UP"
      | "IN_TRANSIT"
      | "OUT_FOR_DELIVERY"
      | "DELIVERED"
      | "FAILED"
      | "RETURNED",
    data?: {
      note?: string;
      unexpectedCase?: string;
      isCodCollected?: boolean;
      totalAmount?: number;
    }
  ): Promise<ShippingLogResponse> {
    try {
      const requestBody = {
        status,
        ...data,
      };

      console.log("🔄 Updating shipping status:");
      console.log(
        "  URL:",
        `${BACKEND_URL}/api/v1/shipping-logs/${shippingLogId}`
      );
      console.log("  Shipping Log ID:", shippingLogId);
      console.log("  Request Body:", JSON.stringify(requestBody, null, 2));
      console.log("  Headers:", this.getHeaders());

      const response = await axios.patch<APIResponse<ShippingLogResponse>>(
        `${BACKEND_URL}/api/v1/shipping-logs/${shippingLogId}`,
        requestBody,
        {
          headers: this.getHeaders(),
        }
      );

      console.log("✅ Update successful:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error updating shipping status:");
      console.error("  Status Code:", error.response?.status);
      console.error("  Status Text:", error.response?.statusText);
      console.error(
        "  Error Message:",
        error.response?.data?.message || error.message
      );
      console.error(
        "  Full Response:",
        JSON.stringify(error.response?.data, null, 2)
      );
      console.error("  Request Config:", {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      });
      throw error;
    }
  }

  /**
   * Start shipping (shipper picks up and starts delivery)
   */
  async startShipping(shippingLogId: string): Promise<ShippingLogResponse> {
    return this.updateShippingStatus(shippingLogId, "OUT_FOR_DELIVERY");
  }

  /**
   * Mark as picked up (shipper collected the package)
   */
  async markAsPickedUp(shippingLogId: string): Promise<ShippingLogResponse> {
    return this.updateShippingStatus(shippingLogId, "PICKED_UP");
  }

  /**
   * Mark as in transit
   */
  async markAsInTransit(shippingLogId: string): Promise<ShippingLogResponse> {
    return this.updateShippingStatus(shippingLogId, "IN_TRANSIT");
  }

  /**
   * Complete delivery
   */
  async completeDelivery(
    shippingLogId: string,
    isCodCollected: boolean,
    totalAmount?: number
  ): Promise<ShippingLogResponse> {
    return this.updateShippingStatus(shippingLogId, "DELIVERED", {
      isCodCollected,
      totalAmount,
    });
  }

  /**
   * Mark order as returned
   */
  async returnOrder(
    shippingLogId: string,
    reason: string
  ): Promise<ShippingLogResponse> {
    return this.updateShippingStatus(shippingLogId, "RETURNED", {
      unexpectedCase: reason,
    });
  }

  /**
   * Cancel shipping (mark as failed)
   */
  async cancelShipping(
    shippingLogId: string,
    reason: string
  ): Promise<ShippingLogResponse> {
    return this.updateShippingStatus(shippingLogId, "FAILED", {
      unexpectedCase: reason,
    });
  }

  /**
   * Get batch delivery suggestions for a customer
   * Returns orders from same customer that can be batched together
   */
  async getBatchSuggestions(
    customerId: string
  ): Promise<ShippingLogResponse[]> {
    try {
      const response = await axios.get<APIResponse<ShippingLogResponse[]>>(
        `${BACKEND_URL}/api/v1/shipping-logs/batch-suggestions/${customerId}`,
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error fetching batch suggestions:", error);
      throw error;
    }
  }

  /**
   * Create batch delivery from multiple orders
   */
  async createBatchDelivery(
    orderIds: string[],
    shippingStaffId: string,
    note?: string
  ): Promise<any> {
    try {
      const response = await axios.post<APIResponse<any>>(
        `${BACKEND_URL}/api/v1/shipping-logs/batch-delivery`,
        {
          orderIds,
          shippingStaffId,
          note,
        },
        {
          headers: this.getHeaders(),
        }
      );

      console.log("📦 Batch created:", response.data);
      // Return the full data object which includes batchCode, orderCount, and shippingLogs
      return response.data.data;
    } catch (error) {
      console.error("Error creating batch:", error);
      throw error;
    }
  }

  /**
   * Get all orders in a batch
   */
  async getBatchOrders(batchCode: string): Promise<ShippingLogResponse[]> {
    try {
      const response = await axios.get<APIResponse<ShippingLogResponse[]>>(
        `${BACKEND_URL}/api/v1/shipping-logs/batch/${batchCode}`,
        {
          headers: this.getHeaders(),
        }
      );

      console.log("📦 Batch orders:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching batch orders:", error);
      throw error;
    }
  }

  /**
   * Get all batches
   */
  async getAllBatches(): Promise<any[]> {
    try {
      const response = await axios.get<APIResponse<any[]>>(
        `${BACKEND_URL}/api/v1/shipping-logs/batches`,
        {
          headers: this.getHeaders(),
        }
      );

      console.log("📦 All batches:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching all batches:", error);
      throw error;
    }
  }

  /**
   * Pickup batch (start delivery)
   */
  async pickupBatch(batchCode: string): Promise<any> {
    try {
      const response = await axios.post<APIResponse<any>>(
        `${BACKEND_URL}/api/v1/shipping-logs/batches/${batchCode}/pickup`,
        {},
        {
          headers: this.getHeaders(),
        }
      );

      console.log("📦 Batch picked up:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error picking up batch:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        throw new Error(
          error.response.data?.message || "Không thể pickup batch"
        );
      }
      throw error;
    }
  }

  /**
   * Update single order status in batch
   */
  async updateBatchOrderStatus(
    batchCode: string,
    orderId: string,
    status: string,
    data?: {
      note?: string;
      unexpectedCase?: string;
      finishedPictures?: string[];
    }
  ): Promise<any> {
    try {
      const response = await axios.patch<APIResponse<any>>(
        `${BACKEND_URL}/api/v1/shipping-logs/batches/${batchCode}/orders/${orderId}`,
        {
          orderId,
          status,
          ...data,
        },
        {
          headers: this.getHeaders(),
        }
      );

      console.log("📦 Batch order updated:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("Error updating batch order:", error);
      throw error;
    }
  }

  /**
   * Update multiple orders status in batch at once
   * PATCH /api/v1/shipping-logs/batches/:batchCode/bulk-update
   */
  async updateBatchOrdersBulk(
    batchCode: string,
    updates: Array<{
      orderId: string;
      status: string;
      note?: string;
      unexpectedCase?: string;
      finishedPictures?: string[];
    }>
  ): Promise<any> {
    try {
      const response = await axios.patch<APIResponse<any>>(
        `${BACKEND_URL}/api/v1/shipping-logs/batches/${batchCode}/bulk-update`,
        {
          updates,
        },
        {
          headers: this.getHeaders(),
        }
      );

      console.log("📦 Batch orders bulk updated:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error bulk updating batch orders:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        throw new Error(
          error.response.data?.message || "Không thể cập nhật batch orders"
        );
      }
      throw error;
    }
  }

  /**
   * Collect COD from customer
   */
  async collectCOD(
    shippingLogId: string,
    totalAmount: number
  ): Promise<ShippingLogResponse> {
    try {
      const response = await axios.patch<APIResponse<ShippingLogResponse>>(
        `${BACKEND_URL}/api/v1/shipping-logs/${shippingLogId}/collect-cod`,
        {
          isCodCollected: true,
          totalAmount,
          codCollectDate: new Date().toISOString(),
        },
        {
          headers: this.getHeaders(),
        }
      );

      console.log("💰 COD collected:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("Error collecting COD:", error);
      throw error;
    }
  }

  /**
   * Upload finished pictures after completing delivery
   * POST /api/v1/shipping-logs/:id/upload-finished-pictures
   */
  async uploadFinishedPictures(
    shippingLogId: string,
    pictures: { uri: string; name: string; type: string }[]
  ): Promise<any> {
    const formData = new FormData();

    // Add each picture to FormData
    pictures.forEach((picture, index) => {
      formData.append("pictures", {
        uri: picture.uri,
        name: picture.name || `photo_${index}.jpg`,
        type: picture.type || "image/jpeg",
      } as any);
    });

    const response = await axios.post(
      `${BACKEND_URL}/api/v1/shipping-logs/${shippingLogId}/upload-finished-pictures`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("📸 Pictures uploaded:", response.data);
    return response.data;
  }

  /**
   * Upload batch completion photos
   * POST /api/v1/shipping-logs/batches/:batchCode/upload-completion-photos
   */
  async uploadBatchPhotos(
    batchCode: string,
    pictures: { uri: string; name: string; type: string }[]
  ): Promise<{ urls: string[] }> {
    try {
      const formData = new FormData();

      console.log("📤 Uploading batch photos for:", batchCode);
      console.log("📤 Number of photos:", pictures.length);

      // Add each picture to FormData
      pictures.forEach((picture, index) => {
        console.log(`📷 Adding photo ${index + 1}:`, {
          uri: picture.uri,
          name: picture.name || `batch-proof-${index}.jpg`,
          type: picture.type || "image/jpeg",
        });
        formData.append("photos", {
          uri: picture.uri,
          name: picture.name || `batch-proof-${index}.jpg`,
          type: picture.type || "image/jpeg",
        } as any);
      });

      const url = `${BACKEND_URL}/api/v1/shipping-logs/batches/${batchCode}/upload-completion-photos`;
      console.log("📤 Uploading to:", url);

      const response = await axios.post<APIResponse<{ photoUrls: string[] }>>(
        url,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("📸 Batch photos uploaded:", response.data);
      const photoUrls = response.data.data.photoUrls;
      console.log("📸 Photo URLs:", photoUrls);
      return { urls: photoUrls };
    } catch (error: any) {
      console.error("Error uploading batch photos:", error);
      if (error.response) {
        console.error("❌ Response status:", error.response.status);
        console.error("❌ Response data:", error.response.data);
        console.error("❌ Response headers:", error.response.headers);
      }
      throw error;
    }
  }

  /**
   * Complete batch delivery with proof photos
   * POST /api/v1/shipping-logs/batches/:batchCode/complete
   */
  async completeBatch(
    batchCode: string,
    data: {
      completionPhotos: string[];
      completionNote?: string;
      codCollected?: boolean;
      totalCodAmount?: number;
    }
  ): Promise<any> {
    try {
      const response = await axios.post<APIResponse<any>>(
        `${BACKEND_URL}/api/v1/shipping-logs/batches/${batchCode}/complete`,
        data,
        {
          headers: this.getHeaders(),
        }
      );

      console.log("✅ Batch completed:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error completing batch:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        throw new Error(
          error.response.data?.message || "Không thể hoàn thành batch"
        );
      }
      throw error;
    }
  }

  // ==================== RETURN REQUESTS APIs ====================

  /**
   * Get all return requests (with optional status filter)
   * GET /api/v1/return-requests
   */
  async getAllReturnRequests(status?: string): Promise<any[]> {
    try {
      const params = status ? { status } : {};
      const response = await axios.get<APIResponse<any[]>>(
        `${BACKEND_URL}/api/v1/return-requests`,
        {
          params,
          headers: this.getHeaders(),
        }
      );

      console.log("📦 Return requests loaded:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error loading return requests:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get pending return requests
   * GET /api/v1/return-requests/pending
   */
  async getPendingReturnRequests(): Promise<any[]> {
    try {
      const response = await axios.get<APIResponse<any[]>>(
        `${BACKEND_URL}/api/v1/return-requests/pending`,
        {
          headers: this.getHeaders(),
        }
      );

      console.log("⏳ Pending return requests:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error loading pending returns:", error);
      throw error;
    }
  }

  /**
   * Get return request detail by ID
   * GET /api/v1/return-requests/:id
   */
  async getReturnRequestDetail(returnRequestId: string): Promise<any> {
    try {
      const response = await axios.get<APIResponse<any>>(
        `${BACKEND_URL}/api/v1/return-requests/${returnRequestId}`,
        {
          headers: this.getHeaders(),
        }
      );

      console.log("📋 Return request detail:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error loading return request detail:", error);
      throw error;
    }
  }

  /**
   * Approve return request
   * PATCH /api/v1/return-requests/:id/approve
   */
  async approveReturnRequest(
    returnRequestId: string,
    reviewNote?: string
  ): Promise<any> {
    try {
      const response = await axios.patch<APIResponse<any>>(
        `${BACKEND_URL}/api/v1/return-requests/${returnRequestId}/approve`,
        { reviewNote },
        {
          headers: this.getHeaders(),
        }
      );

      console.log("✅ Return request approved:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error approving return request:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        throw new Error(
          error.response.data?.message || "Không thể duyệt yêu cầu trả hàng"
        );
      }
      throw error;
    }
  }

  /**
   * Reject return request
   * PATCH /api/v1/return-requests/:id/reject
   */
  async rejectReturnRequest(
    returnRequestId: string,
    reviewNote?: string
  ): Promise<any> {
    try {
      const response = await axios.patch<APIResponse<any>>(
        `${BACKEND_URL}/api/v1/return-requests/${returnRequestId}/reject`,
        { reviewNote },
        {
          headers: this.getHeaders(),
        }
      );

      console.log("❌ Return request rejected:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error rejecting return request:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        throw new Error(
          error.response.data?.message || "Không thể từ chối yêu cầu trả hàng"
        );
      }
      throw error;
    }
  }

  /**
   * Assign staff to handle return request
   * PATCH /api/v1/return-requests/:id/assign
   */
  async assignReturnRequest(returnRequestId: string): Promise<any> {
    try {
      const response = await axios.patch<APIResponse<any>>(
        `${BACKEND_URL}/api/v1/return-requests/${returnRequestId}/assign`,
        {},
        {
          headers: this.getHeaders(),
        }
      );

      console.log("👤 Return request assigned:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error assigning return request:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        throw new Error(
          error.response.data?.message || "Không thể nhận việc trả hàng"
        );
      }
      throw error;
    }
  }

  /**
   * Complete return request (confirm returned to warehouse)
   * PATCH /api/v1/return-requests/:id/complete
   */
  async completeReturnRequest(
    returnRequestId: string,
    data: {
      completionNote?: string;
      returnCompletionPhotos?: string[];
    }
  ): Promise<any> {
    try {
      const response = await axios.patch<APIResponse<any>>(
        `${BACKEND_URL}/api/v1/return-requests/${returnRequestId}/complete`,
        data,
        {
          headers: this.getHeaders(),
        }
      );

      console.log("✅ Return request completed:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error completing return request:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        throw new Error(
          error.response.data?.message || "Không thể hoàn thành xử lý trả hàng"
        );
      }
      throw error;
    }
  }

  /**
   * Upload return completion photos
   * POST /api/v1/return-requests/:id/upload-completion-photos
   */
  async uploadReturnCompletionPhotos(
    returnRequestId: string,
    pictures: { uri: string; name: string; type: string }[]
  ): Promise<{ photoUrls: string[] }> {
    try {
      const formData = new FormData();

      console.log("📤 Uploading return completion photos...");
      console.log("📤 Number of photos:", pictures.length);

      pictures.forEach((picture, index) => {
        console.log(`📷 Adding photo ${index + 1}:`, {
          uri: picture.uri,
          name: picture.name || `return-proof-${index}.jpg`,
          type: picture.type || "image/jpeg",
        });
        formData.append("photos", {
          uri: picture.uri,
          name: picture.name || `return-proof-${index}.jpg`,
          type: picture.type || "image/jpeg",
        } as any);
      });

      const url = `${BACKEND_URL}/api/v1/return-requests/${returnRequestId}/upload-completion-photos`;
      console.log("📤 Uploading to:", url);

      const response = await axios.post<APIResponse<{ photoUrls: string[] }>>(
        url,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("📸 Return photos uploaded:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error uploading return photos:", error);
      if (error.response) {
        console.error("❌ Response status:", error.response.status);
        console.error("❌ Response data:", error.response.data);
      }
      throw error;
    }
  }
}

export default new OrderService();
