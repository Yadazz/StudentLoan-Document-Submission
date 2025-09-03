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

// ฟังก์ชันคำนวณรายได้ต่อปี
const calculateAnnualIncome = (monthlyIncome) => {
  if (typeof monthlyIncome === 'number') {
    return monthlyIncome * 12;  // คูณรายได้ต่อเดือนด้วย 12 เพื่อหาค่ารายได้ต่อปี
  } else {
    console.error('Invalid monthly income value');
    return 0;
  }
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

    // info ผู้กู้ยืม
    firstPage.drawText(nameWithoutPrefix || "-", { x: 189.36, y: 614.5, size: 10, font: customFont });
    firstPage.drawText("นักศึกษา", { x: 140, y: 599, size: 10, font: customFont });
    firstPage.drawText("มหาวิทยาลัยเทคโนโลยีสุรนารี", { x: 301, y: 599, size: 10, font: customFont });
    firstPage.drawText(userData.address_current.house_no || "-", { x: 478.08, y: 599, size: 10, font: customFont });
    firstPage.drawText(userData.address_current.moo || "-", { x: 90.72, y: 583, size: 10, font: customFont });
    firstPage.drawText(userData.address_current.soi || "-", { x: 184.32, y: 583, size: 10, font: customFont });
    firstPage.drawText(userData.address_current.road || "-", { x: 304.56, y: 583, size: 10, font: customFont });
    firstPage.drawText(userData.address_current.sub_district || "-", { x: 437.04, y: 583, size: 10, font: customFont });
    firstPage.drawText(userData.address_current.district || "-", { x: 114.48, y: 567, size: 10, font: customFont });
    firstPage.drawText(userData.address_current.province || "-", { x: 236.88, y: 567, size: 10, font: customFont });
    firstPage.drawText(userData.address_current.zipcode || "-", { x: 371.52, y: 567, size: 10, font: customFont });
    firstPage.drawText(userData.phone_num || "-", { x: 465.84, y: 567, size: 10, font: customFont });
    firstPage.drawText("ไม่มีรายได้", { x: 136.8, y: 551, size: 10, font: customFont });

    if(userData.survey.guardianIncome === "มีรายได้ไม่ประจำ"){
      // info ผู้ปกครอง
    firstPage.drawText(userData.guardian_info.name || "-", { x: 294.4, y: 322, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.occupation || "-", { x: 123.84, y: 305.8, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.workplace.name || "-", { x: 282.96, y: 305.8, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.workplace.house_no || "-", { x: 447.10, y: 305.8, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.workplace.moo || "-", { x: 511.2, y: 305.8, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.workplace.soi || "-", { x: 108.72, y: 290, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.workplace.road || "-", { x: 199.44, y: 290, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.workplace.sub_district || "-", { x: 328.32, y: 290, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.workplace.district || "-", { x: 472.32, y: 290, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.workplace.province || "-", { x: 92.88, y: 274, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.workplace.zipcode || "-", { x: 223.92, y: 274, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.phone_number || "-", { x: 321.12, y: 274, size: 10, font: customFont });
     // คำนวณรายได้ต่อปีจากรายได้ต่อเดือน
    const guardianIncomeMonthly = userData.guardian_info.income || 0; // รายได้ต่อเดือนของผู้ปกครอง
    const guardianIncomeAnnual = calculateAnnualIncome(guardianIncomeMonthly);

    firstPage.drawText(guardianIncomeAnnual.toString(), { x: 441.36, y: 274, size: 10, font: customFont });
    }

    // if(userData.survey.fatherIncome === "มีรายได้ไม่ประจำ"){
    //   // info ผู้ปกครอง
    // firstPage.drawText(userData.father_info.name || "-", { x: 294.4, y: 322, size: 10, font: customFont });
    // firstPage.drawText(userData.father_info.occupation || "-", { x: 123.84, y: 305.8, size: 10, font: customFont });
    // firstPage.drawText(userData.father_info.workplace.name || "-", { x: 282.96, y: 305.8, size: 10, font: customFont });
    // firstPage.drawText(userData.father_info.workplace.house_no || "-", { x: 447.10, y: 305.8, size: 10, font: customFont });
    // firstPage.drawText(userData.father_info.workplace.moo || "-", { x: 511.2, y: 305.8, size: 10, font: customFont });
    // firstPage.drawText(userData.father_info.workplace.soi || "-", { x: 108.72, y: 290, size: 10, font: customFont });
    // firstPage.drawText(userData.father_info.workplace.road || "-", { x: 199.44, y: 290, size: 10, font: customFont });
    // firstPage.drawText(userData.father_info.workplace.sub_district || "-", { x: 328.32, y: 290, size: 10, font: customFont });
    // firstPage.drawText(userData.father_info.workplace.district || "-", { x: 472.32, y: 290, size: 10, font: customFont });
    // firstPage.drawText(userData.father_info.workplace.province || "-", { x: 92.88, y: 274, size: 10, font: customFont });
    // firstPage.drawText(userData.father_info.workplace.zipcode || "-", { x: 223.92, y: 274, size: 10, font: customFont });
    // firstPage.drawText(userData.father_info.phone_number || "-", { x: 321.12, y: 274, size: 10, font: customFont });
    //  // คำนวณรายได้ต่อปีจากรายได้ต่อเดือน
    // const fatherIncomeMonthly = userData.father_info.income || 0; // รายได้ต่อเดือนของผู้ปกครอง
    // const fatherIncomeAnnual = calculateAnnualIncome(fatherIncomeMonthly);

    // firstPage.drawText(fatherIncomeAnnual.toString(), { x: 441.36, y: 274, size: 10, font: customFont });
    // }

  return pdfDoc.save();
}

// ===== ฟังก์ชันรวมทั้งหมดสำหรับ หนังสือยินยอมมารดา =====
export const GuardianIncome102 = async () => {
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
        name: userInfo.name || "",
        address_current: userInfo.address_current || null,
        guardian_info: userInfo.guardian_info || null,
        father_info: userInfo.father_info || null,
        mother_info: userInfo.mother_info || null,
        survey: userInfo.survey || null,
      };
    } else {
      Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้ในฐานข้อมูล");
      return;
    }

    // 2. ดาวน์โหลดไฟล์ต้นฉบับ PDF และฟอนต์จาก Firebase Storage
    const pdfRef = ref(storage, "กยศ.102.pdf");
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
    const localFileName = "หนังสือรับรองรายได้ผู้ปกครอง.pdf";
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
