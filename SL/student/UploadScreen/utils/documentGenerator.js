// documentGenerator.js - Document list generator and handler
import { Alert, Linking } from "react-native";
import { InsertForm101 } from "../../documents/InsertForm101";
import { ConsentFrom_student } from "../../documents/ConsentFrom_student";
import { ConsentFrom_father } from "../../documents/ConsentFrom_father";
import { ConsentFrom_mother } from "../../documents/ConsentFrom_mother";
import { Income102 } from "../../documents/income102";
import { FamStatus_cert } from "../../documents/FamStatus_cert";

/**
 * Generate documents list based on survey data
 * @param {Object} data - Survey data from the user
 * @returns {Array} Array of document objects
 */
export const generateDocumentsList = (data) => {
  if (!data) return [];

  let documents = [];

  // Base required documents for all users
  documents.push(
    {
      id: "form_101",
      title: "แบบฟอร์ม กศ. 101",
      description: "กรอกข้อมูลตามจริงให้ครบถ้วน ก่อนอัพโหลดเอกสาร",
      required: true,
    },
    {
      id: "volunteer_doc",
      title: "เอกสารจิตอาสา",
      description: "กิจกรรมในปีการศึกษา 2567 อย่างน้อย 1 รายการ",
      required: true,
    },
    {
      id: "consent_student_form",
      title: "หนังสือยินยอมเปิดเผยข้อมูลของผู้กู้",
      description: "กรอกข้อมูลตามจริงให้ครบถ้วน ก่อนอัพโหลดเอกสาร",
      required: true,
    },
    {
      id: "id_copies_student",
      title: "สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของผู้กู้",
      description: "บัตรประชาชนต้องไม่หมดอายุ",
      required: true,
    }
  );

  // Documents based on family status
  if (data.familyStatus === "ก") {
    // Both parents alive
    documents.push(
      {
        id: "consent_father_form",
        title: "หนังสือยินยอมเปิดเผยข้อมูลของบิดา",
        description: "กรอกข้อมูลตามจริงให้ครบถ้วน ก่อนอัพโหลดเอกสาร",
        required: true,
      },
      {
        id: "id_copies_father",
        title: "สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของบิดา",
        description: "บัตรประชาชนต้องไม่หมดอายุ",
        required: true,
      },
      {
        id: "consent_mother_form",
        title: "หนังสือยินยอมเปิดเผยข้อมูลของมารดา",
        description: "กรอกข้อมูลตามจริงให้ครบถ้วน ก่อนอัพโหลดเอกสาร",
        required: true,
      },
      {
        id: "id_copies_mother",
        title: "สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของมารดา",
        description: "บัตรประชาชนต้องไม่หมดอายุ",
        required: true,
      }
    );

    // Income documents for both parents
    if (
      data.fatherIncome !== "มีรายได้ประจำ" &&
      data.motherIncome !== "มีรายได้ประจำ"
    ) {
      documents.push(
        {
          id: "famo_income_cert",
          title: "หนังสือรับรองรายได้ กศ. 102 ของบิดา มารดา",
          description: "กรอกข้อมูลตามจริงให้ครบถ้วน ก่อนอัพโหลดเอกสาร",
          required: true,
        },
        {
          id: "famo_id_copies_gov",
          title: "สำเนาบัตรข้าราชการผู้รับรอง",
          description: "สำหรับรับรองรายได้ เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น",
          required: true,
        }
      );
    } else {
      // Individual income documents
      if (data.fatherIncome === "มีรายได้ประจำ") {
        documents.push({
          id: "father_income",
          title: "หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของบิดา",
          description: "เอกสารอายุไม่เกิน 3 เดือน",
          required: true,
        });
      } else {
        documents.push(
          {
            id: "father_income_cert",
            title: "หนังสือรับรองรายได้ กศ. 102 ของบิดา",
            description: "กรอกข้อมูลตามจริงให้ครบถ้วน ก่อนอัพโหลดเอกสาร",
            required: true,
          },
          {
            id: "fa_id_copies_gov",
            title: "สำเนาบัตรข้าราชการผู้รับรอง",
            description:
              "สำหรับรับรองรายได้ เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น",
            required: true,
          }
        );
      }

      if (data.motherIncome === "มีรายได้ประจำ") {
        documents.push({
          id: "mother_income",
          title: "หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของมารดา",
          description: "เอกสารอายุไม่เกิน 3 เดือน",
          required: true,
        });
      } else {
        documents.push(
          {
            id: "mother_income_cert",
            title: "หนังสือรับรองรายได้ กศ. 102 ของมารดา",
            description: "กรอกข้อมูลตามจริงให้ครบถ้วน ก่อนอัพโหลดเอกสาร",
            required: true,
          },
          {
            id: "ma_id_copies_gov",
            title: "สำเนาบัตรข้าราชการผู้รับรอง",
            description:
              "สำหรับรับรองรายได้ เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น",
            required: true,
          }
        );
      }
    }
  } else if (data.familyStatus === "ข") {
    // Single parent
    let parent = data.livingWith === "บิดา" ? "บิดา" : "มารดา";
    let consentFormId =
      data.livingWith === "บิดา"
        ? "consent_father_form"
        : "consent_mother_form";

    documents.push(
      {
        id: consentFormId,
        title: `หนังสือยินยอมเปิดเผยข้อมูลของ ${parent}`,
        description: "กรอกข้อมูลตามจริงให้ครบถ้วน ก่อนอัพโหลดเอกสาร",
        required: true,
      },
      {
        id: `id_copies_${consentFormId}`,
        title: `สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของ ${parent}`,
        description: "บัตรประชาชนต้องไม่หมดอายุ",
        required: true,
      }
    );

    if (data.legalStatus === "มีเอกสาร") {
      documents.push({
        id: "legal_status",
        title: "สำเนาใบหย่า (กรณีหย่าร้าง) หรือ สำเนาใบมรณบัตร (กรณีเสียชีวิต)",
        required: true,
      });
    } else {
      documents.push(
        {
          id: "family_status_cert",
          title: "หนังสือรับรองสถานภาพครอบครัว",
          description: "กรอกข้อมูลตามจริงให้ครบถ้วน ก่อนอัพโหลดเอกสาร",
          required: true,
        },
        {
          id: "fam_id_copies_gov",
          title: "สำเนาบัตรข้าราชการผู้รับรอง",
          description:
            "สำหรับรับรองสถานภาพครอบครัว เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น",
          required: true,
        }
      );
    }

    // Income documents for single parent
    const hasIncome =
      (data.livingWith === "บิดา" && data.fatherIncome === "มีรายได้ประจำ") ||
      (data.livingWith === "มารดา" && data.motherIncome === "มีรายได้ประจำ");

    if (hasIncome) {
      documents.push({
        id: "single_parent_income",
        title: `หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของ${parent}`,
        description: "เอกสารอายุไม่เกิน 3 เดือน",
        required: true,
      });
    } else {
      documents.push(
        {
          id: "single_parent_income_cert",
          title: `หนังสือรับรองรายได้ กศ. 102 ของ${parent}`,
          required: true,
        },
        {
          id: "102_id_copies_gov",
          title: "สำเนาบัตรข้าราชการผู้รับรอง",
          description: `สำหรับรับรองรายได้ของ${parent}  เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น`,
          required: true,
        }
      );
    }
  } else if (data.familyStatus === "ค") {
    // Guardian
    documents.push(
      {
        id: "guardian_consent",
        title: "หนังสือยินยอมเปิดเผยข้อมูล ของผู้ปกครอง",
        description: "กรอกข้อมูลตามจริงให้ครบถ้วน ก่อนอัพโหลดเอกสาร",
        required: true,
      },
      {
        id: "guardian_id_copies",
        title: "สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้อง ของผู้ปกครอง",
        description: "บัตรประชาชนต้องไม่หมดอายุ",
        required: true,
      }
    );

    if (data.guardianIncome === "มีรายได้ประจำ") {
      documents.push({
        id: "guardian_income",
        title: "หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของผู้ปกครอง",
        description: "เอกสารอายุไม่เกิน 3 เดือน",
        required: true,
      });
    } else {
      documents.push(
        {
          id: "guardian_income_cert",
          title: "หนังสือรับรองรายได้ กศ. 102 ของผู้ปกครอง",
          description: "กรอกข้อมูลตามจริงให้ครบถ้วน ก่อนอัพโหลดเอกสาร",
          required: true,
        },
        {
          id: "guar_id_copies_gov",
          title: "สำเนาบัตรข้าราชการผู้รับรอง",
          description: "สำหรับรับรองรายได้ เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น",
          required: true,
        }
      );
    }

    if (data.LegalStatus === "มีเอกสาร") {
      documents.push({
        id: "legal_status",
        title: "สำเนาใบหย่า (กรณีหย่าร้าง) หรือ สำเนาใบมรณบัตร (กรณีเสียชีวิต)",
        description: "",
        required: true,
      });
    }

    documents.push(
      {
        id: "family_status_cert",
        title: "หนังสือรับรองสถานภาพครอบครัว",
        description: "กรอกข้อมูลตามจริงให้ครบถ้วน ก่อนอัพโหลดเอกสาร",
        required: true,
      },
      {
        id: "fam_id_copies_gov",
        title: "สำเนาบัตรข้าราชการผู้รับรอง",
        description:
          "สำหรับรับรองสถานภาพครอบครัว เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น",
        required: true,
      }
    );
  }

  return documents;
};

