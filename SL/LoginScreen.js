import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert, Text } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./database/firebase";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("กรุณากรอกข้อมูล", "โปรดป้อนอีเมลและรหัสผ่าน");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Attempting to login with:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful:", userCredential.user.uid);
      
      // Navigate ไปหน้า MainTabs ทันทีหลังจาก login สำเร็จ
      navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
      
    } catch (error) {
      console.log("Login error:", error.code, error.message);
      
      if (error.code === "auth/invalid-email") {
        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "อีเมลไม่ถูกต้อง");
      } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "รหัสผ่านไม่ถูกต้อง");
      } else if (error.code === "auth/user-not-found") {
        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "ผู้ใช้งานไม่พบ");
      } else if (error.code === "auth/too-many-requests") {
        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "ลองเข้าสู่ระบบหลายครั้งเกินไป โปรดรอสักครู่");
      } else {
        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>เข้าสู่ระบบ</Text>
      
      <TextInput
        style={styles.input}
        placeholder="อีเมล"
        value={email}
        onChangeText={(text) => setEmail(text.trim())}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TextInput
        style={styles.input}
        placeholder="รหัสผ่าน"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <View style={styles.buttonContainer}>
        <Button 
          title={isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"} 
          onPress={handleLogin} 
          disabled={isLoading}
          color="#007AFF"
        />
      </View>

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
    padding: 20,
    backgroundColor: "#f0f2f5",
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 10,
  },
  signupText: {
    marginTop: 30,
    textAlign: 'center',
    color: "#666",
    fontSize: 16,
  },
  signupLink: {
    color: "#007AFF",
    fontWeight: 'bold',
  },
});

export default LoginScreen;
