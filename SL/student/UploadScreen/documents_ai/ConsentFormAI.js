// documents_ai/ConsentFormAI.js - Fixed AI validation with proper error handling
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

// Configuration - Fixed environment variable access
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const AI_BACKEND_URL = process.env.EXPO_PUBLIC_AI_BACKEND_URL || 'http://192.168.1.102:3001';
const USE_BACKEND_SERVER = process.env.EXPO_PUBLIC_USE_AI_BACKEND === 'true';

let genAI = null;
let model = null;

console.log('🔧 AI Configuration:');
console.log('- Backend URL:', AI_BACKEND_URL);
console.log('- Use Backend:', USE_BACKEND_SERVER);
console.log('- API Key configured:', !!GEMINI_API_KEY);

// Initialize Gemini AI for client-side processing
const initializeGemini = () => {
  if (!genAI && GEMINI_API_KEY && GEMINI_API_KEY !== 'AIzaSyB0IPMGQrR08mWLThXDALeaQqwpI1y9Wgw') {
    try {
      genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Updated model name
      console.log('✓ Gemini AI initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      return false;
    }
  }
  return !!genAI;
};

// Check if AI backend server is available with better error handling
const checkBackendServer = async () => {
  try {
    console.log('🔍 Checking backend server at:', AI_BACKEND_URL);
    
    const response = await fetch(`${AI_BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // Increased timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✓ AI Backend Server is available:', data.status);
      return true;
    } else {
      console.log('❌ Backend server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ AI Backend Server not available:', error.message);
    return false;
  }
};

// Enhanced AI backend status check
export const checkAIBackendStatus = async () => {
  try {
    console.log('🤖 Checking AI backend status...');
    console.log('Configuration:');
    console.log('- USE_BACKEND_SERVER:', USE_BACKEND_SERVER);
    console.log('- AI_BACKEND_URL:', AI_BACKEND_URL);
    console.log('- GEMINI_API_KEY configured:', !!GEMINI_API_KEY);

    // If configured to use backend server, check server first
    if (USE_BACKEND_SERVER) {
      const serverAvailable = await checkBackendServer();
      if (serverAvailable) {
        // Test AI connection through server
        try {
          console.log('🔬 Testing AI connection through server...');
          const response = await fetch(`${AI_BACKEND_URL}/ai/test`);
          if (response.ok) {
            const data = await response.json();
            console.log('✓ AI backend server is available and working');
            console.log('Server response:', data.response);
            return true;
          }
        } catch (error) {
          console.log('❌ Server AI test failed:', error.message);
          console.log('⚠️ Falling back to client-side AI');
        }
      }
    }

    // Fall back to client-side AI
    if (!GEMINI_API_KEY) {
      console.error('❌ Gemini API key not configured');
      console.log('Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file');
      return false;
    }

    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      console.error('❌ Gemini API key is placeholder value');
      console.log('Please replace with your actual API key');
      return false;
    }

    const initialized = initializeGemini();
    if (!initialized) {
      console.error('❌ Failed to initialize Gemini AI');
      return false;
    }

    // Test with a simple request
    try {
      console.log('🔬 Testing client-side AI connection...');
      const testResult = await model.generateContent("Test connection - respond with OK");
      const testResponse = await testResult.response;
      const text = testResponse.text();
      
      console.log('✓ Client-side AI is available');
      console.log('AI response:', text);
      return true;
    } catch (testError) {
      console.error('❌ Client-side AI test failed:', testError.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ AI backend check failed:', error);
    return false;
  }
};

// Server-side validation for Form 101
const validateForm101ViaServer = async (fileUri, mimeType) => {
  try {
    console.log('📤 Uploading to server for Form 101 validation...');
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Create FormData
    const formData = new FormData();
    const file = {
      uri: fileUri,
      type: mimeType || 'image/jpeg',
      name: `form101_${Date.now()}.${mimeType ? mimeType.split('/')[1] : 'jpg'}`,
    };
    
    formData.append('document', file);

    const response = await fetch(`${AI_BACKEND_URL}/ai/validate/form101`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server validation error:', errorText);
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Server validation completed');
    return result.validation;

  } catch (error) {
    console.error('❌ Server validation error:', error);
    throw error;
  }
};

// Server-side validation for Consent Form
const validateConsentFormViaServer = async (fileUri, formType, mimeType) => {
  try {
    console.log(`📤 Uploading to server for ${formType} consent validation...`);
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    const formData = new FormData();
    const file = {
      uri: fileUri,
      type: mimeType || 'image/jpeg',
      name: `consent_${formType}_${Date.now()}.${mimeType ? mimeType.split('/')[1] : 'jpg'}`,
    };
    
    formData.append('document', file);

    const response = await fetch(`${AI_BACKEND_URL}/ai/validate/consent/${formType}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server validation error:', errorText);
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Server validation completed');
    return result.validation;

  } catch (error) {
    console.error('❌ Server validation error:', error);
    throw error;
  }
};

// Convert file to format suitable for Gemini (client-side)
const prepareFileForGemini = async (fileUri, mimeType) => {
  try {
    console.log('📁 Preparing file for Gemini AI...');
    
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    let actualMimeType = mimeType;
    if (!actualMimeType) {
      const fileExtension = fileUri.split('.').pop()?.toLowerCase();
      switch (fileExtension) {
        case 'jpg':
        case 'jpeg':
          actualMimeType = 'image/jpeg';
          break;
        case 'png':
          actualMimeType = 'image/png';
          break;
        case 'pdf':
          actualMimeType = 'application/pdf';
          break;
        default:
          actualMimeType = 'image/jpeg';
      }
    }

    console.log('✅ File prepared for Gemini');
    return {
      inlineData: {
        data: base64Data,
        mimeType: actualMimeType,
      },
    };
  } catch (error) {
    console.error('❌ Error preparing file for Gemini:', error);
    throw new Error(`ไม่สามารถเตรียมไฟล์สำหรับการวิเคราะห์ได้: ${error.message}`);
  }
};

// Client-side Form 101 validation
const validateForm101ClientSide = async (fileUri, mimeType) => {
  console.log('🤖 Starting client-side Form 101 validation...');
  
  if (!model) {
    const initialized = initializeGemini();
    if (!initialized) {
      throw new Error('ระบบ AI ไม่พร้อมใช้งาน - กรุณาตรวจสอบ API Key');
    }
  }

  const filePart = await prepareFileForGemini(fileUri, mimeType);

  const prompt = `
ตรวจสอบเอกสารนี้ว่าเป็นแบบฟอร์ม 101 (แบบคำขอรับทุนการศึกษา) หรือไม่

กรุณาตรวจสอบและตอบในรูปแบบ JSON ดังนี้:
{
  "isForm101": true/false,
  "confidence": 0-100,
  "foundElements": ["รายการที่พบในเอกสาร"],
  "missingElements": ["รายการที่ขาดหายไป"],
  "hasSignature": true/false,
  "signatureQuality": "genuine/suspicious/unclear/none",
  "extractedData": {
    "studentName": "ชื่อนักเรียน",
    "studentId": "รหัสนักเรียน",
    "idCard": "เลขบัตรประชาชน",
    "address": "ที่อยู่",
    "phone": "เบอร์โทรศัพท์",
    "email": "อีเมล"
  },
  "recommendations": ["คำแนะนำสำหรับการแก้ไข"],
  "overall_status": "valid/invalid/needs_review"
}

ให้ความสำคัญกับ:
1. การมีอยู่ของหัวเอกสาร "แบบฟอร์ม 101" หรือ "แบบคำขอรับทุนการศึกษา"
2. ช่องกรอกข้อมูลส่วนตัวของนักเรียน
3. ลายเซ็นหรือการลงชื่อ
4. ความชัดเจนและความสมบูรณ์ของข้อมูล
`;

  try {
    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    const responseText = response.text();

    console.log('🤖 AI Response received');

    // Try to parse JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Client-side validation completed');
        return parsed;
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response as JSON, using text analysis');
      return analyzeTextResponse(responseText);
    }
  } catch (error) {
    console.error('❌ Client-side validation failed:', error);
    throw error;
  }
};

// Client-side Consent Form validation
const validateConsentFormClientSide = async (fileUri, formType, mimeType) => {
  console.log(`🤖 Starting client-side ${formType} consent validation...`);
  
  if (!model) {
    const initialized = initializeGemini();
    if (!initialized) {
      throw new Error('ระบบ AI ไม่พร้อมใช้งาน - กรุณาตรวจสอบ API Key');
    }
  }

  const filePart = await prepareFileForGemini(fileUri, mimeType);

  const formTypeText = {
    'student': 'นักเรียน',
    'father': 'บิดา',
    'mother': 'มารดา',
    'guardian': 'ผู้ปกครอง'
  };

  const prompt = `
ตรวจสอบเอกสารนี้ว่าเป็นหนังสือให้ความยินยอมในการเปิดเผยข้อมูลของ${formTypeText[formType] || 'นักเรียน'} หรือไม่

กรุณาตรวจสอบและตอบในรูปแบบ JSON ดังนี้:
{
  "isConsentForm": true/false,
  "formType": "${formType}",
  "confidence": 0-100,
  "hasConsent": true/false,
  "consentType": "เปิดเผยข้อมูล/อื่นๆ",
  "hasSignature": true/false,
  "signatureQuality": "genuine/suspicious/unclear/none",
  "extractedData": {
    "name": "ชื่อ-นามสกุล",
    "idCard": "เลขบัตรประชาชน",
    "address": "ที่อยู่",
    "phone": "เบอร์โทรศัพท์",
    "email": "อีเมล",
    "relationship": "ความสัมพันธ์กับนักเรียน"
  },
  "consentDetails": ["รายละเอียดความยินยอม"],
  "recommendations": ["คำแนะนำ"],
  "overall_status": "valid/invalid/needs_review"
}

ให้ความสำคัญกับ:
1. การระบุว่าเป็นหนังสือให้ความยินยอม
2. การระบุประเภทของความยินยอม (เปิดเผยข้อมูล)
3. ข้อมูลส่วนตัวที่สมบูรณ์
4. ลายเซ็นหรือการลงชื่อที่ชัดเจน
5. วันที่ในเอกสาร
`;

  try {
    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    const responseText = response.text();

    console.log('🤖 AI Response received');

    // Try to parse JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Client-side validation completed');
        return parsed;
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response as JSON, using text analysis');
      return analyzeConsentTextResponse(responseText, formType);
    }
  } catch (error) {
    console.error('❌ Client-side validation failed:', error);
    throw error;
  }
};

