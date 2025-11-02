import DeliveryMap from '@/components/delivery-map';
import LocationService from '@/services/location.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - Thay thế bằng đơn hàng thực tế
  const currentOrder = {
    pickupLocation: {
      latitude: 10.7769,
      longitude: 106.7009,
      address: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
    },
    deliveryLocation: {
      latitude: 10.7626,
      longitude: 106.6826,
      address: '456 Lê Văn Việt, Quận 9, TP.HCM',
    },
  };

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const granted = await LocationService.requestPermissions();
      setHasPermission(granted);
      
      if (!granted) {
        Alert.alert(
          'Cần quyền truy cập vị trí',
          'Ứng dụng cần quyền truy cập vị trí để hiển thị bản đồ và điều hướng.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = () => {
    Alert.alert(
      'Bắt đầu điều hướng',
      'Bạn có muốn bắt đầu điều hướng đến điểm lấy hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bắt đầu',
          onPress: () => {
            // TODO: Start navigation
            console.log('Starting navigation...');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang kiểm tra quyền truy cập...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={64} color="#ccc" />
          <Text style={styles.errorTitle}>Không có quyền truy cập vị trí</Text>
          <Text style={styles.errorText}>
            Vui lòng cấp quyền truy cập vị trí trong cài đặt để sử dụng tính năng này.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={checkLocationPermission}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bản đồ</Text>
      </View>
      
      <DeliveryMap
        pickupLocation={currentOrder.pickupLocation}
        deliveryLocation={currentOrder.deliveryLocation}
        onNavigate={handleNavigate}
        showNavigation={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#42A5F5',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
