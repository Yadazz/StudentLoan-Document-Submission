// UploadScreen.js (Main component - Updated with PDF conversion for images)
import { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { db, auth } from "../../database/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  deleteField,
} from "firebase/firestore";
import { storage } from "../../database/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
// Import for PDF creation
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { mergeImagesToPdf } from './utils/pdfMerger';

// Import OCR validation
import {
  validateForm101Document,
  showValidationAlert,
  checkOCRBackendStatus,
} from "./documents_ocr/Form101Ocr";

// Import refactored components
import LoadingScreen from "./components/LoadingScreen";
import EmptyState from "./components/EmptyState";
import HeaderSection from "./components/HeaderSection";
import TermInfoCard from "./components/TermInfoCard";
import ProgressCard from "./components/ProgressCard";
import StorageProgressCard from "./components/StorageProgressCard";
import DocumentsSection from "./components/DocumentsSection";
import SubmitSection from "./components/SubmitSection";
import FileDetailModal from "./components/FileDetailModal";
import { generateDocumentsList } from "./utils/documentGenerator";
import { handleDocumentDownload } from "./utils/documentHandlers";

const UploadScreen = ({ navigation, route }) => {
  // State management
  const [surveyData, setSurveyData] = useState(null);
  const [surveyDocId, setSurveyDocId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Updated: Change uploads structure to support multiple files per document
  const [uploads, setUploads] = useState({}); // Format: { docId: [file1, file2, ...] }
  const [uploadProgress, setUploadProgress] = useState({});
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocTitle, setSelectedDocTitle] = useState("");
  const [selectedFileIndex, setSelectedFileIndex] = useState(0); // New: Track which file in array
  const [fileContent, setFileContent] = useState(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentType, setContentType] = useState("");
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storageUploadProgress, setStorageUploadProgress] = useState({});
  const [appConfig, setAppConfig] = useState(null);

  // OCR related states
  const [isValidatingOCR, setIsValidatingOCR] = useState({});
  const [ocrBackendAvailable, setOcrBackendAvailable] = useState(false);

  // New state for PDF conversion
  const [isConvertingToPDF, setIsConvertingToPDF] = useState({});

  // Check OCR backend status on component mount
  useEffect(() => {
    const checkOCRStatus = async () => {
      const isAvailable = await checkOCRBackendStatus();
      setOcrBackendAvailable(isAvailable);
      if (!isAvailable) {
        console.warn("OCR backend is not available");
      }
    };
    checkOCRStatus();
  }, []);

  // Fetch app configuration
  const fetchAppConfig = async () => {
    try {
      const configRef = doc(db, "DocumentService", "config");
      const configDoc = await getDoc(configRef);

      if (configDoc.exists()) {
        const config = configDoc.data();
        setAppConfig(config);
        console.log("App config loaded:", config);
        return config;
      } else {
        const defaultConfig = {
          academicYear: "2567",
          term: "1",
          isEnabled: true,
          immediateAccess: true,
        };
        setAppConfig(defaultConfig);
        return defaultConfig;
      }
    } catch (error) {
      console.error("Error fetching app config:", error);
      return null;
    }
  };

  // Check submission status and load data
  useEffect(() => {
    const checkSubmissionStatus = async () => {
      setIsLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      const config = await fetchAppConfig();
      const termCollectionName = `document_submissions_${
        config?.academicYear || "2567"
      }_${config?.term || "1"}`;
      const submissionRef = doc(db, termCollectionName, currentUser.uid);
      const submissionDoc = await getDoc(submissionRef);

      if (submissionDoc.exists()) {
        navigation.replace("DocumentStatusScreen", {
          submissionData: submissionDoc.data(),
        });
        setIsLoading(false);
        return;
      }

      const userSurveyRef = doc(db, "users", currentUser.uid);
      const userSurveyDoc = await getDoc(userSurveyRef);

      if (userSurveyDoc.exists()) {
        const userData = userSurveyDoc.data();
        const surveyData = userData.survey;
        setSurveyData(surveyData);
        setSurveyDocId(userSurveyDoc.id);

        if (userData.uploads) {
          // Convert old format to new format if needed
          const convertedUploads = {};
          Object.keys(userData.uploads).forEach(docId => {
            const upload = userData.uploads[docId];
            if (Array.isArray(upload)) {
              convertedUploads[docId] = upload;
            } else {
              // Convert single file to array format
              convertedUploads[docId] = [upload];
            }
          });
          setUploads(convertedUploads);
        }
      } else {
        setSurveyData(null);
        setSurveyDocId(null);
      }
      setIsLoading(false);
    };

    checkSubmissionStatus();
  }, []);

  // Save uploads to Firebase
  const saveUploadsToFirebase = async (uploadsData) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        uploads: uploadsData,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving uploads to Firebase:", error);
    }
  };


  const isImageFile = (mimeType, filename) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    
    if (mimeType && imageTypes.some(type => mimeType.toLowerCase().includes(type))) {
      return true;
    }
    
    if (filename && imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))) {
      return true;
    }
    
    return false;
  };

  // Function to convert image to PDF
  const convertImageToPDF = async (imageFile, docId, fileIndex) => {
  try {
    setIsConvertingToPDF(prev => ({
      ...prev,
      [`${docId}_${fileIndex}`]: true
    }));

    // อ่านรูปภาพเป็น base64
    const base64Image = await FileSystem.readAsStringAsync(imageFile.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const mimeType = imageFile.mimeType || 'image/jpeg';
    const base64DataUri = `data:${mimeType};base64,${base64Image}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              @page {
                margin: 0;
                size: A4;
              }
              body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
              }
          </style>
      </head>
      <body>
          <img src="${base64DataUri}" />
      </body>
      </html>
    `;

    // แปลง HTML เป็น PDF
    const { uri: pdfUri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    const pdfInfo = await FileSystem.getInfoAsync(pdfUri);
    const originalName = imageFile.filename || imageFile.name || 'image';
    const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');

    // สร้างอ็อบเจกต์ไฟล์ PDF ใหม่ พร้อมคุณสมบัติที่จำเป็นทั้งหมด
    const pdfFile = {
      filename: `${nameWithoutExtension}_converted.pdf`,
      uri: pdfUri,
      mimeType: 'application/pdf',
      size: pdfInfo.size,
      uploadDate: new Date().toLocaleString("th-TH"),
      status: "pending",
      ocrValidated: docId === "form_101",
      fileIndex: fileIndex,
      convertedFromImage: true,
      originalImageName: imageFile.filename ?? null,
      originalImageType: imageFile.mimeType ?? null,
    };

    return pdfFile;

  } catch (error) {
    console.error('Error converting image to PDF:', error);
    throw new Error(`ไม่สามารถแปลงรูปภาพเป็น PDF ได้: ${error.message}`);
  } finally {
    setIsConvertingToPDF(prev => {
      const newState = { ...prev };
      delete newState[`${docId}_${fileIndex}`];
      return newState;
    });
  }
};


  // OCR validation function
  const performOCRValidation = async (file, docId) => {
    if (!ocrBackendAvailable) {
      Alert.alert(
        "ระบบ OCR ไม่พร้อมใช้งาน",
        "ไม่สามารถตรวจสอบเอกสารได้ในขณะนี้ คุณสามารถดำเนินการต่อได้",
        [{ text: "ตกลง" }]
      );
      return true; // Allow to continue if OCR is not available
    }

    setIsValidatingOCR((prev) => ({ ...prev, [docId]: true }));

    try {
      const validationResult = await validateForm101Document(file.uri);

      return new Promise((resolve) => {
        showValidationAlert(
          validationResult,
          () => {
            console.log("✓ OCR Validation passed for", file.name);
            resolve(true);
          },
          () => {
            console.log("✗ OCR Validation failed for", file.name);
            resolve(false);
          }
        );
      });
    } catch (error) {
      console.error("OCR validation error:", error);
      Alert.alert(
        "เกิดข้อผิดพลาดในการตรวจสอบ",
        `ไม่สามารถตรวจสอบเอกสารได้: ${error.message}\nคุณต้องการดำเนินการต่อหรือไม่?`,
        [
          { text: "ลองใหม่", style: "cancel", onPress: () => resolve(false) },
          { text: "ดำเนินการต่อ", onPress: () => resolve(true) },
        ]
      );
      return false;
    } finally {
      setIsValidatingOCR((prev) => {
        const newState = { ...prev };
        delete newState[docId];
        return newState;
      });
    }
  };

  // Upload file to Firebase Storage
  const uploadFileToStorage = async (
    file,
    docId,
    fileIndex,
    userId,
    studentName,
    config
) => {
    try {
        const sanitizedStudentName = (studentName ?? 'Unknown_Student')
            .replace(/[.#$[\]/\\]/g, "_")
            .replace(/\s+/g, "_");
        const timestamp = new Date().getTime();
        
        // Use PDF extension for converted files, or original extension
        const fileExtension = file.convertedFromImage ? 'pdf' : (file.filename?.split(".").pop() || 'unknown');
        
        const academicYear = config?.academicYear || "2568";
        const term = config?.term || "1";
        const storagePath = `student_documents/${sanitizedStudentName}/${academicYear}/term_${term}/${docId}_${fileIndex}_${timestamp}.${fileExtension}`;
        
        const response = await fetch(file.uri);
        const blob = await response.blob();
        
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, blob);
        
        return new Promise((resolve, reject) => {
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setStorageUploadProgress((prev) => ({
                        ...prev,
                        [`${docId}_${fileIndex}`]: Math.round(progress),
                    }));
                },
                (error) => {
                    console.error("Upload error:", error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        setStorageUploadProgress((prev) => {
                            const newState = { ...prev };
                            delete newState[`${docId}_${fileIndex}`];
                            return newState;
                        });
                        
                        // ตรวจสอบและแทนที่ค่า undefined ด้วย null
                        resolve({
                            downloadURL: downloadURL ?? null,
                            storagePath: storagePath ?? null,
                            uploadedAt: new Date().toISOString() ?? null,
                            originalFileName: file.filename ?? null,
                            fileSize: file.size ?? null,
                            mimeType: file.mimeType ?? null,
                            academicYear: academicYear ?? null,
                            term: term ?? null,
                            studentFolder: sanitizedStudentName ?? null,
                            // เพิ่ม conversion metadata ถ้ามี
                            ...(file.convertedFromImage && {
                                convertedFromImage: true,
                                originalImageName: file.originalImageName ?? null,
                                originalImageType: file.originalImageType ?? null,
                            }),
                        });
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    } catch (error) {
        console.error("Error in uploadFileToStorage:", error);
        throw error;
    }
  };

  // Delete survey data
  const deleteSurveyData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        survey: deleteField(),
        uploads: deleteField(),
      });
    } catch (error) {
      console.error("Error deleting survey data: ", error);
      Alert.alert("Error", "Failed to delete survey data.");
    }
  };

  // Handle retake survey
  const handleRetakeSurvey = () => {
    Alert.alert(
      "ทำแบบสอบถามใหม่",
      "การทำแบบสอบถามใหม่จะลบข้อมูลและไฟล์ที่อัปโหลดทั้งหมด\nคุณแน่ใจหรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ตกลง",
          style: "destructive",
          onPress: async () => {
            await deleteSurveyData();
            setSurveyData(null);
            setUploads({});
            setUploadProgress({});
            setStorageUploadProgress({});
          },
        },
      ]
    );
  };

  // Handle start survey
  const handleStartSurvey = () => {
    navigation.navigate("Document Reccommend", {
      onSurveyComplete: (data) => {
        setSurveyData(data);
      },
    });
  };

  const handleFileUpload = async (docId, allowMultiple = true) => {
  try {
    const DocumentPicker = await import("expo-document-picker");
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: allowMultiple,
    });

    if (result.canceled) return;

    const files = result.assets;
    const processedFiles = [];

    if (docId === 'form_101') {
      if (files.length > 4) {
        Alert.alert("ข้อผิดพลาด", "เอกสาร Form 101 สามารถอัปโหลดได้สูงสุด 4 ไฟล์เท่านั้น");
        return;
      }
      
      const imagesToProcess = files.filter(file => isImageFile(file.mimeType, file.name));
      const otherFiles = files.filter(file => !isImageFile(file.mimeType, file.name));

      for (const file of otherFiles) {
        processedFiles.push({
          filename: file.name ?? null,
          uri: file.uri ?? null,
          mimeType: file.mimeType ?? null,
          size: file.size ?? null,
          uploadDate: new Date().toLocaleString("th-TH"),
          status: "pending",
          ocrValidated: true,
          fileIndex: (uploads[docId] || []).length + processedFiles.length,
        });
      }

      if (imagesToProcess.length > 0) {
        setIsConvertingToPDF(prev => ({
          ...prev,
          [`${docId}_merge`]: true
        }));
        
        try {
          const mergedPdfFile = await mergeImagesToPdf(imagesToProcess, docId);
          processedFiles.push(mergedPdfFile);
        } catch (error) {
          console.error("Error merging images to PDF:", error);
          Alert.alert("ข้อผิดพลาด", `ไม่สามารถรวมรูปภาพเป็น PDF ได้: ${error.message}`);
          setIsConvertingToPDF(prev => {
            const newState = { ...prev };
            delete newState[`${docId}_merge`];
            return newState;
          });
          return;
        } finally {
          setIsConvertingToPDF(prev => {
            const newState = { ...prev };
            delete newState[`${docId}_merge`];
            return newState;
          });
        }
      }

    } else {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let processedFile = file;
        let originalMetadata = {
          filename: file.filename ?? file.name ?? null,
          mimeType: file.mimeType ?? null,
          size: file.size ?? null,
          uri: file.uri ?? null,
        };

        if (isImageFile(file.mimeType, file.name)) {
          try {
            // รับค่าจากฟังก์ชัน convertImageToPDF
            const convertedPdf = await convertImageToPDF(file, docId, i);
            // ผสานข้อมูลจากไฟล์ต้นฉบับและไฟล์ที่แปลงแล้ว
            processedFile = {
              ...originalMetadata,
              ...convertedPdf,
              filename: convertedPdf.filename, // ใช้ชื่อไฟล์ที่แปลงแล้ว
              mimeType: 'application/pdf',    // แก้ไข mimeType เป็น PDF
            };
          } catch (conversionError) {
            console.error('PDF conversion failed:', conversionError);
            Alert.alert("การแปลงล้มเหลว", `ไม่สามารถแปลงไฟล์ "${file.name ?? 'ไม่ทราบชื่อไฟล์'}" เป็น PDF ได้ จะใช้ไฟล์ต้นฉบับแทน`);
            processedFile = file;
          }
        } else {
            processedFile = originalMetadata;
        }
        
        if (docId === "another_ocr_doc") {
            const isValid = await performOCRValidation(processedFile, docId);
            if (!isValid) {
              continue;
            }
        }

        const fileWithMetadata = {
          // ตรวจสอบและกำหนดค่าเริ่มต้นให้กับทุกคุณสมบัติ
          filename: processedFile.filename ?? null,
          uri: processedFile.uri ?? null,
          mimeType: processedFile.mimeType ?? null,
          size: processedFile.size ?? null,
          uploadDate: new Date().toLocaleString("th-TH"),
          status: "pending",
          ocrValidated: docId === "form_101",
          fileIndex: (uploads[docId] || []).length + processedFiles.length,
          ...(processedFile.convertedFromImage !== undefined && {
            convertedFromImage: processedFile.convertedFromImage ?? false,
            originalImageName: processedFile.originalImageName ?? null,
            originalImageType: processedFile.originalImageType ?? null,
          }),
        };

        processedFiles.push(fileWithMetadata);
      }
    }
    
    const newUploads = {
      ...uploads,
      [docId]: [...(uploads[docId] || []), ...processedFiles],
    };

    setUploads(newUploads);
    await saveUploadsToFirebase(newUploads);

  } catch (error) {
    Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเลือกไฟล์ได้");
    console.error(error);
  }
};

  // Updated: Handle remove specific file from document
  const handleRemoveFile = async (docId, fileIndex = null) => {
    const docFiles = uploads[docId] || [];
    
    if (fileIndex !== null && fileIndex >= 0 && fileIndex < docFiles.length) {
      // Remove specific file
      const fileToRemove = docFiles[fileIndex];
      Alert.alert(
        "ลบไฟล์",
        `คุณต้องการลบไฟล์ "${fileToRemove.filename}" หรือไม่?`,
        [
          { text: "ยกเลิก", style: "cancel" },
          {
            text: "ลบ",
            style: "destructive",
            onPress: async () => {
              const newFiles = docFiles.filter((_, index) => index !== fileIndex);
              
              // Clean up temporary PDF files if they were converted from images
              if (fileToRemove.originalImage && fileToRemove.uri) {
                try {
                  await FileSystem.deleteAsync(fileToRemove.uri, { idempotent: true });
                  console.log('✓ Cleaned up temporary PDF file');
                } catch (cleanupError) {
                  console.warn('Could not clean up temporary file:', cleanupError);
                }
              }
              
              const newUploads = { ...uploads };
              if (newFiles.length === 0) {
                delete newUploads[docId];
              } else {
                // Re-index remaining files
                newFiles.forEach((file, index) => {
                  file.fileIndex = index;
                });
                newUploads[docId] = newFiles;
              }
              
              setUploads(newUploads);
              await saveUploadsToFirebase(newUploads);
              handleCloseModal();
            },
          },
        ]
      );
    } else {
      // Remove all files for this document
      Alert.alert(
        "ลบไฟล์ทั้งหมด",
        `คุณต้องการลบไฟล์ทั้งหมด (${docFiles.length} ไฟล์) สำหรับเอกสารนี้หรือไม่?`,
        [
          { text: "ยกเลิก", style: "cancel" },
          {
            text: "ลบทั้งหมด",
            style: "destructive",
            onPress: async () => {
              // Clean up temporary PDF files
              for (const file of docFiles) {
                if (file.originalImage && file.uri) {
                  try {
                    await FileSystem.deleteAsync(file.uri, { idempotent: true });
                  } catch (cleanupError) {
                    console.warn('Could not clean up temporary file:', cleanupError);
                  }
                }
              }
              
              const newUploads = { ...uploads };
              delete newUploads[docId];
              setUploads(newUploads);
              await saveUploadsToFirebase(newUploads);
              handleCloseModal();
            },
          },
        ]
      );
    }
  };

  const handleSubmitDocuments = async () => {
    const documents = generateDocumentsList(surveyData);
    const requiredDocs = documents.filter((doc) => doc.required);
    const uploadedRequiredDocs = requiredDocs.filter((doc) => uploads[doc.id] && uploads[doc.id].length > 0);

    if (uploadedRequiredDocs.length < requiredDocs.length) {
      Alert.alert(
        "เอกสารไม่ครบ",
        `คุณยังอัปโหลดเอกสารไม่ครบ (${uploadedRequiredDocs.length}/${requiredDocs.length})`,
        [{ text: "ตกลง" }]
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("เกิดข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้");
        setIsSubmitting(false);
        return;
      }

      let studentName = "Unknown_Student";
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          studentName =
            userData.profile?.student_name ||
            userData.name ||
            userData.nickname ||
            "Unknown_Student";
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }

      const storageUploads = {};
      const academicYear = appConfig?.academicYear || "2568";
      const term = appConfig?.term || "1";
      
      // อัปโหลดไฟล์ทั้งหมดสำหรับแต่ละเอกสาร และรอจนกว่าจะเสร็จ
      for (const [docId, files] of Object.entries(uploads)) {
        const uploadedFiles = [];
        
        for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
          const file = files[fileIndex];
          try {
            const storageData = await uploadFileToStorage(
              file,
              docId,
              fileIndex,
              currentUser.uid,
              studentName,
              appConfig
            );

            // ผสานข้อมูลที่ได้จากการอัปโหลดกับข้อมูลต้นฉบับที่อยู่ใน state และตรวจสอบค่า undefined
            uploadedFiles.push({
              filename: storageData.originalFileName ?? null,
              mimeType: storageData.mimeType ?? null,
              size: storageData.fileSize ?? null,
              downloadURL: storageData.downloadURL ?? null,
              storagePath: storageData.storagePath ?? null,
              uploadedAt: storageData.uploadedAt ?? null,
              storageUploaded: true,
              status: "uploaded_to_storage",
              fileIndex: fileIndex,
              convertedFromImage: storageData.convertedFromImage ?? false,
              originalImageName: storageData.originalImageName ?? null,
              originalImageType: storageData.originalImageType ?? null,
            });

          } catch (error) {
            console.error(
              `Failed to upload file ${file.filename}:`,
              error
            );
            Alert.alert(
              "ข้อผิดพลาดในการอัปโหลด",
              `ไม่สามารถอัปโหลดไฟล์ ${file.filename} ได้: ${error.message}`
            );
            setIsSubmitting(false);
            return;
          }
        }
        
        storageUploads[docId] = uploadedFiles;
      }
      
      const submissionData = {
        userId: currentUser.uid ?? null,
        userEmail: currentUser.email ?? null,
        surveyData: surveyData ?? null,
        uploads: storageUploads ?? {},
        submittedAt: new Date().toISOString() ?? null,
        status: "submitted" ?? null,
        academicYear: academicYear ?? null,
        term: term ?? null,
        submissionTerm: `${academicYear}_${term}` ?? null,
      };

      submissionData.documentStatuses = {};
      Object.keys(storageUploads).forEach((docId) => {
        submissionData.documentStatuses[docId] = {
          status: "pending",
          reviewedAt: null,
          reviewedBy: null,
          comments: "",
          fileCount: storageUploads[docId].length,
        };
      });

      const submissionRef = doc(
        db,
        `document_submissions_${academicYear}_${term}`,
        currentUser.uid
      );
      await setDoc(submissionRef, submissionData);

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        lastSubmissionAt: new Date().toISOString() ?? null,
        hasSubmittedDocuments: true,
        uploads: storageUploads ?? {},
        lastSubmissionTerm: `${academicYear}_${term}` ?? null,
      });

      const totalFiles = Object.values(storageUploads).reduce(
        (sum, files) => sum + files.length, 0
      );
      const convertedFiles = Object.values(storageUploads)
        .flat()
        .filter(file => file.convertedFromImage).length;

      let successMessage = `เอกสารของคุณได้ถูกส่งและอัปโหลดเรียบร้อยแล้ว\nจำนวนไฟล์: ${totalFiles} ไฟล์`;
      if (convertedFiles > 0) {
        successMessage += `\nไฟล์ที่แปลงเป็น PDF: ${convertedFiles} ไฟล์`;
      }
      successMessage += `\nปีการศึกษา: ${academicYear} เทอม: ${term}\nคุณสามารถติดตามได้ในหน้าแสดงผล`;

      Alert.alert(
        "ส่งเอกสารสำเร็จ",
        successMessage,
        [
          {
            text: "ดูสถานะ",
            onPress: () => {
              navigation.push("DocumentStatusScreen", {
                submissionData: submissionData,
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting documents:", error);
      Alert.alert(
        "เกิดข้อผิดพลาด",
        `ไม่สามารถส่งเอกสารได้: ${error.message}\nกรุณาลองใหม่อีกครั้ง`
      );
    } finally {
      setIsSubmitting(false);
      setStorageUploadProgress({});
    }
};

  // Updated: Modal handlers for multiple files
  const handleShowFileModal = async (docId, docTitle, fileIndex = 0) => {
    const files = uploads[docId];
    if (files && files[fileIndex]) {
      setSelectedFile(files[fileIndex]);
      setSelectedDocTitle(`${docTitle} (${fileIndex + 1}/${files.length})`);
      setSelectedFileIndex(fileIndex);
      setShowFileModal(true);
      setIsLoadingContent(true);
      try {
        await loadFileContent(files[fileIndex]);
      } catch (error) {
        console.error("Error loading file content:", error);
        Alert.alert("ข้อผิดพลาด", "ไม่สามารถโหลดเนื้อหาไฟล์ได้");
      } finally {
        setIsLoadingContent(false);
      }
    }
  };

  const loadFileContent = async (file) => {
    try {
      const mimeType = file.mimeType?.toLowerCase() || "";
      const fileName = file.filename?.toLowerCase() || "";

      if (
        mimeType.startsWith("image/") ||
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg") ||
        fileName.endsWith(".png") ||
        fileName.endsWith(".gif") ||
        fileName.endsWith(".bmp") ||
        fileName.endsWith(".webp")
      ) {
        setContentType("image");
        setFileContent(file.uri);
      } else if (
        mimeType.includes("text/") ||
        mimeType.includes("json") ||
        fileName.endsWith(".txt") ||
        fileName.endsWith(".json")
      ) {
        setContentType("text");
        const content = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        setFileContent(content);
      } else if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) {
        setContentType("pdf");
        let pdfMessage = 'ไฟล์ PDF ต้องใช้แอปพลิเคชันภายนอกในการดู คลิก "เปิดด้วยแอปภายนอก" เพื่อดูไฟล์';
        
        // Add info about converted files
        if (file.originalImage) {
          pdfMessage = `ไฟล์ PDF ที่แปลงมาจากรูปภาพ\n(ไฟล์ต้นฉบับ: ${file.originalImageName})\n\n${pdfMessage}`;
        }
        
        setFileContent(pdfMessage);
      } else {
        setContentType("other");
        setFileContent(
          `ไฟล์ประเภท ${mimeType || "ไม่ทราบ"} ไม่สามารถแสดงผลในแอปได้`
        );
      }
    } catch (error) {
      console.error("Error reading file:", error);
      setContentType("error");
      setFileContent("ไม่สามารถอ่านไฟล์นี้ได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleCloseModal = () => {
    setShowFileModal(false);
    setSelectedFile(null);
    setSelectedDocTitle("");
    setSelectedFileIndex(0);
    setFileContent(null);
    setContentType("");
    setIsLoadingContent(false);
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleOpenUploadedFile = async (file) => {
    try {
      if (!file?.uri) return;
      const Sharing = await import("expo-sharing");
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "ไม่สามารถเปิดไฟล์ได้",
          "อุปกรณ์ของคุณไม่รองรับการเปิดไฟล์นี้"
        );
        return;
      }
      await Sharing.shareAsync(file.uri);
    } catch (error) {
      console.error(error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเปิดไฟล์นี้ได้");
    }
  };

  // Updated: Utility functions for multiple files
  const getUploadStats = () => {
    const documents = generateDocumentsList(surveyData);
    const requiredDocs = documents.filter((doc) => doc.required);
    const uploadedDocs = documents.filter((doc) => uploads[doc.id] && uploads[doc.id].length > 0);
    const uploadedRequiredDocs = requiredDocs.filter((doc) => uploads[doc.id] && uploads[doc.id].length > 0);
    
    // Count total files
    const totalFiles = Object.values(uploads).reduce((sum, files) => sum + files.length, 0);
    
    // Count converted files
    const convertedFiles = Object.values(uploads)
      .flat()
      .filter(file => file.originalImage).length;
    
    return {
      total: documents.length,
      required: requiredDocs.length,
      uploaded: uploadedDocs.length,
      uploadedRequired: uploadedRequiredDocs.length,
      totalFiles: totalFiles,
      convertedFiles: convertedFiles,
    };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Render logic
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!surveyData) {
    return <EmptyState onStartSurvey={handleStartSurvey} />;
  }

  const documents = generateDocumentsList(surveyData);
  const stats = getUploadStats();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HeaderSection
        surveyData={surveyData}
        onRetakeSurvey={handleRetakeSurvey}
      />

      {appConfig && <TermInfoCard appConfig={appConfig} />}

      <ProgressCard stats={stats} />

      {(Object.keys(storageUploadProgress).length > 0 || Object.keys(isConvertingToPDF).length > 0) && (
        <StorageProgressCard
          storageUploadProgress={storageUploadProgress}
          uploads={uploads}
          isConvertingToPDF={isConvertingToPDF}
        />
      )}

      <DocumentsSection
        documents={documents}
        uploads={uploads}
        onFileUpload={handleFileUpload}
        onRemoveFile={handleRemoveFile}
        onShowFileModal={handleShowFileModal}
        onDownloadDocument={handleDocumentDownload}
        formatFileSize={formatFileSize}
        isValidatingOCR={isValidatingOCR}
        ocrBackendAvailable={ocrBackendAvailable}
        isConvertingToPDF={isConvertingToPDF}
      />

      <SubmitSection
        stats={stats}
        isSubmitting={isSubmitting}
        storageUploadProgress={storageUploadProgress}
        onSubmit={handleSubmitDocuments}
      />

      <FileDetailModal
        visible={showFileModal}
        onClose={handleCloseModal}
        selectedFile={selectedFile}
        selectedDocTitle={selectedDocTitle}
        fileContent={fileContent}
        contentType={contentType}
        isLoadingContent={isLoadingContent}
        formatFileSize={formatFileSize}
        handleOpenUploadedFile={handleOpenUploadedFile}
        handleRemoveFile={handleRemoveFile}
        imageZoom={imageZoom}
        setImageZoom={setImageZoom}
        setImagePosition={setImagePosition}
        loadFileContent={loadFileContent}
        // New props for multiple files navigation
        selectedFileIndex={selectedFileIndex}
        totalFiles={uploads[selectedFile?.docId]?.length || 0}
        onNavigateFile={(direction) => {
          const currentDocFiles = uploads[selectedFile?.docId] || [];
          const newIndex = direction === 'next' 
            ? Math.min(selectedFileIndex + 1, currentDocFiles.length - 1)
            : Math.max(selectedFileIndex - 1, 0);
          handleShowFileModal(selectedFile?.docId, selectedDocTitle.split(' (')[0], newIndex);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
});

export default UploadScreen;
