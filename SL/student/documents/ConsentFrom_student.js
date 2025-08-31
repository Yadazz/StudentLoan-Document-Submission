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

// ฟังก์ชันคำนวณอายุจากวันเกิด
const calculateAge = (birthDate) => {
  if (!birthDate) {
    return "Invalid Date"; // กรณีที่ไม่มีวันเกิด
  }

  // แปลง birthDate จาก Timestamp เป็น Date
  const birth = birthDate.toDate ? birthDate.toDate() : new Date(birthDate);
  if (isNaN(birth.getTime())) {
    return "Invalid Date"; // กรณีที่ไม่สามารถแปลงวันเกิดได้
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

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

  // คำนวณอายุ
  const age = calculateAge(userData.birth_date);  // คำนวณอายุ
  if (age === "Invalid Date") {
    Alert.alert("ข้อผิดพลาด", "วันที่เกิดไม่ถูกต้อง");
    return;
  }

  // ฟังก์ชันตัดคำนำหน้าออกจากชื่อเต็ม
const removePrefix = (fullName) => {
  const prefixes = ["นางสาว", "นาย", "นาง"];  // คำนำหน้าที่จะตัดออก

  for (let prefix of prefixes) {
    if (fullName.startsWith(prefix)) {
      return fullName.slice(prefix.length).trim();  // ตัดคำนำหน้าและตัดช่องว่างที่เกินออก
    }
  }

  return fullName;  // หากไม่มีคำนำหน้าให้ส่งชื่อเต็มกลับ
};

const fullName = userData.name;
const nameWithoutPrefix = removePrefix(fullName);
    // แสดงชื่อ (ตัดคำนำหน้าออก) และอายุ
  firstPage.drawText(nameWithoutPrefix || "-", { x: 222.3, y: 664, size: 12, font: customFont });
  firstPage.drawText(age.toString(), { x: 520., y: 664, size: 12, font: customFont });

  // แสดงเลขบัตรประชาชน
  const citizenId = userData.citizen_id || "-";
  const citizenIdDigits = citizenId.split(""); // แยกตัวเลขแต่ละตัวในเลขบัตรประชาชน

  const xPositions = [180.28, 210.28, 240.28, 270.28, 300.28, 329.28, 358.28, 387.28, 417.28, 447.28, 477.28, 508.28, 538.28]  // ตำแหน่ง X ที่เหมาะสมสำหรับแต่ละตัวเลข
  for (let i = 0; i < citizenIdDigits.length; i++) {
    firstPage.drawText(citizenIdDigits[i], { x: xPositions[i], y: 640, size: 12, font: customFont });
  }

  // ข้อมูลอื่นๆ เช่น ที่อยู่
  if (userData.address_current) {
    firstPage.drawText(userData.address_current.house_no || "-", { x: 113.04, y: 615.4, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.moo || "-", { x: 187.92, y: 615.4, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.soi || "-", { x: 244.8, y: 615.4, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.road || "-", { x: 378.72, y: 615.4, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.sub_district || "-", { x: 72, y: 598, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.district || "-", { x: 266.4, y: 598, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.province || "-", { x: 430.56, y: 598, size: 12, font: customFont });
  }

  firstPage.drawText(userData.phone_num || "-", { x: 92.88, y: 580, size: 12, font: customFont });
  firstPage.drawText(userData.email || "-", { x: 317.52, y: 580, size: 12, font: customFont });
  firstPage.drawText(userData.name, { x: 241.2, y: 132, size: 12, font: customFont });

  return pdfDoc.save();
}

// ===== ฟังก์ชันรวมทั้งหมดสำหรับ หนังสือยินยอม =====
export const ConsentFrom_student = async () => {
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
        citizen_id: userInfo.citizen_id,
        birth_date: userInfo.birth_date, // birth_date is expected to be in YYYY-MM-DD format
        phone_num: userInfo.phone_num,
        email: userInfo.email,
        address_current: userInfo.address_current || null,
      };
    } else {
      Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้ในฐานข้อมูล");
      return;
    }

    // 2. ดาวน์โหลดไฟล์ต้นฉบับ PDF และฟอนต์จาก Firebase Storage
    const pdfRef = ref(storage, "หนังสือยินยอมเปิดเผยข้อมูล.pdf");
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

    // 4. บันทึกไฟล์ใน documentDirectory โดยไม่ต้องสร้างโฟลเดอร์ Downloads
    const localFileName = "หนังสือยินยอมเปิดเผยข้อมูลผู้กู้.pdf";
    const filePath = `${FileSystem.documentDirectory}${localFileName}`; // Save directly to documentDirectory
    const base64Pdf = Buffer.from(pdfBytes).toString("base64");

    try {
      await FileSystem.writeAsStringAsync(filePath, base64Pdf, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(filePath);
      Alert.alert("สร้างสำเร็จ", `สร้างไฟล์ ${localFileName} เรียบร้อยแล้ว`);
    } catch (error) {
      console.error("Error saving the file:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกเอกสารได้");
    }

  } catch (error) {
    console.error("Error generating filled PDF:", error);
    Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถสร้างเอกสารได้");
  }
};
