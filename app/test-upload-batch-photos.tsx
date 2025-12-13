import OrderService from "@/services/order.service";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Picture {
  uri: string;
  name: string;
  type: string;
}

export default function TestUploadBatchPhotosScreen() {
  const [batchCode, setBatchCode] = useState("");
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập",
        "Vui lòng cho phép ứng dụng truy cập thư viện ảnh"
      );
      return false;
    }
    return true;
  };

  const pickFromGallery = async () => {
    if (pictures.length >= 5) {
      Alert.alert("Đã đủ ảnh", "Bạn chỉ có thể upload tối đa 5 ảnh");
      return;
    }

    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - pictures.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newPictures = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: `test_photo_${Date.now()}_${index}.jpg`,
        type: "image/jpeg",
      }));
      setPictures([...pictures, ...newPictures].slice(0, 5));
    }
  };

  const addPlaceholderImage = () => {
    if (pictures.length >= 5) {
      Alert.alert("Đã đủ ảnh", "Bạn chỉ có thể upload tối đa 5 ảnh");
      return;
    }

    const placeholder = {
      uri: "https://via.placeholder.com/800x600.jpg?text=Test+Image",
      name: `placeholder_${Date.now()}.jpg`,
      type: "image/jpeg",
    };
    setPictures([...pictures, placeholder]);
  };

  const removePicture = (index: number) => {
    setPictures(pictures.filter((_, i) => i !== index));
  };

  const handleTestUpload = async () => {
    if (!batchCode.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập batchCode");
      return;
    }

    if (pictures.length === 0) {
      Alert.alert("Thiếu ảnh", "Vui lòng chọn ít nhất 1 ảnh để test");
      return;
    }

    console.log("🧪 [TEST FLOW] ===== STARTING BATCH PHOTO UPLOAD TEST =====");
    console.log(
      `🧪 [TEST FLOW] Test initiated at: ${new Date().toISOString()}`
    );
    console.log(`🧪 [TEST FLOW] Batch Code: ${batchCode.trim()}`);
    console.log(`🧪 [TEST FLOW] Number of test photos: ${pictures.length}`);

    try {
      setUploading(true);
      setLastResult(null);

      console.log("🧪 [TEST FLOW] Calling OrderService.uploadBatchPhotos...");
      console.log(`🧪 [TEST FLOW] Service method: uploadBatchPhotos`);
      console.log(
        `🧪 [TEST FLOW] Parameters: batchCode="${batchCode.trim()}", pictures=[${
          pictures.length
        } items]`
      );

      const result = await OrderService.uploadBatchPhotos(
        batchCode.trim(),
        pictures
      );

      console.log("🧪 [TEST FLOW] uploadBatchPhotos completed successfully");
      console.log(`🧪 [TEST FLOW] Result:`, result);
      console.log(`🧪 [TEST FLOW] URLs returned: ${result.urls?.length || 0}`);

      setLastResult({ success: true, data: result });

      console.log("🧪 [TEST FLOW] ===== TEST COMPLETED SUCCESSFULLY =====");

      Alert.alert(
        "Thành công",
        `Upload thành công! ${result.urls?.length || 0} ảnh đã được upload.`,
        [{ text: "OK" }]
      );
    } catch (error: any) {
      console.error("🧪 [TEST FLOW] ===== TEST FAILED =====");
      console.error(
        `🧪 [TEST FLOW] Error occurred at: ${new Date().toISOString()}`
      );
      console.error(`🧪 [TEST FLOW] Error message:`, error.message);

      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      console.error(
        `🧪 [TEST FLOW] Processed error message: "${errorMessage}"`
      );

      setLastResult({ success: false, error: errorMessage, fullError: error });

      console.error("🧪 [TEST FLOW] ===== TEST TERMINATED =====");

      Alert.alert("Lỗi", `Upload thất bại: ${errorMessage}`, [{ text: "OK" }]);
    } finally {
      setUploading(false);
      console.log(
        `🧪 [TEST FLOW] Test finished at: ${new Date().toISOString()}`
      );
    }
  };

  const clearResults = () => {
    setLastResult(null);
  };

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
        <Text style={styles.title}>Test Upload Batch Photos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Batch Code Input */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Batch Code</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập batch code để test..."
            value={batchCode}
            onChangeText={setBatchCode}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Pictures Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Ảnh để upload ({pictures.length}/5)
          </Text>

          {/* Picture Grid */}
          {pictures.length > 0 && (
            <View style={styles.pictureGrid}>
              {pictures.map((picture, index) => (
                <View key={index} style={styles.pictureItem}>
                  <Image
                    source={{ uri: picture.uri }}
                    style={styles.pictureImage}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePicture(index)}
                  >
                    <Ionicons name="close-circle" size={28} color="#EF5350" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add Picture Buttons */}
          <View style={styles.addPictureButtons}>
            <TouchableOpacity
              style={[styles.addButton, styles.galleryButton]}
              onPress={pickFromGallery}
              disabled={uploading}
            >
              <Ionicons name="images" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Chọn từ thư viện</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addButton, styles.placeholderButton]}
              onPress={addPlaceholderImage}
              disabled={uploading}
            >
              <Ionicons name="image" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Ảnh giả</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Test Button */}
        <View style={styles.testSection}>
          <TouchableOpacity
            style={[
              styles.testButton,
              (!batchCode.trim() || pictures.length === 0 || uploading) &&
                styles.testButtonDisabled,
            ]}
            onPress={handleTestUpload}
            disabled={!batchCode.trim() || pictures.length === 0 || uploading}
          >
            {uploading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.testButtonText}>Đang test...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.testButtonText}>Test Upload Function</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {lastResult && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {lastResult.success
                  ? "✅ Kết quả thành công"
                  : "❌ Kết quả thất bại"}
              </Text>
              <TouchableOpacity onPress={clearResults}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {lastResult.success ? (
              <View style={styles.successResult}>
                <Text style={styles.resultText}>
                  URLs uploaded: {lastResult.data?.urls?.length || 0}
                </Text>
                {lastResult.data?.urls && (
                  <ScrollView
                    style={styles.urlsContainer}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    {lastResult.data.urls.map((url: string, index: number) => (
                      <Text key={index} style={styles.urlText}>
                        {index + 1}. {url}
                      </Text>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : (
              <View style={styles.errorResult}>
                <Text style={styles.errorText}>{lastResult.error}</Text>
                <Text style={styles.errorDetails}>
                  Check console for full error details
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pictureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  pictureItem: {
    width: "47%",
    aspectRatio: 1,
    position: "relative",
  },
  pictureImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  removeButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#fff",
    borderRadius: 14,
  },
  addPictureButtons: {
    flexDirection: "row",
    gap: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  galleryButton: {
    backgroundColor: "#66BB6A",
  },
  placeholderButton: {
    backgroundColor: "#FF9800",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  testSection: {
    marginBottom: 16,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2196F3",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  testButtonDisabled: {
    backgroundColor: "#ccc",
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  resultsSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  successResult: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 12,
  },
  errorResult: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 12,
  },
  resultText: {
    fontSize: 14,
    color: "#4CAF50",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#F44336",
    marginBottom: 4,
  },
  errorDetails: {
    fontSize: 12,
    color: "#666",
  },
  urlsContainer: {
    maxHeight: 100,
  },
  urlText: {
    fontSize: 12,
    color: "#666",
    marginRight: 16,
    marginBottom: 4,
  },
});
