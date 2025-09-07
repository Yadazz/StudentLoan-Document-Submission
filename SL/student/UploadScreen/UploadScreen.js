// UploadScreen.js (Main component - refactored with OCR validation)
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
  const [uploads, setUploads] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocTitle, setSelectedDocTitle] = useState("");
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
          setUploads(userData.uploads);
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
            console.log("✓ OCR Validation passed for", file.filename);
            resolve(true);
          },
          () => {
            console.log("✗ OCR Validation failed for", file.filename);
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
    userId,
    studentName,
    config
  ) => {
    try {
      const sanitizedStudentName = studentName
        .replace(/[.#$[\]/\\]/g, "_")
        .replace(/\s+/g, "_");
      const timestamp = new Date().getTime();
      const fileExtension = file.filename.split(".").pop();

      const academicYear = config?.academicYear || "2568";
      const term = config?.term || "1";
      const storagePath = `student_documents/${sanitizedStudentName}/${academicYear}/term_${term}/${docId}_${timestamp}.${fileExtension}`;

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
              [docId]: Math.round(progress),
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
                delete newState[docId];
                return newState;
              });

              resolve({
                downloadURL,
                storagePath,
                uploadedAt: new Date().toISOString(),
                originalFileName: file.filename,
                fileSize: file.size,
                mimeType: file.mimeType,
                academicYear: academicYear,
                term: term,
                studentFolder: sanitizedStudentName,
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
      const userSurveyRef = doc(db, "users", currentUser.uid);
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

  // Handle file upload with OCR validation
  const handleFileUpload = async (docId) => {
    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];

      // Check if this is a Form 101 document that needs OCR validation
      if (docId === "form_101") {
        const isValid = await performOCRValidation(file, docId);
        if (!isValid) {
          return; // Stop upload if validation fails
        }
      }

      const newUploads = {
        ...uploads,
        [docId]: {
          filename: file.name,
          uri: file.uri,
          mimeType: file.mimeType,
          size: file.size,
          uploadDate: new Date().toLocaleString("th-TH"),
          status: "pending",
          ocrValidated: docId === "form_101", // Mark if OCR validated
        },
      };

      setUploads(newUploads);
      await saveUploadsToFirebase(newUploads);
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเลือกไฟล์ได้");
      console.error(error);
    }
  };

  // Handle remove file
  const handleRemoveFile = async (docId) => {
    Alert.alert("ลบไฟล์", "คุณต้องการลบไฟล์นี้หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          const newUploads = { ...uploads };
          delete newUploads[docId];
          setUploads(newUploads);
          await saveUploadsToFirebase(newUploads);
          handleCloseModal();
        },
      },
    ]);
  };

  // Handle submit documents
  const handleSubmitDocuments = async () => {
    const documents = generateDocumentsList(surveyData);
    const requiredDocs = documents.filter((doc) => doc.required);
    const uploadedRequiredDocs = requiredDocs.filter((doc) => uploads[doc.id]);

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

      const storageUploads = {};
      const uploadPromises = [];

      let studentName = "Unknown_Student";
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          studentName =
            userData.name ||
            userData.nickname ||
            `${userData.firstName || ""}_${userData.lastName || ""}`.replace(
              "_",
              ""
            ) ||
            "Unknown_Student";
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }

      for (const [docId, file] of Object.entries(uploads)) {
        const uploadPromise = uploadFileToStorage(
          file,
          docId,
          currentUser.uid,
          studentName,
          appConfig
        )
          .then((storageData) => {
            storageUploads[docId] = {
              ...file,
              ...storageData,
              storageUploaded: true,
              status: "uploaded_to_storage",
            };
          })
          .catch((error) => {
            throw new Error(
              `ไม่สามารถอัปโหลดไฟล์ ${file.filename} ได้: ${error.message}`
            );
          });

        uploadPromises.push(uploadPromise);
      }

      await Promise.all(uploadPromises);

      const submissionData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        surveyData: surveyData,
        uploads: storageUploads,
        submittedAt: new Date().toISOString(),
        status: "submitted",
        documentStatuses: {},
        academicYear: appConfig?.academicYear || "2568",
        term: appConfig?.term || "1",
        submissionTerm: `${appConfig?.academicYear || "2568"}_${
          appConfig?.term || "1"
        }`,
      };

      Object.keys(storageUploads).forEach((docId) => {
        submissionData.documentStatuses[docId] = {
          status: "pending",
          reviewedAt: null,
          reviewedBy: null,
          comments: "",
        };
      });

      const termCollectionName = `document_submissions_${
        appConfig?.academicYear || "2568"
      }_${appConfig?.term || "1"}`;
      const submissionRef = doc(
        collection(db, termCollectionName),
        currentUser.uid
      );
      await setDoc(submissionRef, submissionData);

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        lastSubmissionAt: new Date().toISOString(),
        hasSubmittedDocuments: true,
        uploads: storageUploads,
        lastSubmissionTerm: `${appConfig?.academicYear || "2568"}_${
          appConfig?.term || "1"
        }`,
      });

      Alert.alert(
        "ส่งเอกสารสำเร็จ",
        `เอกสารของคุณได้ถูกส่งและอัปโหลดเรียบร้อยแล้ว\nปีการศึกษา: ${
          appConfig?.academicYear || "2568"
        } เทอม: ${appConfig?.term || "1"}\nคุณสามารถติดตามได้ในหน้าแสดงผล`,
        [
          {
            text: "ดูสถานะ",
            onPress: () => {
              navigation.navigate("DocumentStatusScreen", {
                surveyData: surveyData,
                uploads: storageUploads,
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

  // Modal handlers
  const handleShowFileModal = async (docId, docTitle) => {
    const file = uploads[docId];
    if (file) {
      setSelectedFile(file);
      setSelectedDocTitle(docTitle);
      setShowFileModal(true);
      setIsLoadingContent(true);
      try {
        await loadFileContent(file);
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
      const FileSystem = await import("expo-file-system");
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
        setFileContent(
          'ไฟล์ PDF ต้องใช้แอปพลิเคชันภายนอกในการดู คลิก "เปิดด้วยแอปภายนอก" เพื่อดูไฟล์'
        );
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

  // Utility functions
  const getUploadStats = () => {
    const documents = generateDocumentsList(surveyData);
    const requiredDocs = documents.filter((doc) => doc.required);
    const uploadedDocs = documents.filter((doc) => uploads[doc.id]);
    const uploadedRequiredDocs = requiredDocs.filter((doc) => uploads[doc.id]);
    return {
      total: documents.length,
      required: requiredDocs.length,
      uploaded: uploadedDocs.length,
      uploadedRequired: uploadedRequiredDocs.length,
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

      {Object.keys(storageUploadProgress).length > 0 && (
        <StorageProgressCard
          storageUploadProgress={storageUploadProgress}
          uploads={uploads}
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
