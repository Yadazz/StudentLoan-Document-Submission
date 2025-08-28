import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { auth, db } from "../database/firebase"; // นำเข้า auth และ db จาก firebase.js
import { doc, getDoc } from "firebase/firestore"; // นำเข้า doc และ getDoc สำหรับ Firebase SDK v9+

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser; // ใช้ currentUser จาก auth

        if (currentUser) {
          // ดึงข้อมูลจาก Firestore โดยใช้ UID
          const userRef = doc(db, "users", currentUser.uid); // ใช้ doc แทน collection
          const docSnap = await getDoc(userRef); // ใช้ getDoc แทน get()

          if (docSnap.exists()) {
            setUserData(docSnap.data()); // ตั้งค่าข้อมูลผู้ใช้ใน state
          } else {
            console.log("No such user in Firestore!");
          }
        } else {
          console.log("No user is signed in");
          navigation.navigate("LoginScreen"); // หากไม่ได้ล็อกอิน ให้ไปที่หน้า Login
        }
      } catch (error) {
        console.error("Error getting user data:", error);
      } finally {
        setLoading(false); // การดึงข้อมูลเสร็จแล้ว
      }
    };

    fetchUserData();
  }, [navigation]); // ใช้ dependency array เพื่อหลีกเลี่ยงการเรียกซ้ำไม่จำเป็น

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1e90ff" />
      </View>
    );
  }

  if (!userData) {
    return <Text style={styles.errorText}>ข้อมูลผู้ใช้ไม่พบ</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.profileTitle}>ข้อมูลโปรไฟล์</Text>
      <Text style={styles.profileItem}>ชื่อ: {userData.name}</Text>
      <Text style={styles.profileItem}>อีเมล: {userData.email}</Text>
      {/* สามารถเพิ่มข้อมูลอื่นๆ ที่เก็บใน Firestore */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f2f5",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  profileItem: {
    fontSize: 18,
    color: "#555",
    marginVertical: 5,
  },
});

export default ProfileScreen;