// Main validation functions with better error handling
export const validateForm101Document = async (fileUri, mimeType = null) => {
  try {
    console.log('🚀 Starting Form 101 validation...');
    console.log('File URI:', fileUri);
    console.log('MIME Type:', mimeType);

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('ไฟล์ไม่พบ - กรุณาเลือกไฟล์ใหม่');
    }

    // Try server-side validation first if enabled
    if (USE_BACKEND_SERVER) {
      try {
        const serverAvailable = await checkBackendServer();
        if (serverAvailable) {
          console.log('✅ Using server-side validation');
          return await validateForm101ViaServer(fileUri, mimeType);
        }
      } catch (serverError) {
        console.log('⚠️ Server validation failed, falling back to client-side:', serverError.message);
      }
    }

    // Fall back to client-side validation
    console.log('✅ Using client-side validation');
    return await validateForm101ClientSide(fileUri, mimeType);

  } catch (error) {
    console.error('❌ Form 101 validation error:', error);
    throw new Error(`การตรวจสอบแบบฟอร์ม 101 ล้มเหลว: ${error.message}`);
  }
};

export const validateConsentForm = async (fileUri, formType = 'student', mimeType = null) => {
  try {
    console.log(`🚀 Starting ${formType} consent form validation...`);
    console.log('File URI:', fileUri);
    console.log('MIME Type:', mimeType);

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('ไฟล์ไม่พบ - กรุณาเลือกไฟล์ใหม่');
    }

    // Try server-side validation first if enabled
    if (USE_BACKEND_SERVER) {
      try {
        const serverAvailable = await checkBackendServer();
        if (serverAvailable) {
          console.log('✅ Using server-side validation');
          return await validateConsentFormViaServer(fileUri, formType, mimeType);
        }
      } catch (serverError) {
        console.log('⚠️ Server validation failed, falling back to client-side:', serverError.message);
      }
    }

    // Fall back to client-side validation
    console.log('✅ Using client-side validation');
    return await validateConsentFormClientSide(fileUri, formType, mimeType);

  } catch (error) {
    console.error('❌ Consent form validation error:', error);
    throw new Error(`การตรวจสอบหนังสือยินยอม ล้มเหลว: ${error.message}`);
  }
};

