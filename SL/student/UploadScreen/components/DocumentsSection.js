// components/DocumentsSection.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DocumentsSection = ({
  documents,
  uploads,
  onFileUpload,
  onRemoveFile,
  onShowFileModal,
  onDownloadDocument,
  formatFileSize,
}) => {
  const renderDocumentActions = (doc) => {
    if (uploads[doc.id]) {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => onShowFileModal(doc.id, doc.title)}
          >
            <Ionicons name="eye-outline" size={16} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemoveFile(doc.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
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
            </TouchableOpacity>
          )}
        </View>
      );
    }
  };

  return (
    <View style={styles.documentsSection}>
      <Text style={styles.sectionTitle}>รายการเอกสาร</Text>
      {documents.map((doc, index) => (
        <View key={doc.id} style={styles.documentCard}>
          <View style={styles.documentHeader}>
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
                <Text style={styles.documentTitle} numberOfLines={2}>
                  {doc.title}
                  {doc.required && <Text style={styles.requiredMark}> *</Text>}
                </Text>
                {doc.description && (
                  <Text style={styles.documentDescription} numberOfLines={2}>
                    {doc.description}
                  </Text>
                )}
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

            <View style={styles.documentActions}>
              {renderDocumentActions(doc)}
            </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1e293b",
  },
  documentCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderLeftWidth: 4,
    borderLeftColor: "#e2e8f0",
  },
  documentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  documentInfo: {
    flexDirection: "row",
    flex: 1,
    alignItems: "flex-start",
  },
  documentIcon: {
    marginRight: 12,
    paddingTop: 2,
  },
  documentDetails: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 4,
  },
  requiredMark: {
    color: "#ef4444",
    fontWeight: "bold",
  },
  documentDescription: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 8,
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
    alignItems: "flex-end",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
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
  },
  uploadButtonText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  viewButton: {
    backgroundColor: "#eff6ff",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  removeButton: {
    backgroundColor: "#fef2f2",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  downloadButton: {
    backgroundColor: "#f0fdf4",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10b981",
  },
});

export default DocumentsSection;
