// components/FileDetailModal.js - Updated with multiple files navigation
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PanGestureHandler, PinchGestureHandler, State } from "react-native-gesture-handler";

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
  // New props for multiple files navigation
  selectedFileIndex = 0,
  totalFiles = 0,
  onNavigateFile,
}) => {
  const renderContent = () => {
    if (isLoadingContent) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>กำลังโหลดไฟล์...</Text>
        </View>
      );
    }

    switch (contentType) {
      case "image":
        return (
          <ScrollView
            style={styles.imageContainer}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <Image
              source={{ uri: fileContent }}
              style={[styles.image, { transform: [{ scale: imageZoom }] }]}
              resizeMode="contain"
            />
          </ScrollView>
        );

      case "text":
        return (
          <ScrollView style={styles.textContainer}>
            <Text style={styles.textContent}>{fileContent}</Text>
          </ScrollView>
        );

      case "pdf":
      case "other":
      default:
        return (
          <View style={styles.genericContainer}>
            <Ionicons
              name={contentType === "pdf" ? "document-text" : "document"}
              size={64}
              color="#9ca3af"
            />
            <Text style={styles.genericText}>{fileContent}</Text>
          </View>
        );
    }
  };

  const renderNavigationButtons = () => {
    if (totalFiles <= 1) return null;

    return (
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            selectedFileIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={() => onNavigateFile('prev')}
          disabled={selectedFileIndex === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={selectedFileIndex === 0 ? "#9ca3af" : "#2563eb"} 
          />
          <Text style={[
            styles.navButtonText,
            selectedFileIndex === 0 && styles.navButtonTextDisabled,
          ]}>
            ก่อนหน้า
          </Text>
        </TouchableOpacity>

        <View style={styles.fileCounter}>
          <Text style={styles.fileCounterText}>
            {selectedFileIndex + 1} / {totalFiles}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            selectedFileIndex === totalFiles - 1 && styles.navButtonDisabled,
          ]}
          onPress={() => onNavigateFile('next')}
          disabled={selectedFileIndex === totalFiles - 1}
        >
          <Text style={[
            styles.navButtonText,
            selectedFileIndex === totalFiles - 1 && styles.navButtonTextDisabled,
          ]}>
            ถัดไป
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={selectedFileIndex === totalFiles - 1 ? "#9ca3af" : "#2563eb"} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderFileInfo = () => {
    if (!selectedFile) return null;

    return (
      <View style={styles.fileInfoSection}>
        <Text style={styles.fileInfoTitle}>ข้อมูลไฟล์</Text>
        <View style={styles.infoRow}>
          <Ionicons name="document-text-outline" size={16} color="#6b7280" />
          <Text style={styles.infoLabel}>ชื่อไฟล์:</Text>
          <Text style={styles.infoValue} numberOfLines={2}>
            {selectedFile.filename}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="resize-outline" size={16} color="#6b7280" />
          <Text style={styles.infoLabel}>ขนาด:</Text>
          <Text style={styles.infoValue}>
            {formatFileSize(selectedFile.size)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text style={styles.infoLabel}>อัปโหลดเมื่อ:</Text>
          <Text style={styles.infoValue}>{selectedFile.uploadDate}</Text>
        </View>
        {selectedFile.mimeType && (
          <View style={styles.infoRow}>
            <Ionicons name="code-outline" size={16} color="#6b7280" />
            <Text style={styles.infoLabel}>ประเภท:</Text>
            <Text style={styles.infoValue}>{selectedFile.mimeType}</Text>
          </View>
        )}
        {selectedFile.ocrValidated && (
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={16} color="#10b981" />
            <Text style={styles.infoLabel}>สถานะ:</Text>
            <Text style={[styles.infoValue, { color: "#10b981" }]}>
              ตรวจสอบ OCR แล้ว
            </Text>
          </View>
        )}
      </View>
    );
  };

  const handleRemoveFileConfirm = () => {
    if (!selectedFile) return;

    Alert.alert(
      "ลบไฟล์",
      `คุณต้องการลบไฟล์ "${selectedFile.filename}" หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: () => {
            // Extract docId from the modal context or pass it separately
            const docId = selectedFile.docId; // You may need to add this to selectedFile
            handleRemoveFile(docId, selectedFileIndex);
          },
        },
      ]
    );
  };

  if (!visible || !selectedFile) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedDocTitle}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleOpenUploadedFile(selectedFile)}
            >
              <Ionicons name="share-outline" size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation buttons for multiple files */}
        {renderNavigationButtons()}

        {/* File content */}
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>

        {/* File information */}
        <ScrollView style={styles.bottomSection}>
          {renderFileInfo()}
        </ScrollView>

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.openExternalButton}
            onPress={() => handleOpenUploadedFile(selectedFile)}
          >
            <Ionicons name="open-outline" size={20} color="#2563eb" />
            <Text style={styles.openExternalText}>เปิดด้วยแอปภายนอก</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.removeFileButton}
            onPress={handleRemoveFileConfirm}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={styles.removeFileText}>ลบไฟล์นี้</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
  },
  navigationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2563eb",
    minWidth: 80,
    justifyContent: "center",
  },
  navButtonDisabled: {
    backgroundColor: "#f9fafb",
    borderColor: "#d1d5db",
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
    marginHorizontal: 4,
  },
  navButtonTextDisabled: {
    color: "#9ca3af",
  },
  fileCounter: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  fileCounterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.6,
  },
  textContainer: {
    flex: 1,
    padding: 16,
  },
  textContent: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    fontFamily: "monospace",
  },
  genericContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  genericText: {
    marginTop: 16,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  bottomSection: {
    maxHeight: 200,
    backgroundColor: "#fff",
  },
  fileInfoSection: {
    padding: 16,
  },
  fileInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  bottomActions: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    gap: 12,
  },
  openExternalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  openExternalText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
    marginLeft: 8,
  },
  removeFileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  removeFileText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
    marginLeft: 8,
  },
});

export default FileDetailModal;
