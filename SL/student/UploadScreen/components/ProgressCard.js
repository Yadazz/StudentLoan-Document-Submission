// components/ProgressCard.js - Updated for multiple files support
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ProgressCard = ({ stats }) => {
  return (
    <View style={styles.progressCard}>
      <Text style={styles.progressTitle}>สถานะการอัปโหลด</Text>
      
      {/* Document Progress */}
      <View style={styles.statusGrid}>
        <View style={styles.statusItem}>
          <Text style={[styles.statusNumber, { color: "#10b981" }]}>
            {stats.uploadedRequired}
          </Text>
          <Text style={styles.statusLabel}>เอกสารอัปโหลดแล้ว</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.statusNumber, { color: "#f59e0b" }]}>
            {stats.required - stats.uploadedRequired}
          </Text>
          <Text style={styles.statusLabel}>เอกสารคงเหลือ</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.statusNumber, { color: "#2563eb" }]}>
            {stats.required}
          </Text>
          <Text style={styles.statusLabel}>จำเป็นทั้งหมด</Text>
        </View>
      </View>

      {/* Files Counter */}
      {stats.totalFiles > 0 && (
        <View style={styles.filesCounter}>
          <View style={styles.filesCounterHeader}>
            <Ionicons name="documents" size={16} color="#6366f1" />
            <Text style={styles.filesCounterTitle}>จำนวนไฟล์ทั้งหมด</Text>
          </View>
          <Text style={styles.filesCounterNumber}>
            {stats.totalFiles} ไฟล์
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(stats.uploadedRequired / stats.required) * 100}%`,
              },
            ]}
          />
        </View>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>
            {Math.round((stats.uploadedRequired / stats.required) * 100)}%
            เสร็จสิ้น
          </Text>
          {stats.uploadedRequired === stats.required && (
            <View style={styles.completeIndicator}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.completeText}>ครบถ้วน</Text>
            </View>
          )}
        </View>
      </View>

      {/* Additional Stats */}
      {stats.uploaded > stats.uploadedRequired && (
        <View style={styles.additionalStats}>
          <Text style={styles.additionalStatsText}>
            + {stats.uploaded - stats.uploadedRequired} เอกสารเพิ่มเติม
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1e293b",
    textAlign: "center",
  },
  statusGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statusItem: {
    alignItems: "center",
    flex: 1,
  },
  statusNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 14,
  },
  filesCounter: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filesCounterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  filesCounterTitle: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "500",
    marginLeft: 4,
  },
  filesCounterNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6366f1",
    textAlign: "center",
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  progressTextContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  completeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeText: {
    fontSize: 12,
    color: "#065f46",
    fontWeight: "600",
    marginLeft: 4,
  },
  additionalStats: {
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  additionalStatsText: {
    fontSize: 12,
    color: "#0ea5e9",
    fontWeight: "500",
  },
});

export default ProgressCard;
