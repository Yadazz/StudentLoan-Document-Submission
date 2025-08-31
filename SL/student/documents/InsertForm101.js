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

function drawCitizenId(pdfPage, citizenId, font, startY) {
  if (!citizenId || citizenId === undefined || citizenId === null || citizenId.toString().trim() === "") {
    citizenId = "-------------"; // 13 ช่องเป็นขีด
  }
  const digits = citizenId.toString().split("");
  const positionsX = [167.2, 190.08, 207.8, 223.8, 242.36, 265, 283, 301.56, 319.56, 336.84, 362.8, 381.8, 404.52];
  digits.forEach((digit, index) => {
    if (positionsX[index] !== undefined) {
      pdfPage.drawText(digit, { x: positionsX[index], y: startY, size: 12, font: font });
    }
  });
}

// แปลงวันเกิดเป็น DDMMYYYY
function formatDateToDDMMYYYY(date) {
  if (!date) return "--------";
  let d;
  if (date.toDate) {
    d = date.toDate(); // Firestore Timestamp
  } else {
    d = new Date(date);
  }
  if (isNaN(d.getTime())) return "--------";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  return `${day}${month}${year}`;
}

function drawBirthDate(pdfPage, birthDate, font, startY) {
  const formatted = formatDateToDDMMYYYY(birthDate);
  const digits = formatted.split("");
  const positionsX = [135.36, 142.96, 175, 182, 234.72, 241, 248, 255];
  digits.forEach((digit, index) => {
    if (positionsX[index] !== undefined) {
      pdfPage.drawText(digit, { x: positionsX[index], y: startY, size: 12, font: font });
    }
  });
}

