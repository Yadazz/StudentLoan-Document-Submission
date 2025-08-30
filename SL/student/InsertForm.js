import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, Button, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { db, storage } from "../database/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
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

  // ข้อมูลที่อยู่ปัจจุบัน (address_current)
  if (userData.address_current) {
    firstPage.drawText(userData.address_current.house_no || "-", { x: 194.4, y: 396, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.village || "-", { x: 249.84, y: 396, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.soi || "-", { x: 459.36, y: 396, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.road || "-", { x: 330.48, y: 626.56, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.sub_district || "-", { x: 502.56, y: 626.56, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.district || "-", { x: 122.4, y: 606.72, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.province || "-", { x: 238.32, y: 606.72, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.zipcode || "-", { x: 388.8, y: 606.72, size: 12, font: customFont });
  }

  // ข้อมูลที่อยู่ตามทะเบียนบ้าน (address_perm) - สามารถเพิ่มได้ตามต้องการ
  // if (userData.address_perm) {
  //   // เพิ่มตำแหน่งสำหรับที่อยู่ตามทะเบียนบ้าน
  // }

  return pdfDoc.save();
}

// ===== InsertForm Component =====
const InsertForm = () => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันเพิ่มข้อมูลส่วนตัว
  const addPersonalData = async (newData) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, newData);
      
      // อัพเดต state
      setUserData(prev => ({ ...prev, ...newData }));
      Alert.alert("สำเร็จ", "เพิ่มข้อมูลเรียบร้อยแล้ว");
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", error.message);
    }
  };

  // ฟังก์ชันเพิ่มข้อมูลที่อยู่
  const addAddressData = async (addressType, newAddressData) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userRef = doc(db, "users", currentUser.uid);
      const updateData = {
        [addressType]: newAddressData
      };
      
      await updateDoc(userRef, updateData);
      
      // อัพเดต state
      setUserData(prev => ({ ...prev, [addressType]: newAddressData }));
      Alert.alert("สำเร็จ", "เพิ่มข้อมูลที่อยู่เรียบร้อยแล้ว");
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", error.message);
    }
  };

  // ฟังก์ชันเพิ่มข้อมูลใหม่ (ตัวอย่าง)
  const handleAddSampleData = () => {
    Alert.alert(
      "เพิ่มข้อมูล",
      "เลือกประเภทข้อมูลที่ต้องการเพิ่ม",
      [
        {
          text: "ข้อมูลส่วนตัว",
          onPress: () => {
            // ตัวอย่างเพิ่มข้อมูลส่วนตัว
            addPersonalData({
              nickname: "แก้ว",
              birthdate: "01/01/2000",
              student_id: "650001234"
            });
          }
        },
        {
          text: "ที่อยู่ปัจจุบัน", 
          onPress: () => {
            // ตัวอย่างเพิ่มข้อมูลที่อยู่
            addAddressData("address_current", {
              district: "เมือง",
              house_no: "123",
              moo: "5",
              province: "กรุงเทพฯ",
              road: "สุขุมวิท",
              soi: "อโศก",
              sub_district: "คลองเตย",
              village: "บ้านสวย",
              zipcode: "10110"
            });
          }
        },
        {
          text: "ที่อยู่ตามทะเบียนบ้าน",
          onPress: () => {
            addAddressData("address_perm", {
              district: "เมือง", 
              house_no: "456",
              province: "ชลบุรี",
              sub_district: "บางละมุง",
              zipcode: "20150"
            });
          }
        },
        { text: "ยกเลิก", style: "cancel" }
      ]
    );
  };

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

        // ดึงข้อมูลผู้ใช้หลัก (รวมข้อมูลที่อยู่ที่เป็น map)
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        let data = {};
        
        if (userSnap.exists()) {
          const userInfo = userSnap.data();
          data = {
            // ข้อมูลส่วนตัวหลัก
            name: userInfo.name,
            email: userInfo.email,
            phone_num: userInfo.phone_num,
            idCard: userInfo.idCard,
            student_id: userInfo.student_id,
            major: userInfo.major,
            school: userInfo.school,
            siblings_count: userInfo.siblings_count,
            
            // วันที่ (แปลง timestamp เป็น string)
            birth_date: userInfo.birth_date ? userInfo.birth_date.toDate().toLocaleDateString('th-TH') : null,
            createdAt: userInfo.createdAt ? userInfo.createdAt.toDate().toLocaleDateString('th-TH') : null,
            
            // ข้อมูลที่อยู่ (map type)
            address_current: userInfo.address_current || null,
            address_perm: userInfo.address_perm || null,
            
            // ข้อมูลพ่อแม่ (map type)
            father_info: userInfo.father_info || null,
            mother_info: userInfo.mother_info || null
          };
        }

        setUserData(data);
        console.log("ข้อมูลที่ดึงได้:", data);
        
      } catch (error) {
        console.error("Error fetching data:", error);
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

  // ฟังก์ชันแสดงข้อมูลที่อยู่แบบเป็นระเบียบ
  const renderAddressData = (addressData, title) => {
    if (!addressData) return null;
    
    return (
      <View style={styles.addressSection}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {Object.entries(addressData).map(([key, value]) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{getFieldLabel(key)}</Text>
            <Text style={styles.value}>{value || "-"}</Text>
          </View>
        ))}
      </View>
    );
  };

  // ฟังก์ชันแสดงข้อมูลพ่อแม่
  const renderParentData = (parentData, title) => {
    if (!parentData) return null;
    
    return (
      <View style={styles.parentSection}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {Object.entries(parentData).map(([key, value]) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{getFieldLabel(key)}</Text>
            <Text style={styles.value}>{value || "-"}</Text>
          </View>
        ))}
      </View>
    );
  };

  // ฟังก์ชันแปลงชื่อ field เป็นภาษาไทย
  const getFieldLabel = (key) => {
    const labels = {
      // ข้อมูลส่วนตัว
      name: "ชื่อ-นามสกุล",
      email: "อีเมล",
      phone_num: "เบอร์โทร",
      idCard: "เลขบัตรประชาชน", 
      student_id: "รหัสนักศึกษา",
      major: "สาขาวิชา",
      school: "คณะ/สำนัก",
      siblings_count: "จำนวนพี่น้อง",
      birth_date: "วันเกิด",
      createdAt: "วันที่สร้างบัญชี",
      
      // ที่อยู่
      house_no: "บ้านเลขที่",
      moo: "หมู่ที่",
      village: "หมู่บ้าน",
      soi: "ซอย",
      road: "ถนน", 
      sub_district: "ตำบล/แขวง",
      district: "อำเภอ/เขต",
      province: "จังหวัด",
      zipcode: "รหัสไปรษณีย์",
      
      // ข้อมูลพ่อแม่
      citizen_id: "เลขบัตรประชาชน",
      education_level: "ระดับการศึกษา",
      phone_number: "เบอร์โทร"
    };
    return labels[key] || key;
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
      
      {/* ข้อมูลส่วนตัว */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ข้อมูลส่วนตัว</Text>
        <View style={styles.field}>
          <Text style={styles.label}>ชื่อ-นามสกุล</Text>
          <Text style={styles.value}>{userData.name || "-"}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>อีเมล</Text>
          <Text style={styles.value}>{userData.email || "-"}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>เบอร์โทร</Text>
          <Text style={styles.value}>{userData.phone_num || "-"}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>เลขบัตรประชาชน</Text>
          <Text style={styles.value}>{userData.idCard || "-"}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>รหัสนักศึกษา</Text>
          <Text style={styles.value}>{userData.student_id || "-"}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>สาขาวิชา</Text>
          <Text style={styles.value}>{userData.major || "-"}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>คณะ/สำนัก</Text>
          <Text style={styles.value}>{userData.school || "-"}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>วันเกิด</Text>
          <Text style={styles.value}>{userData.birth_date || "-"}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>จำนวนพี่น้อง</Text>
          <Text style={styles.value}>{userData.siblings_count || "-"}</Text>
        </View>
      </View>

      {/* ข้อมูลที่อยู่ */}
      {userData.address_current && renderAddressData(userData.address_current, "ที่อยู่ปัจจุบัน")}
      {userData.address_perm && renderAddressData(userData.address_perm, "ที่อยู่ตามทะเบียนบ้าน")}
      
      {/* ข้อมูลพ่อแม่ */}
      {userData.father_info && renderParentData(userData.father_info, "ข้อมูลบิดา")}
      {userData.mother_info && renderParentData(userData.mother_info, "ข้อมูลมารดา")}
      
      {/* แสดงที่อยู่อื่นๆ ถ้ามี */}
      {Object.entries(userData)
        .filter(([key]) => key.startsWith('address_') && key !== 'address_current' && key !== 'address_perm')
        .map(([key, value]) => renderAddressData(value, `ที่อยู่ (${key})`))
      }

      <Button title="บันทึกลง PDF" onPress={handlePdf} />
      
      <View style={{ marginTop: 20 }}>
        <Button 
          title="เพิ่มข้อมูลตัวอย่าง" 
          onPress={handleAddSampleData}
          color="#28a745"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 20,
    paddingBottom: 40 
  },
  title: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 20,
    textAlign: "center"
  },
  section: {
    marginBottom: 25,
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333"
  },
  addressSection: {
    marginBottom: 25,
    backgroundColor: "#e8f4fd",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3"
  },
  parentSection: {
    marginBottom: 25,
    backgroundColor: "#f0f8e8",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50"
  },
  field: { 
    marginBottom: 10 
  },
  label: { 
    fontWeight: "bold", 
    marginBottom: 5,
    color: "#555"
  },
  value: { 
    borderWidth: 1, 
    borderColor: "#ddd", 
    borderRadius: 8, 
    padding: 12, 
    backgroundColor: "#fff",
    minHeight: 40
  },
});

export default InsertForm;
