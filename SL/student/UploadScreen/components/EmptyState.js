// components/EmptyState.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const EmptyState = ({ onStartSurvey }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.emptyState}>
        <View style={styles.headerIcon}>
          <Ionicons name="document-outline" size={48} color="#9ca3af" />
        </View>
        <Text style={styles.emptyStateTitle}>ยังไม่มีข้อมูลแบบสอบถาม</Text>
        <Text style={styles.emptyStateText}>
          กรุณาทำแบบสอบถามก่อนอัปโหลดเอกสาร
        </Text>
        <TouchableOpacity
          style={styles.startSurveyButton}
          onPress={onStartSurvey}
        >
          <Ionicons name="play-outline" size={20} color="#ffffff" />
          <Text style={styles.startSurveyButtonText}>เริ่มทำแบบสอบถาม</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  headerIcon: {
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 50,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  startSurveyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#2563eb",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  startSurveyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default EmptyState;
