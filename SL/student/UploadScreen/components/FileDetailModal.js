// components/FileDetailModal.js
import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const FileDetailModal = ({
  visible,
  onClose,
  selectedFile,
  selectedDocTitle,
  fileContent,
  contentType,
  isLoadingContent,
  formatFileSize,
  handleOpenUploadedFile,
  handleRemoveFile,
  imageZoom,
  setImageZoom,
  setImagePosition,
  loadFileContent,
}) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinchHandler = useAnimatedGestureHandler({
    onStart: () => {},
    onActive: (event) => {
      scale.value = event.scale;
    },
    onEnd: () => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
      }
    },
  });

  const panHandler = useAnimatedGestureHandler({
    onStart: () => {},
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    },
    onEnd: () => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const renderFileContent = () => {
    if (isLoadingContent) {
      return (
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>กำลังโหลดไฟล์...</Text>
        </View>
      );
    }

    switch (contentType) {
      case "image":
        return (
          <PinchGestureHandler onGestureEvent={pinchHandler}>
            <Animated.View style={styles.imageContainer}>
              <PanGestureHandler onGestureEvent={panHandler}>
                <Animated.View style={animatedStyle}>
                  <Image
                    source={{ uri: fileContent }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </PanGestureHandler>
            </Animated.View>
          </PinchGestureHandler>
        );
      case "text":
        return (
          <ScrollView style={styles.textContent}>
            <Text style={styles.textPreview}>{fileContent}</Text>
          </ScrollView>
        );
      case "pdf":
      case "other":
      case "error":
      default:
        return (
          <View style={styles.defaultContent}>
            <Ionicons name="document-outline" size={64} color="#9ca3af" />
            <Text style={styles.defaultContentText}>{fileContent}</Text>
          </View>
        );
    }
  };

  if (!selectedFile) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <View>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedDocTitle}
              </Text>
              <Text style={styles.modalSubtitle} numberOfLines={1}>
                {selectedFile.filename}
              </Text>
            </View>
          </View>
        </View>

        {/* File Content */}
        <View style={styles.contentContainer}>{renderFileContent()}</View>

        {/* File Info */}
        <View style={styles.fileInfoContainer}>
          <View style={styles.fileInfoRow}>
            <Text style={styles.fileInfoLabel}>ชื่อไฟล์:</Text>
            <Text style={styles.fileInfoValue} numberOfLines={2}>
              {selectedFile.filename}
            </Text>
          </View>
          <View style={styles.fileInfoRow}>
            <Text style={styles.fileInfoLabel}>ขนาด:</Text>
            <Text style={styles.fileInfoValue}>
              {formatFileSize(selectedFile.size)}
            </Text>
          </View>
          <View style={styles.fileInfoRow}>
            <Text style={styles.fileInfoLabel}>วันที่อัปโหลด:</Text>
            <Text style={styles.fileInfoValue}>{selectedFile.uploadDate}</Text>
          </View>
          {selectedFile.mimeType && (
            <View style={styles.fileInfoRow}>
              <Text style={styles.fileInfoLabel}>ประเภท:</Text>
              <Text style={styles.fileInfoValue}>{selectedFile.mimeType}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenUploadedFile(selectedFile)}
          >
            <Ionicons name="open-outline" size={20} color="#2563eb" />
            <Text style={styles.actionButtonText}>เปิดด้วยแอปภายนอก</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleRemoveFile(selectedFile.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={[styles.actionButtonText, { color: "#ef4444" }]}>
              ลบไฟล์
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingTop: 50, // Account for status bar
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: screenWidth,
    height: screenHeight * 0.6,
  },
  textContent: {
    flex: 1,
    padding: 16,
  },
  textPreview: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    fontFamily: "monospace",
  },
  defaultContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  defaultContentText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  fileInfoContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  fileInfoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  fileInfoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    width: 100,
  },
  fileInfoValue: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  deleteButton: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#2563eb",
  },
});

export default FileDetailModal;
