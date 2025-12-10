import DeliveryMap from "@/components/delivery-map";
import ETADisplay from "@/components/eta-display";
import { useLocationTracking } from "@/hooks/use-location-tracking";
import OrderService from "@/services/order.service";
import { Order, convertAPIOrderToAppOrder } from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ⚙️ CONFIGURATION: Maximum distance to allow completing order (in meters)
// Chỉnh giá trị này để test: 2000 = 2km, 1000 = 1km, v.v.
// 999999999 = ~1 triệu km (để test khi đang ở xa)
const MAX_DISTANCE_TO_COMPLETE = 999999999; // meters (cho phép bất kỳ khoảng cách nào)

const statusColors = {
  pending: "#FFA726",
  accepted: "#42A5F5",
  picking: "#AB47BC",
  in_transit: "#9C27B0",
  delivering: "#66BB6A",
  completed: "#78909C",
  failed: "#EF5350",
  returned: "#FF6F00",
};

const statusLabels = {
  pending: "Chờ nhận",
  accepted: "Đã nhận",
  picking: "Đang lấy hàng",
  in_transit: "Đang vận chuyển",
  delivering: "Đang giao",
  completed: "Hoàn thành",
  failed: "Thất bại",
  returned: "Đã trả lại",
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [fullOrderDetails, setFullOrderDetails] = useState<any>(null);

  // Track location to get current distance to customer
  const { currentETA } = useLocationTracking({
    orderId: id,
    enabled:
      !!order &&
      (order.status === "delivering" || (order.status as any) === "in_transit"),
    intervalMs: 10000,
  });

  // Check if shipper is close enough to complete order
  // If MAX_DISTANCE is very large (999999999), always allow completion
  const isCloseEnoughToComplete = currentETA
    ? currentETA.distance <= MAX_DISTANCE_TO_COMPLETE
    : MAX_DISTANCE_TO_COMPLETE >= 999999999; // Allow if no ETA data and distance check is disabled

  useEffect(() => {
    loadOrderDetail();
  }, [id]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);

      // Load shipping log detail
      const response = await OrderService.getShippingLogDetail(id);
      const orderData = convertAPIOrderToAppOrder(response);
      setOrder(orderData);

      // Load full order details by orderId
      if (response.orderId) {
        try {
          const fullDetails = await OrderService.getShippingLogsByOrderId(
            response.orderId
          );
          console.log("📦 Full order details:", fullDetails);
          if (fullDetails && fullDetails.length > 0) {
            setFullOrderDetails(fullDetails[0]);
          }
        } catch (error) {
          console.warn("Could not load full order details:", error);
        }
      }
    } catch (error) {
      console.error("Error loading order detail:", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết đơn hàng");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!order) return;

    try {
      await OrderService.assignToMe(id);
      Alert.alert("Thành công", "Đã nhận đơn hàng");
      loadOrderDetail(); // Reload to get updated status
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể nhận đơn hàng");
    }
  };

  const handleStartShipping = async () => {
    if (!order) return;

    try {
      await OrderService.startShipping(id);
      Alert.alert("Thành công", "Đã bắt đầu giao hàng");
      loadOrderDetail();
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể bắt đầu giao hàng");
    }
  };

  const handleCompleteOrder = async () => {
    if (!order) return;

    // Check if shipper is close enough to complete
    if (!isCloseEnoughToComplete && currentETA) {
      const distanceKm = (currentETA.distance / 1000).toFixed(1);
      const maxDistanceKm = (MAX_DISTANCE_TO_COMPLETE / 1000).toFixed(1);
      Alert.alert(
        "Chưa thể hoàn thành",
        `Bạn cần đến gần hơn để hoàn thành đơn hàng.\n\nKhoảng cách hiện tại: ${distanceKm} km\nKhoảng cách tối đa: ${maxDistanceKm} km`,
        [{ text: "OK" }]
      );
      return;
    }

    // Navigate to upload pictures screen
    router.push(`/upload-pictures?id=${id}` as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#42A5F5" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF5350" />
          <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = statusColors[order.status];
  const statusLabel = statusLabels[order.status];

  // Success screen for completed orders
  if (order.status === "completed") {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.completedContainer}
        >
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={80} color="#fff" />
            </View>
          </View>

          {/* Success Message */}
          <Text style={styles.successTitle}>Đã hoàn thành! 🎉</Text>
          <Text style={styles.successSubtitle}>
            Đơn hàng đã được giao thành công
          </Text>

          {/* Order Info Card */}
          <View style={styles.completedCard}>
            <View style={styles.completedCardRow}>
              <Text style={styles.completedCardLabel}>Mã đơn hàng:</Text>
              <Text style={styles.completedCardValue}>
                #{order.orderNumber}
              </Text>
            </View>

            <View style={styles.completedCardRow}>
              <Text style={styles.completedCardLabel}>Khách hàng:</Text>
              <Text style={styles.completedCardValue}>
                {order.customer.name}
              </Text>
            </View>

            <View style={styles.completedCardRow}>
              <Text style={styles.completedCardLabel}>Số điện thoại:</Text>
              <Text style={styles.completedCardValue}>
                {order.customer.user.phone}
              </Text>
            </View>

            <View style={styles.completedCardRow}>
              <Text style={styles.completedCardLabel}>Tổng tiền:</Text>
              <Text style={[styles.completedCardValue, styles.completedAmount]}>
                {order.totalAmount?.toLocaleString("vi-VN")}đ
              </Text>
            </View>

            <View style={styles.completedCardRow}>
              <Text style={styles.completedCardLabel}>Địa chỉ giao:</Text>
              <Text
                style={[styles.completedCardValue, styles.completedAddress]}
              >
                {order.deliveryLocation.address}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => router.push("/")}
          >
            <Ionicons name="home" size={20} color="#fff" />
            <Text style={styles.backToHomeButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Fullscreen map layout for delivering status
  if (
    (order.status as any) === "delivering" ||
    (order.status as any) === "in_transit"
  ) {
    return (
      <SafeAreaView style={styles.containerFullscreen} edges={["top"]}>
        {/* Fullscreen Map */}
        <View style={styles.mapFullscreen}>
          <DeliveryMap
            pickupLocation={order.pickupLocation}
            deliveryLocation={order.deliveryLocation}
            orderStatus={order.status}
            orderId={order.orderId}
          />
        </View>

        {/* Floating Customer Info Card */}
        <ScrollView
          style={[
            styles.floatingCard,
            isCardExpanded && styles.floatingCardExpanded,
          ]}
          contentContainerStyle={styles.floatingCardContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Toggle */}
          <TouchableOpacity
            style={styles.floatingCardHeader}
            onPress={() => setIsCardExpanded(!isCardExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.customerInfoCompact}>
              {order.customer.avatar ? (
                <Image
                  source={{ uri: order.customer.avatar }}
                  style={styles.avatarSmall}
                />
              ) : (
                <View style={[styles.avatarSmall, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={20} color="#666" />
                </View>
              )}
              <View style={styles.customerDetailsCompact}>
                <Text style={styles.customerNameSmall}>
                  {order.customer.name}
                </Text>
                <Text style={styles.customerPhoneSmall}>
                  {order.customer.user.phone || "Chưa có SĐT"}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <Ionicons
                name={isCardExpanded ? "chevron-up" : "chevron-down"}
                size={24}
                color="#666"
              />
            </View>
          </TouchableOpacity>

          {/* Collapsed: Only show address */}
          {!isCardExpanded && (
            <View style={styles.addressCompact}>
              <Ionicons name="location" size={18} color="#66BB6A" />
              <Text style={styles.addressTextCompact} numberOfLines={2}>
                {order.deliveryLocation.address}
              </Text>
            </View>
          )}

          {/* Expanded: Show all details */}
          {isCardExpanded && (
            <>
              {/* Order Info */}
              <View style={styles.orderInfoCompact}>
                <Text style={styles.orderNumberCompact}>
                  #{order.orderNumber}
                </Text>
                <Text style={styles.orderAmountCompact}>
                  {order.totalAmount
                    ? `${order.totalAmount.toLocaleString("vi-VN")}đ`
                    : "Chưa có"}
                </Text>
              </View>

              {/* Delivery Address */}
              <View style={styles.addressCompact}>
                <Ionicons name="location" size={18} color="#66BB6A" />
                <Text style={styles.addressTextCompact}>
                  {order.deliveryLocation.address}
                </Text>
              </View>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <View style={styles.itemsCompact}>
                  <Text style={styles.itemsTitle}>
                    Sản phẩm ({order.items.length})
                  </Text>
                  {order.items.map((item, index) => (
                    <View key={item.id || index} style={styles.itemRowCompact}>
                      {item.image && (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.itemImageSmall}
                        />
                      )}
                      <View style={styles.itemInfoCompact}>
                        <Text style={styles.itemNameCompact} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemQuantityCompact}>
                          x{item.quantity}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Shipping Log Details */}
              {fullOrderDetails && (
                <View style={styles.shippingLogDetails}>
                  <Text style={styles.itemsTitle}>Thông tin vận chuyển</Text>

                  {fullOrderDetails.shippingFee && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Phí ship:</Text>
                      <Text style={styles.detailValue}>
                        {parseFloat(
                          fullOrderDetails.shippingFee
                        ).toLocaleString("vi-VN")}
                        đ
                      </Text>
                    </View>
                  )}

                  {fullOrderDetails.carrierName && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Đơn vị vận chuyển:</Text>
                      <Text style={styles.detailValue}>
                        {fullOrderDetails.carrierName}
                      </Text>
                    </View>
                  )}

                  {fullOrderDetails.estimatedDeliveryDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Dự kiến giao:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(
                          fullOrderDetails.estimatedDeliveryDate
                        ).toLocaleDateString("vi-VN")}
                      </Text>
                    </View>
                  )}

                  {fullOrderDetails.note && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        Ghi chú vận chuyển:
                      </Text>
                      <Text style={styles.detailValue}>
                        {fullOrderDetails.note}
                      </Text>
                    </View>
                  )}

                  {fullOrderDetails.shippingStaff && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Shipper:</Text>
                      <Text style={styles.detailValue}>
                        {fullOrderDetails.shippingStaff.fullName}
                        {fullOrderDetails.shippingStaff.phone &&
                          ` - ${fullOrderDetails.shippingStaff.phone}`}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>COD:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        fullOrderDetails.isCodCollected &&
                          styles.detailValueSuccess,
                      ]}
                    >
                      {fullOrderDetails.isCodCollected
                        ? "✓ Đã thu"
                        : "✗ Chưa thu"}
                    </Text>
                  </View>
                </View>
              )}

              {/* Notes */}
              {order.notes && (
                <View style={styles.notesCompact}>
                  <Text style={styles.notesLabel}>Ghi chú:</Text>
                  <Text style={styles.notesText}>{order.notes}</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        <View style={styles.etaContainerBottom}>
          <ETADisplay orderId={order.orderId} enabled={true} compact={true} />
        </View>

        {/* Action Buttons */}
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={[styles.actionButtonFloating, styles.callButton]}
            onPress={() => {
              if (order.customer.user.phone) {
                Linking.openURL(`tel:${order.customer.user.phone}`);
              }
            }}
          >
            <Ionicons name="call" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButtonFloating,
              styles.completeButtonFloating,
              !isCloseEnoughToComplete && styles.completeButtonFloatingDisabled,
            ]}
            onPress={handleCompleteOrder}
            disabled={!isCloseEnoughToComplete}
          >
            <Ionicons name="checkmark" size={28} color="#fff" />
            <Text style={styles.actionButtonTextFloating}>
              {isCloseEnoughToComplete
                ? "Hoàn thành"
                : currentETA
                ? `${(currentETA.distance / 1000).toFixed(1)} km`
                : "..."}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Normal layout for other statuses
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <DeliveryMap
            pickupLocation={order.pickupLocation}
            deliveryLocation={order.deliveryLocation}
            orderStatus={order.status}
            orderId={order.orderId}
          />
        </View>

        {/* ETA Display for active deliveries */}
        {((order.status as any) === "picking" ||
          (order.status as any) === "delivering" ||
          (order.status as any) === "in_transit") && (
          <View style={styles.section}>
            <ETADisplay
              orderId={order.orderId}
              enabled={true}
              compact={false}
            />
          </View>
        )}

        {/* Order Info */}
        <View style={styles.section}>
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
              <View
                style={[styles.statusBadge, { backgroundColor: statusColor }]}
              >
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>
            </View>
            <Text style={styles.amount}>
              {order.totalAmount
                ? `${order.totalAmount.toLocaleString("vi-VN")}đ`
                : "Chưa có"}
            </Text>
          </View>
        </View>

        {/* Tracking Button
        {(order.status === 'picking' || order.status === 'delivering') && (
          <View style={styles.section}>
            <TrackingButton order={order} />
          </View>
        )} */}

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.customerCard}>
            {order.customer.avatar ? (
              <Image
                source={{ uri: order.customer.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={32} color="#666" />
              </View>
            )}
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{order.customer.name}</Text>
              <View style={styles.contactRow}>
                <Ionicons name="call" size={16} color="#42A5F5" />
                <Text style={styles.customerPhone}>
                  {order.customer.user.phone || "Chưa có SĐT"}
                </Text>
              </View>
              {order.customer.email && (
                <View style={styles.contactRow}>
                  <Ionicons name="mail" size={16} color="#42A5F5" />
                  <Text style={styles.customerEmail}>
                    {order.customer.email}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa điểm</Text>

          <View style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={24} color="#42A5F5" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Lấy hàng</Text>
              <Text style={styles.locationAddress}>
                {order.pickupLocation.address}
              </Text>
            </View>
          </View>

          <View style={styles.locationDivider} />

          <View style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <Ionicons name="flag" size={24} color="#66BB6A" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Giao hàng</Text>
              <Text style={styles.locationAddress}>
                {order.deliveryLocation.address}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Sản phẩm ({order.items.length})
            </Text>
            {order.items.map((item, index) => (
              <View key={item.id || index} style={styles.itemCard}>
                {item.image && (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                  />
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    <Text style={styles.itemPrice}>
                      {item.price?.toLocaleString("vi-VN")}đ
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Distance & Time */}
        {order.distance && order.estimatedTime && (
          <View style={styles.section}>
            <View style={styles.distanceInfo}>
              <View style={styles.distanceItem}>
                <Ionicons name="navigate" size={20} color="#666" />
                <Text style={styles.distanceText}>
                  {order.distance.toFixed(1)} km
                </Text>
              </View>
              <View style={styles.distanceItem}>
                <Ionicons name="time" size={20} color="#666" />
                <Text style={styles.distanceText}>
                  {order.estimatedTime} phút
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {order.status === "pending" && (
          <>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.batchButton]}
                onPress={() =>
                  router.push(`/create-batch?customerId=${order.customer.id}`)
                }
              >
                <Ionicons name="layers" size={20} color="#FF9800" />
                <Text style={styles.batchButtonText}>Tạo đơn gộp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAcceptOrder}
              >
                <Text style={styles.actionButtonText}>Nhận đơn</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {order.status === "picking" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={handleStartShipping}
          >
            <Text style={styles.actionButtonText}>Bắt đầu giao hàng</Text>
          </TouchableOpacity>
        )}

        {(order.status as any) === "delivering" && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.completeButton,
              !isCloseEnoughToComplete && styles.completeButtonDisabled,
            ]}
            onPress={handleCompleteOrder}
            disabled={!isCloseEnoughToComplete}
          >
            <Text style={styles.actionButtonText}>
              {isCloseEnoughToComplete
                ? "Hoàn thành"
                : currentETA
                ? `Còn cách ${(currentETA.distance / 1000).toFixed(1)} km`
                : "Đang tính khoảng cách..."}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  mapContainer: {
    height: 250,
    backgroundColor: "#e0e0e0",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  amount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#66BB6A",
  },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  customerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  customerPhone: {
    fontSize: 15,
    color: "#666",
  },
  customerEmail: {
    fontSize: 14,
    color: "#666",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationIcon: {
    width: 40,
    alignItems: "center",
    paddingTop: 2,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 8,
  },
  locationLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  locationDivider: {
    width: 2,
    height: 20,
    backgroundColor: "#e0e0e0",
    marginLeft: 19,
    marginVertical: 8,
  },
  itemCard: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#666",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#42A5F5",
  },
  distanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  distanceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  distanceText: {
    fontSize: 15,
    color: "#666",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  batchButton: {
    backgroundColor: "#FFF3E0",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#FF9800",
  },
  batchButtonText: {
    color: "#FF9800",
    fontSize: 16,
    fontWeight: "600",
  },
  acceptButton: {
    backgroundColor: "#42A5F5",
  },
  startButton: {
    backgroundColor: "#AB47BC",
  },
  completeButton: {
    backgroundColor: "#66BB6A",
  },
  completeButtonDisabled: {
    backgroundColor: "#BDBDBD",
    opacity: 0.6,
  },
  backButton: {
    backgroundColor: "#42A5F5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Fullscreen delivery mode styles
  containerFullscreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  mapFullscreen: {
    flex: 1,
  },
  floatingCard: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    maxHeight: 200,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCardExpanded: {
    maxHeight: "70%",
  },
  floatingCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerActions: {
    padding: 4,
  },
  customerInfoCompact: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  customerDetailsCompact: {
    marginLeft: 12,
    flex: 1,
  },
  customerNameSmall: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  customerPhoneSmall: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  backIconFloating: {
    padding: 4,
  },
  addressCompact: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  addressTextCompact: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    lineHeight: 20,
  },
  etaContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  etaContainerBottom: {
    backgroundColor: "#ffffff",
    position: "absolute",
    top: 220,
    left: 16,
    right: 16,
    zIndex: 10,
    elevation: 3,
  },
  floatingActions: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 12,
  },
  actionButtonFloating: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  callButton: {
    flex: 0,
    width: 60,
    backgroundColor: "#42A5F5",
  },
  completeButtonFloating: {
    backgroundColor: "#66BB6A",
    gap: 8,
  },
  completeButtonFloatingDisabled: {
    backgroundColor: "#BDBDBD",
    opacity: 0.6,
  },
  actionButtonTextFloating: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  floatingCardContent: {
    paddingBottom: 8,
  },
  orderInfoCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  orderNumberCompact: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  orderAmountCompact: {
    fontSize: 18,
    fontWeight: "700",
    color: "#66BB6A",
  },
  itemsCompact: {
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  itemRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  itemImageSmall: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  itemInfoCompact: {
    flex: 1,
    marginLeft: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemNameCompact: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  itemQuantityCompact: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
  itemsMore: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  trackingCompact: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  notesCompact: {
    paddingTop: 12,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  closeCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: "#FFEBEE",
  },
  closeCardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF5350",
  },
  shippingLogDetails: {
    paddingTop: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    flex: 1.5,
    textAlign: "right",
  },
  detailValueSuccess: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  // Completion screen styles
  completedContainer: {
    padding: 24,
    alignItems: "center",
  },
  successIconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  successIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  completedCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  completedCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  completedCardLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  completedCardValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    flex: 1.5,
    textAlign: "right",
  },
  completedAmount: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  completedAddress: {
    fontSize: 13,
    lineHeight: 18,
  },
  backToHomeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    shadowColor: "#4CAF50",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  backToHomeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
