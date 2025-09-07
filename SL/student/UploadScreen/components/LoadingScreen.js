// components/LoadingScreen.js
import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const LoadingScreen = () => {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.headerIcon}>
        <Ionicons name="cloud-upload" size={32} color="#2563eb" />
      </View>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 32,
  },
  headerIcon: {
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 50,
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
});

export default LoadingScreen;