// Batch validation (server-side only)
export const validateMultipleDocuments = async (files) => {
  try {
    if (!USE_BACKEND_SERVER) {
      throw new Error('การตรวจสอบหลายไฟล์พร้อมกันต้องใช้ backend server');
    }

    const serverAvailable = await checkBackendServer();
    if (!serverAvailable) {
      throw new Error('Backend server ไม่พร้อมใช้งาน');
    }

    console.log(`📦 Starting batch validation for ${files.length} files...`);

    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileObj = {
        uri: file.uri,
        type: file.mimeType,
        name: file.filename || `document_${i}.${file.mimeType.split('/')[1]}`,
      };
      formData.append('documents', fileObj);
    }

    const response = await fetch(`${AI_BACKEND_URL}/ai/validate/batch`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'การตรวจสอบหลายไฟล์ล้มเหลว');
    }

    const result = await response.json();
    console.log('✅ Batch validation completed');
    return result.results;

  } catch (error) {
    console.error('❌ Batch validation error:', error);
    throw error;
  }
};

// Fallback text analysis functions
const analyzeTextResponse = (text) => {
  const lowerText = text.toLowerCase();
  
  const isForm101 = lowerText.includes('แบบฟอร์ม 101') || 
                   lowerText.includes('แบบคำขอ') ||
                   lowerText.includes('ทุนการศึกษา');
  
  const hasSignature = lowerText.includes('ลายเซ็น') || 
                      lowerText.includes('ลงชื่อ') ||
                      lowerText.includes('signature');

  return {
    isForm101,
    confidence: isForm101 ? 75 : 25,
    foundElements: isForm101 ? ['แบบฟอร์มทุนการศึกษา'] : [],
    missingElements: !isForm101 ? ['แบบฟอร์ม 101'] : [],
    hasSignature,
    signatureQuality: hasSignature ? 'unclear' : 'none',
    extractedData: {},
    recommendations: !isForm101 ? ['กรุณาตรวจสอบว่าเป็นแบบฟอร์ม 101'] : [],
    overall_status: isForm101 && hasSignature ? 'valid' : 'needs_review',
    rawResponse: text
  };
};

