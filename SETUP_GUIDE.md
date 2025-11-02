# Skinalyze Shipper App

Ứng dụng dành cho shipper với tính năng:
- Xem danh sách đơn hàng
- Bản đồ Goong.io hiển thị route giao hàng
- Tracking GPS real-time và gửi vị trí lên backend

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy app
npm start
```

## Cấu hình

### 1. Goong Maps API Keys

Cập nhật API keys trong các file:

**`components/delivery-map.tsx`**:
```typescript
const GOONG_MAP_KEY = 'YOUR_GOONG_MAPS_KEY'; // Lấy từ https://account.goong.io
const GOONG_API_KEY = 'YOUR_GOONG_API_KEY';
```

**`services/goong.service.ts`**:
```typescript
const GOONG_API_KEY = 'YOUR_GOONG_API_KEY';
const GOONG_MAPS_KEY = 'YOUR_GOONG_MAPS_KEY';
```

Lấy API keys miễn phí tại: https://account.goong.io

### 2. Backend API Configuration

Cập nhật URL backend trong **`services/location-tracking.service.ts`**:
```typescript
const BACKEND_URL = 'YOUR_BACKEND_API_URL';
```

### 3. Permissions

App đã được cấu hình tự động xin quyền GPS:
- **iOS**: Quyền truy cập vị trí khi sử dụng app và background
- **Android**: ACCESS_FINE_LOCATION, ACCESS_BACKGROUND_LOCATION, FOREGROUND_SERVICE

## Tính năng chính

### 1. Danh sách đơn hàng (Tab "Đơn hàng")
- Hiển thị danh sách đơn hàng với filter theo trạng thái
- Nhận đơn hàng mới
- Xem chi tiết đơn hàng
- Hoàn thành đơn hàng

### 2. Bản đồ Goong.io (Tab "Bản đồ")
- Hiển thị route từ điểm lấy hàng đến điểm giao hàng
- Tracking vị trí real-time
- Tính khoảng cách và thời gian ước tính
- Điều hướng turn-by-turn

### 3. GPS Tracking & Backend Integration

#### Bật tracking:
```typescript
import LocationTrackingService from '@/services/location-tracking.service';

// Bắt đầu gửi vị trí định kỳ (mỗi 10 giây)
LocationTrackingService.startPeriodicTracking(
  shipperId,
  orderId,
  async () => {
    const location = await LocationService.getCurrentLocation();
    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
      };
    }
    return null;
  },
  10000 // 10 seconds
);
```

#### Dừng tracking:
```typescript
LocationTrackingService.stopPeriodicTracking();
```

#### Backend API Endpoints

App sẽ gọi các API sau:

1. **Gửi vị trí GPS**
```
POST /api/shipper/location
Body: {
  shipperId: string,
  orderId?: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
  speed?: number,
  heading?: number,
  timestamp: string (ISO 8601)
}
```

2. **Cập nhật trạng thái shipper**
```
POST /api/shipper/status
Body: {
  shipperId: string,
  status: 'online' | 'offline' | 'busy' | 'available',
  location?: {
    latitude: number,
    longitude: number
  },
  timestamp: string
}
```

3. **Thông báo đã đến điểm**
```
POST /api/order/{orderId}/arrival
Body: {
  type: 'pickup' | 'delivery',
  location: {
    latitude: number,
    longitude: number
  },
  timestamp: string
}
```

## Cấu trúc thư mục

```
app/
  (tabs)/
    index.tsx          # Màn hình danh sách đơn hàng
    explore.tsx        # Màn hình bản đồ
    _layout.tsx        # Tab navigation layout
components/
  order-card.tsx       # Component hiển thị card đơn hàng
  delivery-map.tsx     # Component bản đồ Goong.io
services/
  goong.service.ts              # Service tích hợp Goong API
  location.service.ts           # Service xử lý GPS
  location-tracking.service.ts  # Service gửi vị trí lên backend
types/
  order.ts            # Type definitions cho Order
```

## Chạy app

### Development
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

### Build Production

```bash
# Build Android APK
eas build --platform android

# Build iOS
eas build --platform ios
```

## Lưu ý

1. **Goong Maps**: Sử dụng bản đồ Việt Nam chính xác từ Goong.io
2. **GPS Background**: App có thể tracking vị trí ngay cả khi ở background
3. **Battery**: Nên tối ưu interval gửi vị trí (10-30 giây) để tiết kiệm pin
4. **Network**: Xử lý offline gracefully, queue requests khi mất mạng

## TODO

- [ ] Tích hợp authentication với backend
- [ ] Xử lý offline mode và queue requests
- [ ] Thêm push notifications cho đơn hàng mới
- [ ] Tối ưu battery consumption
- [ ] Thêm history tracking routes
- [ ] Tích hợp chat với khách hàng

## License

MIT
