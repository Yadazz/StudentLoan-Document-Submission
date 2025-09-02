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
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");

const OCR = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState(
    Platform.OS === "ios" ? "192.168.1.37" : "10.0.2.2"
  ); // Default IP based on platform
  const [connectionStatus, setConnectionStatus] = useState("Not tested");

  // Request permissions for accessing images
  const requestPermissions = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Media library permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to make this work!"
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      Alert.alert("Error", "Failed to request permissions");
      return false;
    }
  };

  // Test server connection
  const testConnection = async () => {
    setConnectionStatus("Testing...");
    try {
      const API_URL = `http://${serverUrl}:5000/health`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        setConnectionStatus("✅ Connected");
        Alert.alert(
          "Success",
          `Server is reachable!\nStatus: ${result.status}`
        );
      } else {
        setConnectionStatus("❌ Server Error");
        Alert.alert("Server Error", `HTTP ${response.status}`);
      }
    } catch (error) {
      setConnectionStatus("❌ Connection Failed");
      if (error.name === "AbortError") {
        Alert.alert(
          "Connection Test",
          "Connection timed out. Please check:\n\n1. Flask server is running\n2. IP address is correct\n3. Port 5000 is open"
        );
      } else {
        Alert.alert(
          "Connection Test",
          `Failed to connect: ${error.message}\n\nTips:\n- Make sure Flask server is running\n- Check your IP address\n- Ensure devices are on same network`
        );
      }
    }
  };

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    try {
      console.log("Starting image picker...");

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        console.log("Permission denied");
        return;
      }

      console.log("Permission granted, launching image library...");

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Reduced quality for faster upload
        base64: true,
        exif: false,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log("Image selected successfully");
        setSelectedImage(result.assets[0]);
        setExtractedText("");
        Alert.alert("Success", "Image selected successfully!");
      } else {
        console.log("Image selection cancelled or failed");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", `Failed to pick image: ${error.message}`);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      console.log("Requesting camera permission...");

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log("Camera permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera permissions to make this work!"
        );
        return;
      }

      console.log("Camera permission granted, launching camera...");

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Reduced quality
        base64: true,
        exif: false,
      });

      console.log("Camera result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log("Photo taken successfully");
        setSelectedImage(result.assets[0]);
        setExtractedText("");
        Alert.alert("Success", "Photo taken successfully!");
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", `Failed to take photo: ${error.message}`);
    }
  };

  // Process OCR with improved error handling and timeout
  const processOCR = async () => {
    if (!selectedImage) {
      Alert.alert("No Image", "Please select an image first");
      return;
    }

    setLoading(true);
    try {
      const API_URL = `http://${serverUrl}:5000/api/ocr`;

      console.log(`Sending OCR request to: ${API_URL}`);

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 60000); // 60 second timeout for OCR processing

      // Prepare the base64 data
      let base64Data = selectedImage.base64;

      // Remove data URL prefix if present
      if (base64Data && base64Data.includes("base64,")) {
        base64Data = base64Data.split("base64,")[1];
      }

      const requestBody = {
        image: base64Data,
        languages: ["th", "en"],
      };

      console.log("Sending OCR request...");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("OCR result:", result);

      if (result.success) {
        setExtractedText(result.text || "No text found in image");
        Alert.alert("Success", "Text extracted successfully!");
      } else {
        throw new Error(result.message || "OCR processing failed");
      }
    } catch (error) {
      console.error("OCR Error:", error);

      let errorMessage = "Failed to process image. ";

      if (error.name === "AbortError") {
        errorMessage +=
          "Request timed out. The image might be too large or the server is busy.";
      } else if (
        error.message.includes("Network request failed") ||
        error.message.includes("fetch") ||
        error.name === "TypeError"
      ) {
        errorMessage +=
          "Cannot connect to server. Please:\n\n" +
          "1. Test connection first\n" +
          "2. Make sure Flask server is running\n" +
          "3. Check IP address is correct\n" +
          "4. Ensure devices are on same WiFi network";
      } else {
        errorMessage += `\n\nError: ${error.message}`;
      }

      Alert.alert("OCR Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get automatic IP suggestions based on platform
  const getIPSuggestions = () => {
    if (Platform.OS === "android") {
      return "Android Emulator: 10.0.2.2\nPhysical Android: Your computer's IP (e.g., 192.168.1.37)";
    } else {
      return "iOS Simulator: Your computer's IP (e.g., 192.168.1.37)\nPhysical iPhone: Your computer's IP (same WiFi network)";
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>OCR Text Recognition</Text>

      {/* Server Configuration */}
      <View style={styles.configContainer}>
        <Text style={styles.configTitle}>Server Configuration</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Server IP Address:</Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="192.168.1.37"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.connectionRow}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={testConnection}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>🔗 Test Connection</Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.statusText,
              connectionStatus.includes("✅") && styles.statusSuccess,
              connectionStatus.includes("❌") && styles.statusError,
            ]}
          >
            {connectionStatus}
          </Text>
        </View>

        <Text style={styles.helpText}>{getIPSuggestions()}</Text>
      </View>

      {/* Image Selection Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={pickImageFromGallery}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>📷 Choose from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={takePhoto}
          activeOpacity={0.7}
        >
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
              : "?"}{" "}
            KB |{selectedImage.width}x{selectedImage.height}
          </Text>
        </View>
      )}

      {/* OCR Processing Button */}
      {selectedImage && (
        <TouchableOpacity
          style={[styles.processButton, loading && styles.disabledButton]}
          onPress={processOCR}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.buttonText}> Processing OCR...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>🔤 Extract Text</Text>
          )}
        </TouchableOpacity>
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
  configContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: "#FF9500",
    padding: 12,
    borderRadius: 8,
    flex: 0.6,
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    flex: 0.35,
    textAlign: "right",
  },
  statusSuccess: {
    color: "#34C759",
  },
  statusError: {
    color: "#FF3B30",
  },
  helpText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    lineHeight: 16,
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
    shadowOffset: { width: 0, height: 2 },
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
