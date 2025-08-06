import React from "react";
import { View, Text, StyleSheet } from "react-native";

const UploadScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>หน้าส่งเอกสาร</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0f7fa", // สีพื้นหลังที่แตกต่างกัน
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00796b",
  },
});

export default UploadScreen;