const analyzeConsentTextResponse = (text, formType) => {
  const lowerText = text.toLowerCase();
  
  const isConsentForm = lowerText.includes('ความยินยอม') || 
                       lowerText.includes('เปิดเผยข้อมูล') ||
                       lowerText.includes('consent');
  
  const hasSignature = lowerText.includes('ลายเซ็น') || 
                      lowerText.includes('ลงชื่อ') ||
                      lowerText.includes('signature');

  return {
    isConsentForm,
    formType,
    confidence: isConsentForm ? 75 : 25,
    hasConsent: isConsentForm,
    consentType: isConsentForm ? 'เปิดเผยข้อมูล' : '',
    hasSignature,
    signatureQuality: hasSignature ? 'unclear' : 'none',
    extractedData: {},
    consentDetails: isConsentForm ? ['ความยินยอมในการเปิดเผยข้อมูล'] : [],
    recommendations: !isConsentForm ? ['กรุณาตรวจสอบว่าเป็นหนังสือยินยอม'] : [],
    overall_status: isConsentForm && hasSignature ? 'valid' : 'needs_review',
    rawResponse: text
  };
};

// Enhanced validation result display
export const showValidationAlert = (result, onAccept, onReject) => {
  let title, message, isValid;

  if (result.isForm101 !== undefined) {
    // Form 101 validation
    title = result.overall_status === 'valid' ? '✅ ตรวจสอบแบบฟอร์ม 101 สำเร็จ' : '⚠️ ตรวจพบปัญหา';
    
    let statusText = '';
    if (result.isForm101) {
      statusText += '✅ ตรวจพบแบบฟอร์ม 101\n';
    } else {
      statusText += '❌ ไม่พบแบบฟอร์ม 101\n';
    }

    if (result.hasSignature) {
      statusText += `✅ ตรวจพบลายเซ็น (${result.signatureQuality})\n`;
    } else {
      statusText += '❌ ไม่พบลายเซ็น\n';
    }

    statusText += `\n🎯 ความเชื่อมั่น: ${result.confidence}%`;

    if (result.extractedData && Object.keys(result.extractedData).length > 0) {
      statusText += '\n\n📋 ข้อมูลที่พบ:';
      Object.entries(result.extractedData).forEach(([key, value]) => {
        if (value) statusText += `\n• ${key}: ${value}`;
      });
    }

    if (result.recommendations && result.recommendations.length > 0) {
      statusText += '\n\n💡 คำแนะนำ:\n• ' + result.recommendations.join('\n• ');
    }

    message = statusText;
    isValid = result.overall_status === 'valid' && result.isForm101;

  } else if (result.isConsentForm !== undefined) {
    // Consent form validation
    title = result.overall_status === 'valid' ? '✅ ตรวจสอบหนังสือยินยอมสำเร็จ' : '⚠️ ตรวจพบปัญหา';
    
    let statusText = '';
    if (result.isConsentForm) {
      statusText += '✅ ตรวจพบหนังสือยินยอม\n';
    } else {
      statusText += '❌ ไม่พบหนังสือยินยอม\n';
    }

    if (result.hasSignature) {
      statusText += `✅ ตรวจพบลายเซ็น (${result.signatureQuality})\n`;
    } else {
      statusText += '❌ ไม่พบลายเซ็น\n';
    }

    statusText += `\n🎯 ความเชื่อมั่น: ${result.confidence}%`;
    statusText += `\nประเภท: ${result.formType}`;

    if (result.extractedData && Object.keys(result.extractedData).length > 0) {
      statusText += '\n\n📋 ข้อมูลที่พบ:';
      Object.entries(result.extractedData).forEach(([key, value]) => {
        if (value) statusText += `\n• ${key}: ${value}`;
      });
    }

    message = statusText;
    isValid = result.overall_status === 'valid' && result.isConsentForm;
  } else {
    title = '❌ เกิดข้อผิดพลาด';
    message = 'ไม่สามารถตรวจสอบเอกสารได้';
    isValid = false;
  }

  const buttons = [
    {
      text: 'ลองใหม่',
      style: 'cancel',
      onPress: onReject,
    },
  ];

  if (isValid || result.overall_status === 'needs_review') {
    buttons.push({
      text: result.overall_status === 'valid' ? 'ใช้ไฟล์นี้' : 'ใช้ไฟล์นี้ (ต้องตรวจสอบ)',
      onPress: onAccept,
    });
  }

  Alert.alert(title, message, buttons);
};
