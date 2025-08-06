import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// Assuming you are using React Navigation
const UploadScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Card at the top */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ทำแบบสอบถามสถานภาพครอบครัว</Text>
        <Text style={styles.cardText}>
          กรุณากรอกข้อมูลสถานภาพครอบครัวของคุณเพื่อแนะนำเอกสารที่ต้องจัดเตรียมสำหรับการสมัครกู้ยืม
        </Text>

        {/* Button to navigate to DocRecScreen */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Document Reccomment")}
        >
          <Text style={styles.buttonText}>ทำแบบสอบถาม</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0f7fa", // Background color
  },
  card: {
    width: "90%",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00796b",
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: "#00796b",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#00796b",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default UploadScreen;