/**
 * Handle document download based on document type
 * @param {string} docId - Document ID
 * @param {string} downloadUrl - Optional download URL for external documents
 */
export const handleDownloadDocument = (docId, downloadUrl = null) => {
  if (docId === "form_101") {
    // สำหรับแบบฟอร์ม กศ.101 ให้เรียกใช้ฟังก์ชันสร้าง PDF
    InsertForm101();
  } else if (docId === "consent_student_form") {
    ConsentFrom_student();
  } else if (docId === "consent_father_form") {
    ConsentFrom_father();
  } else if (docId === "consent_mother_form") {
    ConsentFrom_mother();
  } else if (
    [
      "guardian_income_cert",
      "father_income_cert",
      "mother_income_cert",
      "single_parent_income_cert",
      "famo_income_cert",
    ].includes(docId)
  ) {
    Income102();
  } else if (docId === "family_status_cert") {
    FamStatus_cert();
  } else if (downloadUrl) {
    // สำหรับเอกสารอื่นๆ ที่มีลิงค์ ให้เปิดลิงค์นั้น
    Linking.openURL(downloadUrl).catch(() =>
      Alert.alert("ไม่สามารถดาวน์โหลดไฟล์ได้")
    );
  } else {
    Alert.alert("ไม่พบไฟล์", "ไม่สามารถดาวน์โหลดไฟล์นี้ได้ในขณะนี้");
  }
};

/**
 * Get list of document IDs that can generate forms
 * @returns {Array} Array of document IDs that have downloadable forms
 */
export const getGeneratableDocuments = () => {
  return [
    "form_101",
    "consent_student_form",
    "consent_father_form",
    "consent_mother_form",
    "guardian_income_cert",
    "father_income_cert",
    "mother_income_cert",
    "single_parent_income_cert",
    "famo_income_cert",
    "family_status_cert",
  ];
};

/**
 * Check if a document can be generated/downloaded
 * @param {string} docId - Document ID to check
 * @returns {boolean} True if document can be generated
 */
export const canGenerateDocument = (docId) => {
  return getGeneratableDocuments().includes(docId);
};
