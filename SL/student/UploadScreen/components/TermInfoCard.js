// components/TermInfoCard.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TermInfoCard = ({ appConfig }) => {
  return (
    <View style={styles.termInfoCard}>
      <View style={styles.termInfoHeader}>
        <Ionicons name="calendar-outline" size={20} color="#2563eb" />
        <Text style={styles.termInfoTitle}>ข้อมูลการส่งเอกสาร</Text>
      </View>
      <Text style={styles.termInfoText}>
        ปีการศึกษา {appConfig.academicYear} • เทอม {appConfig.term}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  termInfoCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  termInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  termInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  termInfoText: {
    fontSize: 14,
    color: "#64748b",
  },
});

export default TermInfoCard;
