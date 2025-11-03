import { BACKEND_URL } from '@/config/env';
import axios from 'axios';

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
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
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
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'REJECTED' | 'CANCELLED';
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
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'REJECTED' | 'CANCELLED';
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
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED' | 'CANCELLED';
  totalAmount: string | null;
  codCollectDate: string | null;
  codTransferDate: string | null;
  estimatedDeliveryDate: string | null;
  returnedDate: string | null;
  deliveredDate: string | null;
  shippingStaff?: User;
  shippingStaffId: string | null;
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
  private accessToken: string = '';

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
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`,
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
      console.error('Error fetching available orders:', error);
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
      console.error('Error fetching my deliveries:', error);
      throw error;
    }
  }

  /**
   * Get shipping log detail by ID
   */
  async getShippingLogDetail(shippingLogId: string): Promise<ShippingLogResponse> {
    try {
      const response = await axios.get<APIResponse<ShippingLogResponse>>(
        `${BACKEND_URL}/api/v1/shipping-logs/${shippingLogId}`,
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error fetching shipping log detail:', error);
      throw error;
    }
  }

  /**
   * Get shipping logs by order ID (may return multiple logs for same order)
   */
  async getShippingLogsByOrderId(orderId: string): Promise<ShippingLogResponse[]> {
    try {
      const response = await axios.get<APIResponse<ShippingLogResponse[]>>(
        `${BACKEND_URL}/api/v1/shipping-logs/order/${orderId}`,
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error fetching shipping logs by order ID:', error);
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
      console.error('Error assigning order to me:', error);
      throw error;
    }
  }

  /**
   * Update shipping log status
   */
  async updateShippingStatus(
    shippingLogId: string,
    status: 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED',
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
      
      console.log('🔄 Updating shipping status:');
      console.log('  URL:', `${BACKEND_URL}/api/v1/shipping-logs/${shippingLogId}`);
      console.log('  Shipping Log ID:', shippingLogId);
      console.log('  Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('  Headers:', this.getHeaders());
      
      const response = await axios.patch<APIResponse<ShippingLogResponse>>(
        `${BACKEND_URL}/api/v1/shipping-logs/${shippingLogId}`,
        requestBody,
        {
          headers: this.getHeaders(),
        }
      );
      
      console.log('✅ Update successful:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error updating shipping status:');
      console.error('  Status Code:', error.response?.status);
      console.error('  Status Text:', error.response?.statusText);
      console.error('  Error Message:', error.response?.data?.message || error.message);
      console.error('  Full Response:', JSON.stringify(error.response?.data, null, 2));
      console.error('  Request Config:', {
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
    return this.updateShippingStatus(shippingLogId, 'OUT_FOR_DELIVERY');
  }

  /**
   * Mark as picked up (shipper collected the package)
   */
  async markAsPickedUp(shippingLogId: string): Promise<ShippingLogResponse> {
    return this.updateShippingStatus(shippingLogId, 'PICKED_UP');
  }

  /**
   * Mark as in transit
   */
  async markAsInTransit(shippingLogId: string): Promise<ShippingLogResponse> {
    return this.updateShippingStatus(shippingLogId, 'IN_TRANSIT');
  }

  /**
   * Complete delivery
   */
  async completeDelivery(
    shippingLogId: string,
    isCodCollected: boolean,
    totalAmount?: number
  ): Promise<ShippingLogResponse> {
    return this.updateShippingStatus(shippingLogId, 'DELIVERED', {
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
    return this.updateShippingStatus(shippingLogId, 'RETURNED', {
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
    return this.updateShippingStatus(shippingLogId, 'FAILED', {
      unexpectedCase: reason,
    });
  }
}

export default new OrderService();
