import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");

const OCR = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);

  // ขอ permission สำหรับการเข้าถึงรูปภาพ
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera roll permissions to make this work!"
      );
      return false;
    }
    return true;
  };

  // เลือกรูปภาพจาก Gallery
  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images, // Fixed: Updated to new API
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setExtractedText(""); // เคลียร์ข้อความเก่า
    }
  };

  // ถ่ายรูปด้วยกล้อง
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera permissions to make this work!"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setExtractedText("");
    }
  };

  // ส่งรูปภาพไปยัง Python Backend สำหรับ OCR
  const processOCR = async () => {
    if (!selectedImage) {
      Alert.alert("No Image", "Please select an image first");
      return;
    }

    setLoading(true);
    try {
      // Updated API URL for different platforms
      let API_URL;
      if (Platform.OS === "android") {
        // For Android emulator, use 10.0.2.2 instead of localhost
        API_URL = "http://10.0.2.2:5000/api/ocr";
      } else if (Platform.OS === "ios") {
        // For iOS simulator, localhost should work
        API_URL = "http://localhost:5000/api/ocr";
      } else {
        // For physical devices, use your computer's IP address
        // Replace with your actual IP: API_URL = "http://192.168.1.XXX:5000/api/ocr";
        API_URL = "http://127.0.0.1:5000/api/ocr";
      }

      // Method 1: Using base64 (recommended for cross-platform compatibility)
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          image: selectedImage.base64,
          languages: ["th", "en"], // รองรับภาษาไทยและอังกฤษ
        }),
        timeout: 30000, // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        setExtractedText(result.text || "No text found in image");
      } else {
        throw new Error(result.message || "OCR processing failed");
      }
    } catch (error) {
      console.error("OCR Error:", error);

      let errorMessage = "Failed to process image. ";

      if (
        error.message.includes("Network request failed") ||
        error.name === "TypeError"
      ) {
        errorMessage +=
          "Cannot connect to server. Please check:\n\n" +
          "1. Flask server is running on port 5000\n" +
          "2. Your device/emulator can reach the server\n" +
          "3. For Android emulator: use 10.0.2.2:5000\n" +
          "4. For physical device: use your computer's IP address";
      } else {
        errorMessage += "Please try again.\n\nError: " + error.message;
      }

      Alert.alert("Connection Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Alternative method using FormData (if needed)
  const processOCRWithFormData = async () => {
    if (!selectedImage) {
      Alert.alert("No Image", "Please select an image first");
      return;
    }

    setLoading(true);
    try {
      let API_URL;
      if (Platform.OS === "android") {
        API_URL = "http://10.0.2.2:5000/api/ocr-formdata";
      } else {
        API_URL = "http://localhost:5000/api/ocr-formdata";
      }

      const formData = new FormData();
      formData.append("image", {
        uri: selectedImage.uri,
        type: "image/jpeg",
        name: "image.jpg",
      });
      formData.append("languages", JSON.stringify(["th", "en"]));

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setExtractedText(result.text || "No text found in image");
      } else {
        throw new Error(result.message || "OCR processing failed");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      Alert.alert(
        "Error",
        "Failed to process image with FormData method.\n\n" + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>OCR Text Recognition</Text>

      {/* Connection Status Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Platform: {Platform.OS} |
          {Platform.OS === "android"
            ? " Using: 10.0.2.2:5000"
            : " Using: localhost:5000"}
        </Text>
      </View>

      {/* Image Selection Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImageFromGallery}>
          <Text style={styles.buttonText}>📷 Choose from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>📸 Take Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Image Display */}
      {selectedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage.uri }} style={styles.image} />
          <Text style={styles.imageInfo}>
            Size:{" "}
            {selectedImage.fileSize
              ? Math.round(selectedImage.fileSize / 1024)
              : "?"}
            KB |{selectedImage.width}x{selectedImage.height}
          </Text>
        </View>
      )}

      {/* OCR Processing Buttons */}
      {selectedImage && (
        <View>
          <TouchableOpacity
            style={[styles.processButton, loading && styles.disabledButton]}
            onPress={processOCR}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>🔍 Extract Text (Base64)</Text>
            )}
          </TouchableOpacity>

          {/* Alternative FormData method button */}
          <TouchableOpacity
            style={[styles.alternativeButton, loading && styles.disabledButton]}
            onPress={processOCRWithFormData}
            disabled={loading}
          >
            <Text style={styles.buttonText}>📤 Try FormData Method</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Extracted Text Display */}
      {extractedText ? (
        <View style={styles.textContainer}>
          <Text style={styles.textTitle}>Extracted Text:</Text>
          <Text style={styles.extractedText}>{extractedText}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  infoContainer: {
    backgroundColor: "#e3f2fd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: "#1976d2",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    flex: 0.48,
    alignItems: "center",
  },
  processButton: {
    backgroundColor: "#34C759",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  alternativeButton: {
    backgroundColor: "#FF9500",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  image: {
    width: width - 40,
    height: 250,
    resizeMode: "contain",
    borderRadius: 10,
  },
  imageInfo: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  textContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  extractedText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
    textAlign: "left",
  },
});

export default OCR;
