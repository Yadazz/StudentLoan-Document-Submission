import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, Alert } from "react-native";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";  // นำเข้า getAuth และ createUserWithEmailAndPasswordจาก firebase/auth
import { getFirestore, doc, setDoc } from "firebase/firestore"; // นำเข้า getFirestore และ setDoc
import { auth, db } from "./database/firebase";  // ใช้ auth และ db ที่ตั้งค่าไว้ใน firebase.js

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // สำหรับชื่อผู้ใช้
  const [idCard, setIdCard] = useState(""); // สำหรับเลขบัตรประชาชน

  // ฟังก์ชันสำหรับการสมัครสมาชิก
  const handleSignUp = async () => {
    if (!email || !password || !name || !idCard) {
      Alert.alert("กรุณากรอกข้อมูล", "โปรดป้อนอีเมล, รหัสผ่าน, ชื่อ และ เลขบัตรประชาชน");
      return;
    }

    try {
      const authInstance = getAuth(); // ใช้ getAuth เพื่อดึงค่า auth
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password); // การสมัครสมาชิกด้วย email และ password
      const user = userCredential.user;

      // เพิ่มข้อมูลโปรไฟล์ใน Firestore โดยใช้ UID (เลขบัตรประชาชน)
      await setDoc(doc(db, "users", user.uid), {
        idCard: idCard,
        name: name,
        email: email,
        createdAt: new Date(),
      });

      // ถ้าการสมัครสมาชิกสำเร็จ, ไปยังหน้า HomeScreen หรือหน้าอื่น ๆ
      navigation.navigate("HomeScreen");
    } catch (error) {
      // แสดงข้อความที่ถูกต้องสำหรับข้อผิดพลาด
      if (error.code === "auth/invalid-email") {
        Alert.alert("การสมัครสมาชิกไม่สำเร็จ", "อีเมลไม่ถูกต้อง");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("การสมัครสมาชิกไม่สำเร็จ", "รหัสผ่านอ่อนเกินไป");
      } else if (error.code === "auth/email-already-in-use") {
        Alert.alert("การสมัครสมาชิกไม่สำเร็จ", "อีเมลนี้ถูกใช้แล้ว");
      } else {
        Alert.alert("การสมัครสมาชิกไม่สำเร็จ", error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ลงทะเบียน</Text>

      <Text style={styles.title}>ข้อมูลส่วนตัว</Text>
      {/* ช่องกรอกเลขบัตรประชาชน */}
      <TextInput
        style={styles.input}
        placeholder="เลขบัตรประชาชน"
        value={idCard}
        onChangeText={(text) => setIdCard(text)}
        keyboardType="numeric"  // ให้แป้นพิมพ์แสดงตัวเลข
      />

      {/* ช่องกรอกชื่อผู้ใช้ */}
      <TextInput
        style={styles.input}
        placeholder="ชื่อ"
        value={name}
        onChangeText={(text) => setName(text)}
      />

      {/* ช่องกรอกอีเมล */}
      <TextInput
        style={styles.input}
        placeholder="อีเมล"
        value={email}
        onChangeText={(text) => setEmail(text)}
        keyboardType="email-address"
      />

      {/* ช่องกรอกรหัสผ่าน */}
      <TextInput
        style={styles.input}
        placeholder="รหัสผ่าน"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
      />

      {/* ปุ่มลงทะเบียน */}
      <Button title="ลงทะเบียน" onPress={handleSignUp} />

      {/* ลิงค์สำหรับไปที่หน้าล็อกอิน */}
      <Text style={styles.loginText}>
        มีบัญชีแล้ว?{" "}
        <Text
          style={styles.loginLink}
          onPress={() => navigation.navigate("LoginScreen")}
        >
          เข้าสู่ระบบ
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f0f2f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  loginText: {
    marginTop: 20,
    color: "#333",
  },
  loginLink: {
    color: "#1e90ff",
  },
});

export default SignUpScreen;
