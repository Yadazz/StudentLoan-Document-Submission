// components/SubmitSection.js - Updated for multiple files support
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SubmitSection = ({
  stats,
  isSubmitting,
  storageUploadProgress,
  onSubmit,
}) => {
  const canSubmit = 
    stats.uploadedRequired === stats.required && 
    Object.keys(storageUploadProgress).length === 0 && 
    !isSubmitting;

  const isUploading = Object.keys(storageUploadProgress).length > 0;

  const renderUploadProgress = () => {
    if (!isUploading) return null;

    const uploadingFiles = Object.keys(storageUploadProgress);
    
    return (
      <View style={styles.uploadProgressContainer}>
        <View style={styles.uploadProgressHeader}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.uploadProgressTitle}>
            กำลังอัปโหลดไฟล์... ({uploadingFiles.length} ไฟล์)
          </Text>
        </View>
        
        {uploadingFiles.map((fileKey) => (
          <View key={fileKey} style={styles.fileProgressItem}>
            <Text style={styles.fileProgressText} numberOfLines={1}>
              {fileKey}
            </Text>
            <View style={styles.fileProgressBar}>
              <View
                style={[
                  styles.fileProgressFill,
                  { width: `${storageUploadProgress[fileKey]}%` },
                ]}
              />
            </View>
            <Text style={styles.fileProgressPercent}>
              {storageUploadProgress[fileKey]}%
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSubmitButton = () => {
    if (isSubmitting) {
      return (
        <TouchableOpacity style={styles.submittingButton} disabled>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.submittingButtonText}>กำลังส่งเอกสาร...</Text>
        </TouchableOpacity>
      );
    }

    if (!canSubmit) {
      const missingDocs = stats.required - stats.uploadedRequired;
      return (
        <TouchableOpacity style={styles.disabledButton} disabled>
          <Ionicons name="document-text-outline" size={20} color="#9ca3af" />
          <Text style={styles.disabledButtonText}>
            {isUploading 
              ? "กำลังอัปโหลดไฟล์..." 
              : `ยังต้องอัปโหลด ${missingDocs} เอกสาร`
            }
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
        <Ionicons name="paper-plane" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>ส่งเอกสารทั้งหมด</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.submitSection}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>สรุปการอัปโหลด</Text>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="document-text" size={16} color="#10b981" />
              <Text style={styles.summaryLabel}>เอกสารจำเป็น:</Text>
              <Text style={styles.summaryValue}>
                {stats.uploadedRequired}/{stats.required}
              </Text>
            </View>
            {stats.totalFiles > 0 && (
              <View style={styles.summaryItem}>
                <Ionicons name="documents" size={16} color="#6366f1" />
                <Text style={styles.summaryLabel}>ไฟล์ทั้งหมด:</Text>
                <Text style={styles.summaryValue}>{stats.totalFiles}</Text>
              </View>
            )}
          </View>

          {stats.uploaded > stats.uploadedRequired && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="add-circle" size={16} color="#0ea5e9" />
                <Text style={styles.summaryLabel}>เอกสารเพิ่มเติม:</Text>
                <Text style={styles.summaryValue}>
                  {stats.uploaded - stats.uploadedRequired}
                </Text>
              </View>
            </View>
          )}
        </View>

        {canSubmit && (
          <View style={styles.readyIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.readyText}>พร้อมส่งเอกสารแล้ว!</Text>
          </View>
        )}
      </View>

      {renderUploadProgress()}
      
      <View style={styles.buttonContainer}>
        {renderSubmitButton()}
      </View>

      {canSubmit && (
        <Text style={styles.submitNote}>
          กดปุ่มด้านบนเพื่อส่งเอกสารทั้งหมดไปยังระบบ
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  submitSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
    textAlign: "center",
  },
  summaryStats: {
    marginBottom: 12,
  },
  summaryRow: {
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
  },
  readyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d1fae5",
    padding: 8,
    borderRadius: 8,
  },
  readyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065f46",
    marginLeft: 8,
  },
  uploadProgressContainer: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#0ea5e9",
  },
  uploadProgressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  uploadProgressTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0369a1",
    marginLeft: 8,
  },
  fileProgressItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  fileProgressText: {
    fontSize: 12,
    color: "#075985",
    flex: 1,
    marginRight: 8,
  },
  fileProgressBar: {
    flex: 2,
    height: 4,
    backgroundColor: "#e0f2fe",
    borderRadius: 2,
    marginRight: 8,
  },
  fileProgressFill: {
    height: "100%",
    backgroundColor: "#0ea5e9",
    borderRadius: 2,
  },
  fileProgressPercent: {
    fontSize: 11,
    color: "#075985",
    fontWeight: "500",
    minWidth: 30,
    textAlign: "right",
  },
  buttonContainer: {
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#10b981",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  submittingButton: {
    backgroundColor: "#6b7280",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  submittingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  disabledButtonText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  submitNote: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 16,
  },
});

export default SubmitSection;
