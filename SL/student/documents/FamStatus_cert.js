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

// ฟังก์ชันการวาดข้อความที่มีการเลื่อนตำแหน่ง x และ y ตามการคำนวณระยะห่าง
    function drawTextWithCharacterSpacing(page, text, x, y, font, size) {
      let currentX = x;

      // อักษรที่มีวรรณยุกต์ที่ต้องการปรับตำแหน่ง
      const accentChars = ["่", "้", "๊", "๋"];
      // อักษรที่มีสระ อิ, อี, อึ, อื
      const vowelChars = ["ิ", "ี", "ึ", "ื", "ั"];

      // กำหนดการเลื่อนตำแหน่ง y สำหรับตัวอักษรที่มีวรรณยุกต์และสระ
      const accentShift = 1; // ปรับตำแหน่ง y สำหรับวรรณยุกต์
      const vowelShift = 0.5;  // ปรับตำแหน่ง y สำหรับตัวอักษรที่มีสระ
      const extraAccentShift = 3; // การเลื่อนตำแหน่ง y สำหรับวรรณยุกต์ที่ต้องการให้สูงมากขึ้นเมื่อมีสระ

      for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i); // ดึงตัวอักษรทีละตัว
        
        // ตรวจสอบว่ามีสระหรือไม่
        const hasVowel = vowelChars.some(vowel => text.includes(vowel));
        
        // กำหนดตำแหน่ง y สำหรับตัวอักษรที่มีวรรณยุกต์หรือสระ
        let adjustedY = y;

        if (accentChars.some(accent => char.includes(accent))) {
          if (hasVowel) {
            adjustedY += accentShift + extraAccentShift;  // ถ้ามีสระเลื่อนตำแหน่ง y ของวรรณยุกต์มากขึ้น
          } else {
            adjustedY += accentShift;  // ถ้าไม่มีสระ เลื่อนตามปกติ
          }
        } else if (vowelChars.some(vowel => char.includes(vowel))) {
          adjustedY += vowelShift;  // ปรับตำแหน่ง y สำหรับตัวอักษรที่มีสระ
        }

        // วาดตัวอักษร
        page.drawText(char, { x: currentX, y: adjustedY, size: size, font: font });

        // คำนวณความกว้างของตัวอักษรและเลื่อนไปตามนั้น
        const charWidth = font.widthOfTextAtSize(char, size);
        currentX += charWidth; // เลื่อนไปตามขนาดตัวอักษร
      }
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

  // ปรับขนาดฟอนต์
  const textSize = 10;  // ปรับขนาดฟอนต์ให้เล็กลงเพื่อให้ข้อความไม่ห่างเกินไป

  // info ผู้กู้ยืม
  firstPage.drawText(userData.student_id || "-", { x: 85, y: 708.5, size: textSize, font: customFont });
  firstPage.drawText(userData.citizen_id || "-", { x: 250, y: 708.5, size: textSize, font: customFont });
  firstPage.drawText(userData.name || "-", { x: 400, y: 708.5, size: textSize, font: customFont });
  firstPage.drawText(userData.school + " " + userData.major || "-", { x: 115, y: 690, size: textSize, font: customFont });
  firstPage.drawText(userData.phone_num || "-", { x: 435, y: 690, size: textSize, font: customFont });

  firstPage.drawText(userData.father_info.name || "-", { x: 185, y: 474.5, size: textSize, font: customFont });
  firstPage.drawText(userData.mother_info.name || "-", { x: 185, y: 456.5, size: textSize, font: customFont });

  // info ผู้ปกครอง
  if (userData.survey.familyStatus === "ค") {
    firstPage.drawText(nameWithoutPrefix || "-", { x: 225, y: 293.5, size: textSize, font: customFont });
    drawTextWithCharacterSpacing(firstPage, userData.guardian_info.guardian_relation, 135, 275.5, customFont, 10);
    firstPage.drawText(userData.guardian_info.occupation || "-", { x: 282, y: 275.5, size: textSize, font: customFont });
    firstPage.drawText(userData.guardian_info.workplace.position || "-", { x: 436, y: 275.5, size: textSize, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.house_no || "-", { x: 70, y: 257.5, size: 9, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.moo || "-", { x: 120, y: 257.5, size: textSize, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.village || "-", { x: 177, y: 257.5, size: textSize, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.road || "-", { x: 281, y: 257.5, size: textSize, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.sub_district || "-", { x: 425, y: 257.5, size: textSize, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.district || "-", { x: 77, y: 239, size: textSize, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.province || "-", { x: 252, y: 239, size: textSize, font: customFont });
    firstPage.drawText(userData.guardian_info.address_current.zipcode || "-", { x: 465, y: 239, size: textSize, font: customFont });
    firstPage.drawText(userData.guardian_info.phone_number || "-", { x: 100, y: 220.5, size: textSize, font: customFont });

    // คำนวณรายได้ต่อปีจากรายได้ต่อเดือน
    const guardianIncomeMonthly = userData.guardian_info.income || 0; // รายได้ต่อเดือนของผู้ปกครอง
    const guardianIncomeAnnual = calculateAnnualIncome(guardianIncomeMonthly);
    const guardianIncomeText = numberToThaiText(guardianIncomeAnnual); // แปลงรายได้เป็นข้อความภาษาไทย

    firstPage.drawText(guardianIncomeAnnual.toString(), { x: 82, y: 203, size: textSize, font: customFont });
    drawTextWithCharacterSpacing(firstPage, guardianIncomeText, 266, 203, customFont, 10);
  }

  // info พ่อ
  if (userData.survey.livingWith === "บิดา") {
    const fatherIncomeMonthly = userData.father_info.income || 0; // รายได้ต่อเดือนของผู้ปกครอง
    const fatherIncomeAnnual = calculateAnnualIncome(fatherIncomeMonthly);
    const fatherIncomeText = numberToThaiText(fatherIncomeAnnual); // แปลงรายได้เป็นข้อความภาษาไทย

    firstPage.drawText(fatherIncomeAnnual.toString(), { x: 80, y: 202, size: textSize, font: customFont });
    drawTextWithCharacterSpacing(firstPage, fatherIncomeText, 266, 202, customFont, 10);
  }

  // info แม่
  if (userData.survey.livingWith === "มารดา") {
    const motherIncomeMonthly = userData.mother_info.income || 0; // รายได้ต่อเดือนของผู้ปกครอง
    const motherIncomeAnnual = calculateAnnualIncome(motherIncomeMonthly);
    const motherIncomeText = numberToThaiText(motherIncomeAnnual); // แปลงรายได้เป็นข้อความภาษาไทย

    firstPage.drawText(motherIncomeAnnual.toString(), { x: 80, y: 202, size: textSize, font: customFont });
    drawTextWithCharacterSpacing(firstPage, motherIncomeText, 266, 202, customFont, 10);
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
