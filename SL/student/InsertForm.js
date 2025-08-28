import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, Button, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { db, storage } from "../database/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { ref, getDownloadURL } from "firebase/storage";
import { Buffer } from "buffer";

// ===== PDF Helper =====
let PDFDocument, rgb, fontkit;
if (Platform.OS !== "web") {
  const pdfLib = require("pdf-lib");
  PDFDocument = pdfLib.PDFDocument;
  rgb = pdfLib.rgb;
  fontkit = require("@pdf-lib/fontkit");
}

// ฟังก์ชันสร้าง PDF
async function fillPdf(userData, existingPdfBytes, fontBytes) {
  if (Platform.OS === "web") {
    Alert.alert("ไม่รองรับ Web", "การสร้าง PDF บน Web ยังไม่รองรับ");
    return null;
  }

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);
  const customFont = await pdfDoc.embedFont(fontBytes);
  const firstPage = pdfDoc.getPages()[0];

  // ข้อมูลส่วนตัว
  firstPage.drawText(userData.name || "-", { x: 95.76, y: 624.24, size: 12, font: customFont });
  firstPage.drawText(userData.email || "-", { x: 408.96, y: 679, size: 12, font: customFont });
  firstPage.drawText(userData.phone_num || "-", { x: 293.76, y: 556.56, size: 12, font: customFont });

  // //ข้อมูลที่อยู่
  // firstPage.drawText(userData.house_no || "-", { x: 194.4, y: 396, size: 12, font: customFont });
  // firstPage.drawText(userData.villageNo || "-", { x: 249.84, y: 396, size: 12, font: customFont });
  // firstPage.drawText(userData.alley || "-", { x: 459.36, y: 396, size: 12, font: customFont });
  // firstPage.drawText(userData.road || "-", { x: 330.48, y: 626.56, size: 12, font: customFont });
  // firstPage.drawText(userData.sub_district || "-", { x: 502.56, y: 626.56, size: 12, font: customFont });
  // firstPage.drawText(userData.district || "-", { x: 122.4, y: 606.72, size: 12, font: customFont });
  // firstPage.drawText(userData.province || "-", { x: 238.32, y: 606.72, size: 12, font: customFont });
  // firstPage.drawText(userData.postcode || "-", { x: 388.8, y: 606.72, size: 12, font: customFont });

  return pdfDoc.save();
}

// ===== InsertForm Component =====
const InsertForm = () => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchData = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("กรุณาเข้าสู่ระบบก่อน");
        setLoading(false);
        return;
      }

      // ดึงข้อมูลทั่วไป
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      let data = {};
      if (userSnap.exists()) {
        const u = userSnap.data();
        data.name = u.name;
        data.email = u.email;
        data.phone_num = u.phone_num;
      }

      // ดึงข้อมูล address
      const addressDocId = "fQpWS2TRoyCSEWYiA6kD"; // เปลี่ยนเป็น doc ที่ต้องการ
      const addressRef = doc(db, "users", currentUser.uid, "address", addressDocId);
      const addressSnap = await getDoc(addressRef);
      if (addressSnap.exists()) {
        data = { ...data, ...addressSnap.data() };
      }

      setUserData(data);
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", error.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

  const handlePdf = async () => {
    if (Platform.OS === "web") {
      Alert.alert("ไม่รองรับ Web");
      return;
    }

    try {
      const pdfRef = ref(storage, "กยศ101.pdf");
      const pdfUrl = await getDownloadURL(pdfRef);
      const existingPdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());

      const fontRef = ref(storage, "assets/fonts/Sarabun-Thin.ttf");
      const fontUrl = await getDownloadURL(fontRef);
      const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());

      const pdfBytes = await fillPdf(userData, existingPdfBytes, fontBytes);
      if (!pdfBytes) return;

      const base64Pdf = Buffer.from(pdfBytes).toString("base64");
      const filePath = FileSystem.documentDirectory + "filled-kyc102.pdf";
      await FileSystem.writeAsStringAsync(filePath, base64Pdf, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(filePath);

      Alert.alert("สำเร็จ", "สร้าง PDF เรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error filling PDF:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถสร้าง PDF ได้");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ข้อมูลผู้ใช้และที่อยู่</Text>
      {Object.entries(userData).map(([key, value]) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{key}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
      <Button title="บันทึกลง PDF" onPress={handlePdf} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  field: { marginBottom: 15 },
  label: { fontWeight: "bold", marginBottom: 5 },
  value: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "#f9f9f9" },
});

export default InsertForm;
