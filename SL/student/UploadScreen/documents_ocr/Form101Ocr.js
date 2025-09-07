// Form101Ocr.js - OCR validation for กยศ. 101 form
import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

// กำหนดค่าพิกัดและขนาดของพื้นที่ที่ต้องการตรวจสอบ
const FORM_101_CONFIG = {
  targetArea: {
    x: 1045,
    y: 56,
    width: 93,
    height: 25,
  },
  expectedTexts: [
    "กยศ. 101",
    "กยศ.101",
    "ก.ย.ศ. 101",
    "ก.ย.ศ.101",
    "กยศ 101",
    "ก.ย.ศ 101",
  ],
  ocrEndpoint: "http://192.168.1.37:5000/api/ocr", // เปลี่ยนเป็น URL ของ backend จริง
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
        { resize: { width: cropArea.width * 2 } }, // ขยายขนาดเพื่อความละเอียด
      ],
      {
        compress: 0.9,
        format: SaveFormat.JPEG,
        base64: true, // ต้องการ base64 สำหรับส่งไป OCR
      }
    );

    return result;
  } catch (error) {
    console.error("Error cropping image:", error);
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
    const response = await fetch(FORM_101_CONFIG.ocrEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
        languages: ["th", "en"],
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
 * ตรวจสอบว่าข้อความที่อ่านได้ตรงกับ กยศ. 101 หรือไม่
 * @param {string} extractedText - ข้อความที่อ่านได้จาก OCR
 * @returns {boolean} - true ถ้าเป็นเอกสาร กยศ. 101
 */
const validateForm101Text = (extractedText) => {
  const normalizedText = extractedText
    .replace(/\s+/g, " ") // ลบช่องว่างซ้ำ
    .trim()
    .toLowerCase();

  console.log("Extracted text from OCR:", extractedText);
  console.log("Normalized text:", normalizedText);

  // ตรวจสอบกับรูปแบบที่คาดหวัง
  return FORM_101_CONFIG.expectedTexts.some((expectedText) => {
    const normalizedExpected = expectedText.toLowerCase().replace(/\s+/g, " ");
    const isMatch = normalizedText.includes(normalizedExpected);

    if (isMatch) {
      console.log(
        `✓ Match found: "${extractedText}" contains "${expectedText}"`
      );
    }

    return isMatch;
  });
};

/**
 * ฟังก์ชันหลักสำหรับตรวจสอบเอกสาร กยศ. 101
 * @param {string} imageUri - URI ของภาพที่ต้องการตรวจสอบ
 * @returns {Promise<object>} - ผลลัพธ์การตรวจสอบ
 */
export const validateForm101Document = async (imageUri) => {
  try {
    console.log("Starting Form 101 validation for image:", imageUri);

    // 1. ตัดภาพให้เหลือเฉพาะพื้นที่ที่ต้องการตรวจสอบ
    console.log("Cropping image to target area...");
    const croppedResult = await cropImageToTargetArea(
      imageUri,
      FORM_101_CONFIG.targetArea
    );

    // 2. ส่งภาพไป OCR (ใช้ base64 ที่ได้จาก manipulateAsync โดยตรง)
    console.log("Sending to OCR...");
    const ocrResult = await sendToOCR(croppedResult.base64);

    if (!ocrResult.success) {
      throw new Error(ocrResult.message || "OCR processing failed");
    }

    // 3. ตรวจสอบข้อความที่อ่านได้
    console.log("Validating extracted text...");
    const isValidForm101 = validateForm101Text(ocrResult.text);

    const result = {
      isValid: isValidForm101,
      extractedText: ocrResult.text,
      confidence: isValidForm101 ? "high" : "low",
      details: ocrResult.details,
      message: isValidForm101
        ? "ตรวจพบเอกสาร กยศ. 101 ถูกต้อง"
        : 'ไม่พบข้อความ "กยศ. 101" ในตำแหน่งที่กำหนด',
      croppedImageUri: croppedResult.uri, // เก็บภาพที่ตัดไว้สำหรับ debug
    };

    console.log("Validation result:", result);
    return result;
  } catch (error) {
    console.error("Error in Form 101 validation:", error);
    return {
      isValid: false,
      extractedText: "",
      confidence: "error",
      details: [],
      message: `เกิดข้อผิดพลาดในการตรวจสอบเอกสาร: ${error.message}`,
      error: error.message,
    };
  }
};

/**
 * ฟังก์ชันสำหรับแสดงผลการตรวจสอบในรูปแบบ Alert
 * @param {object} validationResult - ผลลัพธ์จาก validateForm101Document
 * @param {function} onSuccess - callback เมื่อตรวจสอบผ่าน
 * @param {function} onFailure - callback เมื่อตรวจสอบไม่ผ่าน
 */
export const showValidationAlert = (validationResult, onSuccess, onFailure) => {
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
      `${message}\n\nข้อความที่อ่านได้: "${extractedText}"\n\nกรุณาอัปโหลดเอกสาร กยศ. 101 ที่ถูกต้อง`,
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
export const checkOCRBackendStatus = async () => {
  try {
    const response = await fetch(
      FORM_101_CONFIG.ocrEndpoint.replace("/api/ocr", "/health"),
      {
        method: "GET",
        timeout: 5000,
      }
    );
    return response.ok;
  } catch (error) {
    console.warn("OCR backend not available:", error);
    return false;
  }
};

/**
 * ฟังก์ชันสำหรับทดสอบการตรวจสอบเอกสาร (สำหรับ development)
 * @param {string} imageUri - URI ของภาพทดสอบ
 */
export const testForm101Validation = async (imageUri) => {
  console.log("=== Testing Form 101 Validation ===");

  const backendStatus = await checkOCRBackendStatus();
  console.log("Backend status:", backendStatus ? "Available" : "Not Available");

  if (!backendStatus) {
    console.warn(
      "⚠️ OCR Backend is not available. Make sure the Flask server is running."
    );
    return;
  }

  const result = await validateForm101Document(imageUri);
  console.log("Test result:", result);

  showValidationAlert(
    result,
    () => console.log("✓ Validation passed"),
    () => console.log("✗ Validation failed")
  );
};

export default {
  validateForm101Document,
  showValidationAlert,
  checkOCRBackendStatus,
  testForm101Validation,
};
