// components/ProgressCard.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ProgressCard = ({ stats }) => {
  return (
    <View style={styles.progressCard}>
      <Text style={styles.progressTitle}>สถานะการอัปโหลด</Text>
      <View style={styles.statusGrid}>
        <View style={styles.statusItem}>
          <Text style={[styles.statusNumber, { color: "#10b981" }]}>
            {stats.uploadedRequired}
          </Text>
          <Text style={styles.statusLabel}>อัปโหลดแล้ว</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.statusNumber, { color: "#f59e0b" }]}>
            {stats.required - stats.uploadedRequired}
          </Text>
          <Text style={styles.statusLabel}>คงเหลือ</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.statusNumber, { color: "#2563eb" }]}>
            {stats.required}
          </Text>
          <Text style={styles.statusLabel}>จำเป็นทั้งหมด</Text>
        </View>
      </View>

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
        <Text style={styles.progressText}>
          {Math.round((stats.uploadedRequired / stats.required) * 100)}%
          เสร็จสิ้น
        </Text>
      </View>
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
    marginBottom: 20,
  },
  statusItem: {
    alignItems: "center",
  },
  statusNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  progressBarContainer: {
    alignItems: "center",
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
  progressText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
});

export default ProgressCard;
