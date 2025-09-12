// ConsentFormOcr.js - OCR validation for หนังสือยินยอมเปิดเผยข้อมูล
import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

// กำหนดค่าพิกัดและขนาดของพื้นที่ที่ต้องการตรวจสอบ
const CONSENT_FORM_CONFIG = {
  targetArea: {
    x: 389,
    y: 96,
    width: 822,
    height: 196,
  },
  expectedTexts: [
    "หนังสือยินยอมในการเปิดเผยข้อมูล",
    "หนังสือยินยอม ในการเปิดเผยข้อมูล",
    "หนังสือ ยินยอม ในการเปิดเผยข้อมูล",
    "หนังสือยินยอม การเปิดเผยข้อมูล",
    "หนังสือยินยอมเปิดเผยข้อมูล",
    "ยินยอมในการเปิดเผยข้อมูล",
    "ยินยอม ในการเปิดเผยข้อมูล",
    "ยินยอมเปิดเผยข้อมูล",
    "หนังสือยินยอม",
    "เปิดเผยข้อมูล",
  ],
  ocrEndpoint: "http://192.168.1.102:5000/api/ocr", // เปลี่ยนเป็น URL ของ backend จริง
};

/**
 * ตัดภาพให้เหลือเฉพาะพื้นที่ที่ต้องการตรวจสอบ
 * @param {string} imageUri - URI ของภาพต้นฉบับ
 * @param {object} cropArea - พื้นที่ที่ต้องการตัด {x, y, width, height}
 * @returns {Promise<string>} - URI ของภาพที่ตัดแล้ว
 */
const cropImageToTargetArea = async (imageUri, cropArea) => {
  try {
    const result = await manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX: cropArea.x,
            originY: cropArea.y,
            width: cropArea.width,
            height: cropArea.height,
          },
        },
        // เพิ่มความคมชัดและปรับแสงเพื่อให้ OCR อ่านได้ดีขึ้น
        { resize: { width: cropArea.width * 1.5 } }, // ขยายขนาดเพื่อความละเอียด
      ],
      {
        compress: 0.9,
        format: SaveFormat.JPEG,
        base64: true, // ต้องการ base64 สำหรับส่งไป OCR
      }
    );

    return result;
  } catch (error) {
    console.error("Error cropping consent form image:", error);
    throw new Error("ไม่สามารถตัดภาพได้");
  }
};

/**
 * แปลงภาพเป็น base64
 * @param {string} imageUri - URI ของภาพ
 * @returns {Promise<string>} - base64 string
 */
const convertImageToBase64 = async (imageUri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw new Error("ไม่สามารถแปลงภาพเป็น base64 ได้");
  }
};

/**
 * ส่งภาพไป OCR backend
 * @param {string} base64Image - ภาพในรูปแบบ base64
 * @returns {Promise<object>} - ผลลัพธ์จาก OCR
 */
const sendToOCR = async (base64Image) => {
  try {
    const response = await fetch(CONSENT_FORM_CONFIG.ocrEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
        languages: ["th", "en"],
        documentType: "consent_form", // ระบุประเภทเอกสาร
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error sending to OCR:", error);
    throw new Error("ไม่สามารถเชื่อมต่อกับระบบ OCR ได้");
  }
};

/**
 * ตรวจสอบว่าข้อความที่อ่านได้ตรงกับหนังสือยินยอมเปิดเผยข้อมูลหรือไม่
 * @param {string} extractedText - ข้อความที่อ่านได้จาก OCR
 * @returns {boolean} - true ถ้าเป็นหนังสือยินยอมเปิดเผยข้อมูล
 */
const validateConsentFormText = (extractedText) => {
  const normalizedText = extractedText
    .replace(/\s+/g, " ") // ลบช่องว่างซ้ำ
    .replace(/[^\u0E00-\u0E7F\s]/g, "") // เก็บเฉพาะอักษรไทยและช่องว่าง
    .trim()
    .toLowerCase();

  console.log("Extracted text from OCR (Consent Form):", extractedText);
  console.log("Normalized text (Consent Form):", normalizedText);

  // ตรวจสอบกับรูปแบบที่คาดหวัง
  return CONSENT_FORM_CONFIG.expectedTexts.some((expectedText) => {
    const normalizedExpected = expectedText
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\u0E00-\u0E7F\s]/g, "");
    
    // ตรวจสอบทั้งการมีอยู่ของข้อความและการจับคู่คำสำคัญ
    const containsExpected = normalizedText.includes(normalizedExpected);
    
    // ตรวจสอบคำสำคัญหลัก
    const hasConsentKeyword = normalizedText.includes("ยินยอม");
    const hasDisclosureKeyword = normalizedText.includes("เปิดเผยข้อมูล") || 
                                normalizedText.includes("เปิดเผย");
    const hasBookKeyword = normalizedText.includes("หนังสือ");

    const isMatch = containsExpected || (hasConsentKeyword && hasDisclosureKeyword);

    if (isMatch) {
      console.log(
        `✓ Consent Form Match found: "${extractedText}" contains "${expectedText}"`
      );
    }

    return isMatch;
  });
};

