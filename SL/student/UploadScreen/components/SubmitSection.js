// components/SubmitSection.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SubmitSection = ({
  stats,
  isSubmitting,
  storageUploadProgress,
  onSubmit,
}) => {
  return (
    <View style={styles.submitSection}>
      <TouchableOpacity
        style={[
          styles.submitButton,
          (stats.uploadedRequired < stats.required || isSubmitting) &&
            styles.submitButtonDisabled,
        ]}
        onPress={onSubmit}
        disabled={stats.uploadedRequired < stats.required || isSubmitting}
      >
        {isSubmitting ? (
          <View style={styles.submitButtonLoading}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
              {Object.keys(storageUploadProgress).length > 0
                ? `กำลังอัปโหลด... (${
                    Object.keys(storageUploadProgress).length
                  } ไฟล์)`
                : "กำลังส่งเอกสาร..."}
            </Text>
          </View>
        ) : (
          <View style={styles.submitButtonContent}>
            <Ionicons name="send-outline" size={20} color="#ffffff" />
            <Text style={styles.submitButtonText}>
              {stats.uploadedRequired >= stats.required
                ? "ส่งเอกสาร"
                : `ส่งเอกสาร (${stats.uploadedRequired}/${stats.required})`}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  submitSection: {
    marginBottom: 30,
  },
  submitButton: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: "#a7f3d0",
    shadowOpacity: 0.1,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  submitButtonLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SubmitSection;
