// components/DocumentsSection.js - Updated with multiple files support
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DocumentsSection = ({
  documents,
  uploads,
  onFileUpload,
  onRemoveFile,
  onShowFileModal,
  onDownloadDocument,
  formatFileSize,
  isValidatingOCR = {},
  ocrBackendAvailable = false,
}) => {
  const renderDocumentActions = (doc) => {
    const docFiles = uploads[doc.id] || [];

    // Show validation spinner for OCR checking
    if (isValidatingOCR[doc.id]) {
      return (
        <View style={styles.actionButtons}>
          <View style={styles.validatingButton}>
            <ActivityIndicator size="small" color="#f59e0b" />
            <Text style={styles.validatingText}>ตรวจสอบ...</Text>
          </View>
        </View>
      );
    }

    if (docFiles.length > 0) {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.addMoreButton}
            onPress={() => onFileUpload(doc.id, true)}
          >
            <Ionicons name="add-circle-outline" size={16} color="#2563eb" />
            <Text style={styles.buttonText}>เพิ่มไฟล์</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeAllButton}
            onPress={() => onRemoveFile(doc.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.buttonText}>ลบทั้งหมด</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => onFileUpload(doc.id, true)}
          >
            <Ionicons name="cloud-upload-outline" size={16} color="#2563eb" />
            <Text style={styles.uploadButtonText}>อัปโหลด</Text>
          </TouchableOpacity>
          {/* Download button for generated forms */}
          {[
            "form_101",
            "consent_student_form",
            "consent_father_form",
            "consent_mother_form",
            "guardian_income_cert",
            "father_income_cert",
            "mother_income_cert",
            "single_parent_income_cert",
            "famo_income_cert",
            "family_status_cert",
          ].includes(doc.id) && (
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => onDownloadDocument(doc.id)}
            >
              <Ionicons name="download-outline" size={16} color="#10b981" />
              <Text style={styles.buttonText}>ดาวน์โหลด</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
  };

  const renderFilesList = (doc) => {
    const docFiles = uploads[doc.id] || [];
    
    if (docFiles.length === 0) return null;

    return (
      <View style={styles.filesContainer}>
        <Text style={styles.filesHeader}>
          ไฟล์ที่อัปโหลด ({docFiles.length} ไฟล์)
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filesScrollView}
        >
          {docFiles.map((file, index) => (
            <View key={`${doc.id}_${index}`} style={styles.fileCard}>
              <TouchableOpacity
                style={styles.filePreview}
                onPress={() => onShowFileModal(doc.id, doc.title, index)}
              >
                <View style={styles.fileIconContainer}>
                  <Ionicons
                    name={getFileIcon(file.mimeType, file.filename)}
                    size={24}
                    color="#2563eb"
                  />
                </View>
                <Text style={styles.fileIndex}>#{index + 1}</Text>
              </TouchableOpacity>
              
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.filename}
                </Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(file.size)}
                </Text>
                
                {/* OCR validation badge for Form 101 files */}
                {doc.id === "form_101" && file.ocrValidated && (
                  <View style={styles.ocrValidatedBadge}>
                    <Ionicons name="shield-checkmark" size={10} color="#10b981" />
                    <Text style={styles.ocrValidatedText}>ตรวจสอบแล้ว</Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.removeFileButton}
                onPress={() => onRemoveFile(doc.id, index)}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderDocumentStatusBadge = (doc) => {
    const docFiles = uploads[doc.id] || [];

    if (docFiles.length === 0) return null;

    // Show total files count
    return (
      <View style={styles.filesCountBadge}>
        <Ionicons name="documents" size={12} color="#2563eb" />
        <Text style={styles.filesCountText}>{docFiles.length} ไฟล์</Text>
      </View>
    );
  };

  const getDocumentCardStyle = (doc) => {
    const baseStyle = [styles.documentCard];
    const docFiles = uploads[doc.id] || [];

    if (docFiles.length > 0) {
      baseStyle.push({ borderLeftColor: "#10b981" }); // Green for uploaded
    } else if (doc.required) {
      baseStyle.push({ borderLeftColor: "#ef4444" }); // Red for required
    } else {
      baseStyle.push({ borderLeftColor: "#e2e8f0" }); // Default gray
    }

    return baseStyle;
  };

  const getFileIcon = (mimeType, filename) => {
    const type = mimeType?.toLowerCase() || "";
    const name = filename?.toLowerCase() || "";

    if (type.startsWith("image/") || name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
      return "image";
    } else if (type.includes("pdf") || name.endsWith(".pdf")) {
      return "document-text";
    } else if (type.includes("word") || name.match(/\.(doc|docx)$/)) {
      return "document";
    } else if (type.includes("excel") || name.match(/\.(xls|xlsx)$/)) {
      return "grid";
    } else if (type.includes("text") || name.match(/\.(txt|json)$/)) {
      return "document-text-outline";
    } else {
      return "document-outline";
    }
  };

  return (
    <View style={styles.documentsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>รายการเอกสาร</Text>
        {!ocrBackendAvailable && (
          <View style={styles.ocrStatusWarning}>
            <Ionicons name="warning-outline" size={16} color="#f59e0b" />
            <Text style={styles.ocrStatusText}>
              ระบบตรวจสอบเอกสารไม่พร้อมใช้งาน
            </Text>
          </View>
        )}
      </View>

      {documents.map((doc, index) => (
        <View key={doc.id} style={getDocumentCardStyle(doc)}>
          <View style={styles.documentContent}>
            <View style={styles.documentInfo}>
              <View style={styles.documentIcon}>
                <Ionicons
                  name={
                    uploads[doc.id]?.length > 0
                      ? "checkmark-circle"
                      : doc.required
                      ? "document-text-outline"
                      : "document-outline"
                  }
                  size={24}
                  color={
                    uploads[doc.id]?.length > 0
                      ? "#10b981"
                      : doc.required
                      ? "#2563eb"
                      : "#9ca3af"
                  }
                />
              </View>
              <View style={styles.documentDetails}>
                <View style={styles.documentTitleContainer}>
                  <Text style={styles.documentTitle} numberOfLines={2}>
                    {doc.title}
                    {doc.required && (
                      <Text style={styles.requiredMark}> *</Text>
                    )}
                  </Text>
                  {doc.id === "form_101" && (
                    <View style={styles.ocrBadge}>
                      <Ionicons name="scan-outline" size={12} color="#8b5cf6" />
                      <Text style={styles.ocrBadgeText}>OCR</Text>
                    </View>
                  )}
                </View>

                {doc.description && (
                  <Text style={styles.documentDescription} numberOfLines={2}>
                    {doc.description}
                  </Text>
                )}

                {renderDocumentStatusBadge(doc)}

                {/* OCR backend unavailable warning for Form 101 */}
                {doc.id === "form_101" && !ocrBackendAvailable && uploads[doc.id]?.length > 0 && (
                  <View style={styles.ocrUnavailableBadge}>
                    <Ionicons name="warning-outline" size={12} color="#f59e0b" />
                    <Text style={styles.ocrUnavailableText}>ไม่ได้ตรวจสอบ OCR</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Files list */}
          {renderFilesList(doc)}

          {/* Action buttons */}
          <View style={styles.documentActions}>
            {renderDocumentActions(doc)}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  documentsSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1e293b",
  },
  ocrStatusWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  ocrStatusText: {
    fontSize: 12,
    color: "#92400e",
    marginLeft: 4,
    fontWeight: "500",
  },
  documentCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderLeftWidth: 4,
    borderLeftColor: "#e2e8f0",
  },
  documentContent: {
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  documentIcon: {
    marginRight: 12,
    paddingTop: 2,
  },
  documentDetails: {
    flex: 1,
  },
  documentTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginRight: 8,
  },
  requiredMark: {
    color: "#ef4444",
    fontWeight: "bold",
  },
  ocrBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#8b5cf6",
  },
  ocrBadgeText: {
    fontSize: 10,
    color: "#8b5cf6",
    fontWeight: "600",
    marginLeft: 2,
  },
  documentDescription: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 8,
  },
  filesCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  filesCountText: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: "600",
    marginLeft: 4,
  },
  ocrUnavailableBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  ocrUnavailableText: {
    fontSize: 11,
    color: "#92400e",
    fontWeight: "600",
    marginLeft: 4,
  },
  filesContainer: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  filesHeader: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  filesScrollView: {
    maxHeight: 120,
  },
  fileCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 12,
    padding: 8,
    minWidth: 100,
    maxWidth: 120,
    position: "relative",
  },
  filePreview: {
    alignItems: "center",
    marginBottom: 6,
  },
  fileIconContainer: {
    backgroundColor: "#eff6ff",
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  fileIndex: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "500",
  },
  fileDetails: {
    alignItems: "center",
  },
  fileName: {
    fontSize: 11,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
    textAlign: "center",
  },
  fileSize: {
    fontSize: 10,
    color: "#9ca3af",
    textAlign: "center",
  },
  ocrValidatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  ocrValidatedText: {
    fontSize: 9,
    color: "#065f46",
    fontWeight: "600",
    marginLeft: 2,
  },
  removeFileButton: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  documentActions: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 8,
    flexWrap: "wrap",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563eb",
    minWidth: 100,
    justifyContent: "center",
  },
  uploadButtonText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0ea5e9",
    minWidth: 100,
    justifyContent: "center",
  },
  validatingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f59e0b",
    minWidth: 100,
    justifyContent: "center",
  },
  validatingText: {
    color: "#92400e",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  removeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
    minWidth: 110,
    justifyContent: "center",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10b981",
    minWidth: 110,
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
    color: "inherit",
  },
});

export default DocumentsSection;