/**
 * ฟังก์ชันหลักสำหรับตรวจสอบหนังสือยินยอมเปิดเผยข้อมูล
 * @param {string} imageUri - URI ของภาพที่ต้องการตรวจสอบ
 * @returns {Promise<object>} - ผลลัพธ์การตรวจสอบ
 */
export const validateConsentFormDocument = async (imageUri) => {
  try {
    console.log("Starting Consent Form validation for image:", imageUri);

    // 1. ตัดภาพให้เหลือเฉพาะพื้นที่ที่ต้องการตรวจสอบ
    console.log("Cropping consent form image to target area...");
    const croppedResult = await cropImageToTargetArea(
      imageUri,
      CONSENT_FORM_CONFIG.targetArea
    );

    // 2. ส่งภาพไป OCR (ใช้ base64 ที่ได้จาก manipulateAsync โดยตรง)
    console.log("Sending consent form to OCR...");
    const ocrResult = await sendToOCR(croppedResult.base64);

    if (!ocrResult.success) {
      throw new Error(ocrResult.message || "OCR processing failed");
    }

    // 3. ตรวจสอบข้อความที่อ่านได้
    console.log("Validating consent form extracted text...");
    const isValidConsentForm = validateConsentFormText(ocrResult.text);

    const result = {
      isValid: isValidConsentForm,
      extractedText: ocrResult.text,
      confidence: isValidConsentForm ? "high" : "low",
      details: ocrResult.details,
      message: isValidConsentForm
        ? "ตรวจพบหนังสือยินยอมเปิดเผยข้อมูลถูกต้อง"
        : 'ไม่พบข้อความ "หนังสือยินยอมในการเปิดเผยข้อมูล" ในตำแหน่งที่กำหนด',
      croppedImageUri: croppedResult.uri, // เก็บภาพที่ตัดไว้สำหรับ debug
      documentType: "consent_form",
    };

    console.log("Consent Form Validation result:", result);
    return result;
  } catch (error) {
    console.error("Error in Consent Form validation:", error);
    return {
      isValid: false,
      extractedText: "",
      confidence: "error",
      details: [],
      message: `เกิดข้อผิดพลาดในการตรวจสอบหนังสือยินยอม: ${error.message}`,
      error: error.message,
      documentType: "consent_form",
    };
  }
};

/**
 * ฟังก์ชันสำหรับแสดงผลการตรวจสอบในรูปแบบ Alert
 * @param {object} validationResult - ผลลัพธ์จาก validateConsentFormDocument
 * @param {function} onSuccess - callback เมื่อตรวจสอบผ่าน
 * @param {function} onFailure - callback เมื่อตรวจสอบไม่ผ่าน
 */
