import OrderCard from '@/components/order-card';
import AuthService from '@/services/auth.service';
import OrderService from '@/services/order.service';
import { Order, convertAPIOrderToAppOrder } from '@/types/order';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'available' | 'myOrders';
type MyOrderFilter = 'all' | 'picking' | 'delivering' | 'completed';

export default function HomeScreen() {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [myOrderFilter, setMyOrderFilter] = useState<MyOrderFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuthAndLoadOrders();
  }, []);

  const checkAuthAndLoadOrders = async () => {
    try {
      const isAuth = await AuthService.isAuthenticated();
      if (!isAuth) {
        router.replace('/login');
        return;
      }

      const token = await AuthService.getAccessToken();
      if (token) {
        OrderService.setAccessToken(token);
      }

      await loadOrders();
    } catch (error) {
      console.error('Error checking auth:', error);
      router.replace('/login');
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Load available orders and my deliveries separately
      const [available, myDeliveries] = await Promise.all([
        OrderService.getAvailableOrders().catch(() => []),
        OrderService.getMyDeliveries().catch(() => []),
      ]);
      
      setAvailableOrders(available.map(convertAPIOrderToAppOrder));
      setMyOrders(myDeliveries.map(convertAPIOrderToAppOrder));
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMyOrders = myOrders.filter((order) => {
    if (myOrderFilter === 'all') {
      return order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'returned';
    }
    return order.status === myOrderFilter;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order) => {
    Alert.alert('Chi tiết đơn hàng', `Đơn hàng #${order.orderNumber}`);
  };

  const handleAcceptOrder = async (order: Order) => {
    // Only allow accepting orders with status 'pending' (PENDING in API)
    if (order.status !== 'pending') {
      Alert.alert('Thông báo', 'Đơn hàng này không thể nhận');
      return;
    }

    Alert.alert(
      'Nhận đơn hàng',
      `Bạn có muốn nhận đơn hàng #${order.orderNumber}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Nhận đơn',
          onPress: async () => {
            try {
              await OrderService.assignToMe(order.id);
              Alert.alert('Thành công', 'Bạn đã nhận đơn hàng thành công!');
              await loadOrders();
            } catch (error) {
              console.error('Error accepting order:', error);
              Alert.alert('Lỗi', 'Không thể nhận đơn hàng. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const handleCompleteOrder = async (order: Order) => {
    Alert.alert(
      'Hoàn thành đơn hàng',
      `Xác nhận hoàn thành đơn hàng #${order.orderNumber}?\nBạn có thu tiền COD không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Không COD',
          onPress: async () => {
            try {
              await OrderService.completeDelivery(order.id, false);
              Alert.alert('Thành công', 'Đơn hàng đã được hoàn thành!');
              await loadOrders();
            } catch (error) {
              console.error('Error completing order:', error);
              Alert.alert('Lỗi', 'Không thể hoàn thành đơn hàng. Vui lòng thử lại.');
            }
          },
        },
        {
          text: 'Có COD',
          onPress: async () => {
            // TODO: Show input for COD amount
            try {
              const amount = order.totalAmount || 0;
              await OrderService.completeDelivery(order.id, true, amount);
              Alert.alert('Thành công', 'Đơn hàng đã được hoàn thành!');
              await loadOrders();
            } catch (error) {
              console.error('Error completing order:', error);
              Alert.alert('Lỗi', 'Không thể hoàn thành đơn hàng. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#42A5F5" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {availableOrders.length + myOrders.filter(o => o.status === 'delivering').length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'available' && styles.mainTabActive]}
          onPress={() => setActiveTab('available')}
        >
          <Ionicons 
            name="basket-outline" 
            size={20} 
            color={activeTab === 'available' ? '#42A5F5' : '#666'} 
          />
          <Text style={[styles.mainTabText, activeTab === 'available' && styles.mainTabTextActive]}>
            Đơn mới ({availableOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'myOrders' && styles.mainTabActive]}
          onPress={() => setActiveTab('myOrders')}
        >
          <Ionicons 
            name="bicycle-outline" 
            size={20} 
            color={activeTab === 'myOrders' ? '#42A5F5' : '#666'} 
          />
          <Text style={[styles.mainTabText, activeTab === 'myOrders' && styles.mainTabTextActive]}>
            Đơn của tôi ({myOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub filters for My Orders tab */}
      {activeTab === 'myOrders' && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, myOrderFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setMyOrderFilter('all')}
          >
            <Text style={[styles.filterText, myOrderFilter === 'all' && styles.filterTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, myOrderFilter === 'picking' && styles.filterButtonActive]}
            onPress={() => setMyOrderFilter('picking')}
          >
            <Text style={[styles.filterText, myOrderFilter === 'picking' && styles.filterTextActive]}>
              Đang lấy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, myOrderFilter === 'delivering' && styles.filterButtonActive]}
            onPress={() => setMyOrderFilter('delivering')}
          >
            <Text style={[styles.filterText, myOrderFilter === 'delivering' && styles.filterTextActive]}>
              Đang giao
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, myOrderFilter === 'completed' && styles.filterButtonActive]}
            onPress={() => setMyOrderFilter('completed')}
          >
            <Text style={[styles.filterText, myOrderFilter === 'completed' && styles.filterTextActive]}>
              Hoàn thành
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={activeTab === 'available' ? availableOrders : filteredMyOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={handleOrderPress}
            onAccept={handleAcceptOrder}
            onComplete={handleCompleteOrder}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF5252',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  mainTabActive: {
    borderBottomColor: '#42A5F5',
  },
  mainTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  mainTabTextActive: {
    color: '#42A5F5',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#42A5F5',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});
