import React from "react";
import { View, Text, StyleSheet } from "react-native";

const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>หน้าตั้งค่า</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff3e0", // สีพื้นหลังที่แตกต่างกัน
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e65100",
  },
});

export default SettingsScreen;