// ฟังก์ชันคำนวณอายุ
const calculateAge = (birthDate) => {
  if (!birthDate) return "Invalid Date";
  const birth = birthDate.toDate ? birthDate.toDate() : new Date(birthDate);
  if (isNaN(birth.getTime())) return "Invalid Date";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// ฟังก์ชันสร้าง PDF
async function fillPdf(userData, existingPdfBytes, fontBytes) {
  if (Platform.OS === "web") {
    Alert.alert("ไม่รองรับ Web", "การสร้าง PDF บน Web ยังไม่รองรับ");
    return null;
  }

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);
  const customFont = await pdfDoc.embedFont(fontBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const secondPage = pages[1];
  const threePage = pages[2];

  // ===== คำนวณอายุและวางลง PDF =====
  const age = calculateAge(userData.birth_date);
  if (age === "Invalid Date") {
    Alert.alert("ข้อผิดพลาด", "วันที่เกิดไม่ถูกต้อง");
    return null;
  }
  firstPage.drawText(age.toString(), { x: 345.6, y: 575.68, size: 12, font: customFont });

  // ข้อมูลส่วนตัว
  firstPage.drawText(userData.name || "-", { x: 100.08, y: 614.88, size: 12, font: customFont });
  firstPage.drawText(userData.email || "-", { x: 411.12, y: 555.84, size: 12, font: customFont });
  firstPage.drawText(userData.phone_num || "-", { x: 285.12, y: 557.84, size: 12, font: customFont });
  firstPage.drawText(userData.major || "-", { x: 202.32, y: 484.56, size: 12, font: customFont });
  firstPage.drawText(userData.birthdate || "-", { x: 139.68, y: 573.12, size: 12, font: customFont });
  firstPage.drawText(userData.school || "-", { x: 159.12, y: 503.28, size: 12, font: customFont });
  firstPage.drawText(userData.student_id || "-", { x: 165.56, y: 432.44, size: 12, font: customFont });

  drawCitizenId(firstPage, userData.citizen_id, customFont, 596.88);
  drawBirthDate(firstPage, userData.birth_date, customFont, 578.16);

  // ข้อมูลที่อยู่ปัจจุบัน
  if (userData.address_current) {
    firstPage.drawText(userData.address_current.house_no || "-", { x: 201.6, y:396, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.moo || "-", { x: 246.96, y: 396, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.village || "-", { x: 324.72, y: 400.32, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.soi || "-", { x: 459.36, y: 396, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.road || "-", { x: 113.76, y: 378, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.sub_district || "-", { x: 228.24, y: 378, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.district || "-", { x: 330.64, y: 378, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.province || "-", { x: 444.96, y: 378, size: 12, font: customFont });
    firstPage.drawText(userData.address_current.zipcode || "-", { x: 119.52, y: 360, size: 12, font: customFont });
  }

  if (userData.address_perm) {
    firstPage.drawText(userData.address_perm.house_no || "-", { x: 156.24, y: 343.44, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.moo || "-", { x: 208.8, y: 343.44, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.village || "-", { x: 285.12, y: 343.44, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.soi || "-", { x: 421.2, y: 343.44, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.road || "-", { x: 104.4, y: 324, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.sub_district || "-", { x: 239.04, y: 324, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.district || "-", { x: 324.28, y: 324, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.province || "-", { x: 477.36, y: 324, size: 12, font: customFont });
    firstPage.drawText(userData.address_perm.zipcode || "-", { x: 135.36, y: 304.56, size: 12, font: customFont });
  }

  if (userData.father_info) {
    secondPage.drawText(userData.father_info.education_level || "-", { x: 136.8, y: 420.44, size: 12, font: customFont });
    secondPage.drawText(userData.father_info.email || "-", { x: 466.56, y: 435.6, size: 12, font: customFont });
    secondPage.drawText(userData.father_info.name || "-", { x: 124.4, y: 495.104, size: 12, font: customFont });
    secondPage.drawText(userData.father_info.phone_number || "-", { x: 320.4, y: 435.6, size: 12, font: customFont });
  }

  if (userData.mother_info) {
    secondPage.drawText(userData.mother_info.name || "-", { x: 213.84, y: 113.76, size: 12, font: customFont });
    threePage.drawText(userData.mother_info.education_level || "-", { x: 378, y: 759.6, size: 12, font: customFont });
    threePage.drawText(userData.mother_info.email || "-", { x: 468.72, y: 778.104, size: 12, font: customFont });  
    threePage.drawText(userData.mother_info.phone_number || "-", { x: 331.2, y: 778.104, size: 12, font: customFont });
  }

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

    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    let userData = {};

    if (userSnap.exists()) {
      const userInfo = userSnap.data();
      userData = {
        name: userInfo.name,
        email: userInfo.email,
        phone_num: userInfo.phone_num,
        citizen_id: userInfo.citizen_id,
        student_id: userInfo.student_id,
        major: userInfo.major,
        school: userInfo.school,
        siblings_count: userInfo.siblings_count,
        birth_date: userInfo.birth_date,
        birthdate: userInfo.birthdate,
        address_current: userInfo.address_current,
        address_perm: userInfo.address_perm,
        father_info: userInfo.father_info,
        mother_info: userInfo.mother_info,
      };
    } else {
      Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้ในฐานข้อมูล");
      return;
    }

    const pdfRef = ref(storage, "กยศ101.pdf");
    const pdfUrl = await getDownloadURL(pdfRef);
    const existingPdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());

    const fontRef = ref(storage, "assets/fonts/Sarabun-Thin.ttf");
    const fontUrl = await getDownloadURL(fontRef);
    const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());

    const pdfBytes = await fillPdf(userData, existingPdfBytes, fontBytes);
    if (!pdfBytes) return;

    const localFileName = "แบบฟอร์ม_กยศ_101.pdf";
    const filePath = `${FileSystem.documentDirectory}${localFileName}`;
    const base64Pdf = Buffer.from(pdfBytes).toString("base64");

    await FileSystem.writeAsStringAsync(filePath, base64Pdf, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(filePath);

    Alert.alert("สร้างสำเร็จ", `สร้างไฟล์ ${localFileName} เรียบร้อยแล้ว`);

  } catch (error) {
    console.error("Error generating filled PDF:", error);
    Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถสร้างเอกสารได้");
  }
};
