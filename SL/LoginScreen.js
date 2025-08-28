import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert, Text } from "react-native";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";  // นำเข้า getAuth และ signInWithEmailAndPassword แบบ modular
import { auth } from "./database/firebase"; // ใช้ auth ที่ตั้งค่าไว้ใน firebase.js

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ฟังก์ชันสำหรับการเข้าสู่ระบบ
  const handleLogin = async () => {
    if (!email || !password) {
      // ถ้าอีเมลหรือรหัสผ่านว่าง
      Alert.alert("กรุณากรอกข้อมูล", "โปรดป้อนอีเมลและรหัสผ่าน");
      return;
    }

    try {
      const authInstance = getAuth(); // ใช้ getAuth
      await signInWithEmailAndPassword(authInstance, email, password); // เข้าสู่ระบบด้วย email และ password
      // ถ้าเข้าสู่ระบบสำเร็จ, ไปยังหน้า HomeScreen หรือหน้าอื่น ๆ
      navigation.navigate("MainTabs");
    } catch (error) {
      // แสดงข้อความที่ถูกต้องสำหรับข้อผิดพลาด
      if (error.code === "auth/invalid-email") {
        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "อีเมลไม่ถูกต้อง");
      } else if (error.code === "auth/wrong-password") {
        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "รหัสผ่านไม่ถูกต้อง");
      } else if (error.code === "auth/user-not-found") {
        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "ผู้ใช้งานไม่พบ");
      } else {
        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="อีเมล"
        value={email}
        onChangeText={(text) => setEmail(text)}
        keyboardType="email-address"  // ทำให้แป้นพิมพ์สำหรับอีเมล
      />
      <TextInput
        style={styles.input}
        placeholder="รหัสผ่าน"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry  // ซ่อนข้อความรหัสผ่าน
      />
      <Button title="เข้าสู่ระบบ" onPress={handleLogin} />

      {/* ลิงค์สำหรับไปที่หน้าลงทะเบียน */}
      <Text style={styles.signupText}>
        ยังไม่มีบัญชี?{" "}
        <Text
          style={styles.signupLink}
          onPress={() => navigation.navigate("SignUpScreen")}
        >
          ลงทะเบียน
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f0f2f5",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 8,
  },
  signupText: {
    marginTop: 20,
    color: "#333",
  },
  signupLink: {
    color: "#1e90ff",
  },
});

export default LoginScreen;
