import { Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { ref, getDownloadURL } from "firebase/storage";
import { Buffer } from "buffer";
import { db, storage } from "../../database/firebase";

// ===== PDF Helper =====
let PDFDocument, rgb, fontkit;
if (Platform.OS !== "web") {
  const pdfLib = require("pdf-lib");
  PDFDocument = pdfLib.PDFDocument;
  rgb = pdfLib.rgb;
  fontkit = require("@pdf-lib/fontkit");
}

// ฟังก์ชันสร้าง PDF (แยกออกมาเพื่อให้โค้ดหลักสะอาดขึ้น)
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
  firstPage.drawText(userData.name || "-", { x: 100.08, y: 614.88, size: 12, font: customFont });
  firstPage.drawText(userData.email || "-", { x: 411.12, y: 555.84, size: 12, font: customFont });
  firstPage.drawText(userData.phone_num || "-", { x: 285.12, y: 555.84, size: 12, font: customFont });

  // ข้อมูลที่อยู่ปัจจุบัน (address_current)
  if (userData.address_current) {
    firstPage.drawText(userData.address_current.house_no || "-", { x: 201.6, y: 400.32, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.moo || "-", { x: 246.96, y: 400.32, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.village || "-", { x: 324.72, y: 400.32, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.soi || "-", { x: 459.36, y: 396, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.road || "-", { x: 113.76, y: 378, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.sub_district || "-", { x: 228.24, y: 378, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.district || "-", { x: 328.64, y: 378, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.province || "-", { x: 444.96, y: 378, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.zipcode || "-", { x: 119.52, y: 360, size: 12, font: customFont });
  }

  // ข้อมูลที่อยู่ตามทะเบียนบ้าน (address_perm)
  if (userData.address_perm) {
    firstPage.drawText(userData.address_perm.house_no || "-", { x: 156.24, y: 343.44, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.moo || "-", { x: 208.8, y: 343.44, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.village || "-", { x: 285.12, y: 343.44, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.soi || "-", { x: 459.36, y: 316, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.road || "-", { x: 113.76, y: 298, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.sub_district || "-", { x: 228.24, y: 298, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.district || "-", { x: 328.64, y: 298, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.province || "-", { x: 444.96, y: 298, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.zipcode || "-", { x: 119.52, y: 280, size: 12, font: customFont });
  }
  // เพิ่มข้อมูลอื่นๆ ที่ต้องการ เช่น ข้อมูลพ่อแม่
  // ...

  return pdfDoc.save();
}

// ===== ฟังก์ชันรวมทั้งหมดสำหรับ กยศ.101 =====
export const InsertForm101 = async () => {
  if (Platform.OS === "web") {
    Alert.alert("ไม่รองรับ Web", "การสร้าง PDF บน Web ยังไม่รองรับ");
    return;
  }

  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    // 1. ดึงข้อมูลผู้ใช้จาก Firestore
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    let userData = {};

    if (userSnap.exists()) {
      const userInfo = userSnap.data();
      userData = {
        name: userInfo.name,
        email: userInfo.email,
        phone_num: userInfo.phone_num,
        address_current: userInfo.address_current || null,
        address_perm: userInfo.address_perm || null,
        // เพิ่มข้อมูลอื่น ๆ ที่ต้องการ
      };
    } else {
      Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้ในฐานข้อมูล");
      return;
    }

    // 2. ดาวน์โหลดไฟล์ต้นฉบับ PDF และฟอนต์จาก Firebase Storage
    const pdfRef = ref(storage, "กยศ101.pdf");
    const pdfUrl = await getDownloadURL(pdfRef);
    const existingPdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());

    const fontRef = ref(storage, "assets/fonts/Sarabun-Thin.ttf");
    const fontUrl = await getDownloadURL(fontRef);
    const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());

    // 3. เรียกใช้ฟังก์ชัน fillPdf เพื่อกรอกข้อมูล
    const pdfBytes = await fillPdf(userData, existingPdfBytes, fontBytes);
    if (!pdfBytes) {
      return;
    }

    // 4. บันทึกและแชร์ไฟล์
    const localFileName = "แบบฟอร์ม_กยศ_101.pdf";
    const filePath = `${FileSystem.documentDirectory}${localFileName}`;
    const base64Pdf = Buffer.from(pdfBytes).toString("base64");
    
    await FileSystem.writeAsStringAsync(filePath, base64Pdf, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    await Sharing.shareAsync(filePath);
    
    Alert.alert("สร้างสำเร็จ", `สร้างไฟล์ ${localFileName} เรียบร้อยแล้ว`);

  } catch (error) {
    console.error("Error generating filled PDF:", error);
    Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถสร้างเอกสารได้");
  }
};