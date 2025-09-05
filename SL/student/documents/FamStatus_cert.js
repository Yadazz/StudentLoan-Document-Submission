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

// ฟังก์ชันแปลงตัวเลขเป็นข้อความภาษาไทย
function numberToThaiText(number) {
    // ตรวจสอบข้อมูลนำเข้า
    if (typeof number === 'string') {
        number = parseFloat(number);
    }
    
    if (isNaN(number) || number < 0) {
        return 'จำนวนเงินไม่ถูกต้อง';
    }
    
    // แยกส่วนจำนวนเต็มและทศนิยม
    const parts = number.toFixed(2).split('.');
    const integerPart = parseInt(parts[0]);
    const decimalPart = parseInt(parts[1]);
    
    // อาร์เรย์สำหรับแปลงตัวเลข
    const ones = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    
    function convertToThai(num) {
        if (num === 0) return '';
        
        let result = '';
        let numStr = num.toString();
        const len = numStr.length;
        
        for (let i = 0; i < len; i++) {
            const digit = parseInt(numStr[i]);
            const position = len - i;
            
            if (digit !== 0) {
                // จัดการหลักล้าน
                if (position === 7) {
                    result += ones[digit] + 'ล้าน';
                }
                // จัดการหลักแสน
                else if (position === 6) {
                    result += ones[digit] + 'แสน';
                }
                // จัดการหลักหมื่น
                else if (position === 5) {
                    result += ones[digit] + 'หมื่น';
                }
                // จัดการหลักพัน
                else if (position === 4) {
                    result += ones[digit] + 'พัน';
                }
                // จัดการหลักร้อย
                else if (position === 3) {
                    result += ones[digit] + 'ร้อย';
                }
                // จัดการหลักสิบ
                else if (position === 2) {
                    if (digit === 1) {
                        result += 'สิบ';
                    } else if (digit === 2) {
                        result += 'ยี่สิบ';
                    } else {
                        result += ones[digit] + 'สิบ';
                    }
                }
                // จัดการหลักหน่วย
                else if (position === 1) {
                    // ถ้าหลักสิบมีค่า และหลักหน่วยเป็น 1 ใช้ "เอ็ด"
                    if (len > 1 && numStr[len - 2] !== '0' && digit === 1) {
                        result += 'เอ็ด';
                    } else {
                        result += ones[digit];
                    }
                }
            }
        }
        
        return result;
    }
    
    // แปลงส่วนจำนวนเต็ม
    let result = '';
    
    if (integerPart === 0) {
        result = 'ศูนย์';
    } else {
        result = convertToThai(integerPart);
    }
    
    // แปลงส่วนทศนิยม (สตางค์) - เฉพาะเมื่อมีทศนิยม
    if (decimalPart > 0) {
        result += 'จุด' + convertToThai(decimalPart);
    }
    
    return result;
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
const fullName = userData.guardian_info.name;
const nameWithoutPrefix = removePrefix(fullName);

    // info ผู้กู้ยืม
    firstPage.drawText(userData.student_id || "-", { x: 84.96, y: 707.8, size: 10, font: customFont });
    firstPage.drawText(userData.citizen_id || "-", { x: 250.56, y: 707.8, size: 10, font: customFont });
    firstPage.drawText(userData.name || "-", { x: 403.92, y: 707.8, size: 10, font: customFont });
    firstPage.drawText(userData.school + " " + userData.major || "-", { x: 113.76, y: 689.8, size: 10, font: customFont });
    firstPage.drawText(userData.phone_num || "-", { x: 433, y: 689.8, size: 10, font: customFont });

    firstPage.drawText(userData.father_info.name || "-", { x: 185.76, y: 473, size: 10, font: customFont });
    firstPage.drawText(userData.mother_info.name || "-", { x: 185.76, y: 454.5, size: 10, font: customFont });

    // info ผู้ปกครอง
    if(userData.survey.familyStatus === "ค"){
    firstPage.drawText(nameWithoutPrefix || "-", { x: 223.2, y: 292, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.guardian_relation || "-", { x: 135 , y: 274, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.occupation || "-", { x: 281.52, y: 274, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.workplace.positon || "-", { x: 436.32, y: 274, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.house_no || "-", { x: 69, y: 256, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.moo || "-", { x: 119.52, y: 256, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.village || "-", { x: 177.12, y: 256, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.road || "-", { x: 280.8, y: 256, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.sub_district || "-", { x: 424.8, y: 256, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.district || "-", { x: 77.04, y: 237.8, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.province || "-", { x: 252, y: 237.8, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.zipcode || "-", { x: 462.96, y: 237.8, size: 10, font: customFont });
    firstPage.drawText(userData.guardian_info.phone_number || "-", { x: 100.08, y: 220, size: 10, font: customFont });
     // คำนวณรายได้ต่อปีจากรายได้ต่อเดือน
    const guardianIncomeMonthly = userData.guardian_info.income || 0; // รายได้ต่อเดือนของผู้ปกครอง
    const guardianIncomeAnnual = calculateAnnualIncome(guardianIncomeMonthly);
    const guardianIncomeText = numberToThaiText(guardianIncomeAnnual); // แปลงรายได้เป็นข้อความภาษาไทย

    firstPage.drawText(guardianIncomeAnnual.toString(), { x: 80.64, y: 202, size: 10, font: customFont });
    firstPage.drawText(guardianIncomeText, { x: 266, y: 202, size: 10, font: customFont });
    }

    // info พ่อ
    if(userData.survey.livingWith === "บิดา"){
    const fatherIncomeMonthly = userData.father_info.income || 0; // รายได้ต่อเดือนของผู้ปกครอง
    const fatherIncomeAnnual = calculateAnnualIncome(fatherIncomeMonthly);
    const fatherIncomeText = numberToThaiText(fatherIncomeAnnual); // แปลงรายได้เป็นข้อความภาษาไทย

    firstPage.drawText(fatherIncomeAnnual.toString(), { x: 80.64, y: 202, size: 10, font: customFont });
    firstPage.drawText(fatherIncomeText, { x: 264.24, y: 202, size: 10, font: customFont });
    }

    // info แม่
    if(userData.survey.livingWith === "มารดา"){
    const motherIncomeMonthly = userData.mother_info.income || 0; // รายได้ต่อเดือนของผู้ปกครอง
    const motherIncomeAnnual = calculateAnnualIncome(motherIncomeMonthly);
    const motherIncomeText = numberToThaiText(motherIncomeAnnual); // แปลงรายได้เป็นข้อความภาษาไทย

    firstPage.drawText(motherIncomeAnnual.toString(), { x: 80.64, y: 202, size: 10, font: customFont });
    firstPage.drawText(motherIncomeText, { x: 264.24, y: 202, size: 10, font: customFont });
    }

  return pdfDoc.save();
}

// ===== ฟังก์ชันรวมทั้งหมดสำหรับ หนังสือยินยอมมารดา =====
export const FamStatus_cert = async () => {
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
        citizen_id: userInfo.citizen_id || "",
        student_id: userInfo.student_id || "",
        phone_num: userInfo.phone_num || "",
        email: userInfo.email || "",
        school: userInfo.school || "",
        major: userInfo.major || "",
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
    const pdfRef = ref(storage, "รับรองสถานภาพครอบครัว.pdf");
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
    const localFileName = "หนังสือรับรองสถานภาพครอบครัว.pdf";
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