export const showConsentFormValidationAlert = (validationResult, onSuccess, onFailure) => {
  const { isValid, message, extractedText } = validationResult;

  if (isValid) {
    Alert.alert("เอกสารถูกต้อง ✓", message, [
      {
        text: "ตกลง",
        onPress: onSuccess,
      },
    ]);
  } else {
    Alert.alert(
      "เอกสารไม่ถูกต้อง ⚠️",
      `${message}\n\nข้อความที่อ่านได้: "${extractedText}"\n\nกรุณาอัปโหลดหนังสือยินยอมเปิดเผยข้อมูลที่ถูกต้อง`,
      [
        {
          text: "ลองใหม่",
          onPress: onFailure,
        },
        {
          text: "ข้าม",
          style: "cancel",
          onPress: onSuccess, // อนุญาตให้ข้ามได้ในกรณีที่ OCR อาจอ่านผิด
        },
      ]
    );
  }
};

/**
 * ฟังก์ชันตรวจสอบว่า OCR backend พร้อมใช้งานหรือไม่
 * @returns {Promise<boolean>} - true ถ้าพร้อมใช้งาน
 */
export const checkConsentFormOCRBackendStatus = async () => {
  try {
    const response = await fetch(
      CONSENT_FORM_CONFIG.ocrEndpoint.replace("/api/ocr", "/health"),
      {
        method: "GET",
        timeout: 5000,
      }
    );
    return response.ok;
  } catch (error) {
    console.warn("Consent Form OCR backend not available:", error);
    return false;
  }
};

/**
 * ฟังก์ชันสำหรับทดสอบการตรวจสอบหนังสือยินยอม (สำหรับ development)
 * @param {string} imageUri - URI ของภาพทดสอบ
 */
export const testConsentFormValidation = async (imageUri) => {
  console.log("=== Testing Consent Form Validation ===");

  const backendStatus = await checkConsentFormOCRBackendStatus();
  console.log("Consent Form Backend status:", backendStatus ? "Available" : "Not Available");

  if (!backendStatus) {
    console.warn(
      "⚠️ Consent Form OCR Backend is not available. Make sure the Flask server is running."
    );
    return;
  }

  const result = await validateConsentFormDocument(imageUri);
  console.log("Consent Form Test result:", result);

  showConsentFormValidationAlert(
    result,
    () => console.log("✓ Consent Form Validation passed"),
    () => console.log("✗ Consent Form Validation failed")
  );
};

/**
 * ฟังก์ชันรวมสำหรับตรวจสอบหนังสือยินยอมตามประเภท
 * @param {string} imageUri - URI ของภาพที่ต้องการตรวจสอบ
 * @param {string} consentType - ประเภทของหนังสือยินยอม (student, father, mother)
 * @returns {Promise<object>} - ผลลัพธ์การตรวจสอบ
 */
export const validateConsentByType = async (imageUri, consentType = "general") => {
  const result = await validateConsentFormDocument(imageUri);
  
  // เพิ่มข้อมูลประเภทหนังสือยินยอม
  return {
    ...result,
    consentType: consentType,
    message: result.isValid 
      ? `ตรวจพบหนังสือยินยอมเปิดเผยข้อมูล${getConsentTypeText(consentType)}ถูกต้อง`
      : `ไม่พบหนังสือยินยอมเปิดเผยข้อมูล${getConsentTypeText(consentType)}ในตำแหน่งที่กำหนด`
  };
};

/**
 * ฟังก์ชันสำหรับแปลงประเภทหนังสือยินยอมเป็นข้อความไทย
 * @param {string} consentType - ประเภทของหนังสือยินยอม
 * @returns {string} - ข้อความภาษาไทย
 */
const getConsentTypeText = (consentType) => {
  const typeMap = {
    student: "(นักเรียน)",
    father: "(บิดา)",
    mother: "(มารดา)",
    guardian: "(ผู้ปกครอง)",
    general: "",
  };
  return typeMap[consentType] || "";
};

export default {
  validateConsentFormDocument,
  validateConsentByType,
  showConsentFormValidationAlert,
  checkConsentFormOCRBackendStatus,
  testConsentFormValidation,
  getConsentTypeText,
};