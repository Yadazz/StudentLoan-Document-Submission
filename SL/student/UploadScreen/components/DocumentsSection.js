// components/DocumentsSection.js - Updated with bottom action buttons
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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

    if (uploads[doc.id]) {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => onShowFileModal(doc.id, doc.title)}
          >
            <Ionicons name="eye-outline" size={16} color="#2563eb" />
            <Text style={styles.buttonText}>ดูไฟล์</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemoveFile(doc.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.buttonText}>ลบไฟล์</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => onFileUpload(doc.id)}
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

  const renderDocumentStatusBadge = (doc) => {
    const upload = uploads[doc.id];

    if (!upload) return null;

    // OCR validation badge for Form 101
    if (doc.id === "form_101" && upload.ocrValidated) {
      return (
        <View style={styles.ocrValidatedBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#10b981" />
          <Text style={styles.ocrValidatedText}>ตรวจสอบแล้ว</Text>
        </View>
      );
    }

    // OCR backend unavailable warning
    if (doc.id === "form_101" && !ocrBackendAvailable) {
      return (
        <View style={styles.ocrUnavailableBadge}>
          <Ionicons name="warning-outline" size={12} color="#f59e0b" />
          <Text style={styles.ocrUnavailableText}>ไม่ได้ตรวจสอบ OCR</Text>
        </View>
      );
    }

    return null;
  };

  const getDocumentCardStyle = (doc) => {
    const baseStyle = [styles.documentCard];

    if (uploads[doc.id]) {
      baseStyle.push({ borderLeftColor: "#10b981" }); // Green for uploaded
    } else if (doc.required) {
      baseStyle.push({ borderLeftColor: "#ef4444" }); // Red for required
    } else {
      baseStyle.push({ borderLeftColor: "#e2e8f0" }); // Default gray
    }

    return baseStyle;
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
                    uploads[doc.id]
                      ? "checkmark-circle"
                      : doc.required
                      ? "document-text-outline"
                      : "document-outline"
                  }
                  size={24}
                  color={
                    uploads[doc.id]
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

                {uploads[doc.id] && (
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>
                      {uploads[doc.id].filename}
                    </Text>
                    <Text style={styles.fileSize}>
                      {formatFileSize(uploads[doc.id].size)} •{" "}
                      {uploads[doc.id].uploadDate}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Action buttons moved to bottom */}
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
    marginBottom: 16,
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
  ocrValidatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  ocrValidatedText: {
    fontSize: 11,
    color: "#065f46",
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
  fileInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: "#9ca3af",
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
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563eb",
    minWidth: 90,
    justifyContent: "center",
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
    minWidth: 90,
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
