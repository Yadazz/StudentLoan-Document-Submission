// components/StorageProgressCard.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const StorageProgressCard = ({ storageUploadProgress, uploads }) => {
  return (
    <View style={styles.storageProgressCard}>
      <View style={styles.cardHeader}>
        <Ionicons name="cloud-upload-outline" size={20} color="#8b5cf6" />
        <Text style={styles.cardTitle}>กำลังอัปโหลดไฟล์...</Text>
      </View>
      {Object.entries(storageUploadProgress).map(([docId, progress]) => (
        <View key={docId} style={styles.storageProgressItem}>
          <Text style={styles.storageProgressLabel}>
            {uploads[docId]?.filename || docId}
          </Text>
          <View style={styles.storageProgressBar}>
            <View
              style={[styles.storageProgressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.storageProgressText}>{progress}%</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  storageProgressCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  storageProgressItem: {
    marginBottom: 12,
  },
  storageProgressLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  storageProgressBar: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  storageProgressFill: {
    height: "100%",
    backgroundColor: "#8b5cf6",
    borderRadius: 3,
  },
  storageProgressText: {
    fontSize: 12,
    color: "#8b5cf6",
    textAlign: "right",
    fontWeight: "600",
  },
});

export default StorageProgressCard;
