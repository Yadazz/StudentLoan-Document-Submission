import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./database/firebase";

export default function StudentDocument() {
  const [loading, setLoading] = useState(true);
  const [documentSettings, setDocumentSettings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add", "edit", "view"
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form states
  const [formData, setFormData] = useState({
    semester: "1",
    academicYear: new Date().getFullYear() + 543, // ปี พ.ศ.
    isActive: false,
    startDate: "",
    endDate: "",
    startTime: "08:00",
    endTime: "17:00",
    description: "",
    createdAt: new Date(),
  });

  useEffect(() => {
    fetchDocumentSettings();

    // อัปเดตเวลาปัจจุบันทุกวินาที
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // ตรวจสอบและอัปเดตสถานะการเปิด-ปิดระบบทุก 30 วินาที
    const statusInterval = setInterval(() => {
      checkAndUpdateActiveStatus();
    }, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(statusInterval);
    };
  }, []);

  // ตรวจสอบและอัปเดตสถานะอัตโนมัติ
  const checkAndUpdateActiveStatus = async () => {
    try {
      const now = new Date();
      let hasUpdates = false;

      for (const setting of documentSettings) {
        const shouldBeActive = checkTimeInRange(setting, now);

        if (setting.isActive !== shouldBeActive) {
          await updateDoc(doc(db, "documentSettings", setting.id), {
            isActive: shouldBeActive,
            updatedAt: new Date(),
          });
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        await fetchDocumentSettings();
      }
    } catch (error) {
      console.error("Error auto-updating active status:", error);
    }
  };

  const fetchDocumentSettings = async () => {
    try {
      setLoading(true);

      // ตรวจสอบการเชื่อมต่อ Firebase
      if (!db) {
        throw new Error("ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
      }

      console.log("กำลังโหลดข้อมูล...");

      // แบบที่ 1: ใช้ single field ordering แล้วเรียงใน JavaScript
      const q = query(
        collection(db, "documentSettings"),
        orderBy("academicYear", "desc") // เรียงตามปีการศึกษาเท่านั้น
      );

      const querySnapshot = await getDocs(q);
      const settings = [];

      querySnapshot.forEach((doc) => {
        settings.push({ id: doc.id, ...doc.data() });
      });

      // เรียงข้อมูลใน JavaScript
      settings.sort((a, b) => {
        // เรียงตามปีการศึกษาก่อน (descending)
        if (a.academicYear !== b.academicYear) {
          return b.academicYear - a.academicYear;
        }
        // ถ้าปีเหมือนกัน เรียงตามเทอม (descending)
        return b.semester - a.semester;
      });

      console.log("โหลดข้อมูลสำเร็จ:", settings.length, "รายการ");
      setDocumentSettings(settings);
    } catch (error) {
      console.error("Error fetching document settings:", error);
      const errorMessage = handleFirebaseError(error);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      semester: "1",
      academicYear: new Date().getFullYear() + 543,
      isActive: false,
      startDate: "",
      endDate: "",
      startTime: "08:00",
      endTime: "17:00",
      description: "",
      createdAt: new Date(),
    });
  };

  const openModal = (mode, setting = null) => {
    setModalMode(mode);
    setSelectedSetting(setting);

    if (mode === "add") {
      resetForm();
    } else if (setting) {
      // Format dates for input fields
      const startDate = setting.startDate?.toDate
        ? setting.startDate.toDate().toISOString().split("T")[0]
        : setting.startDate;
      const endDate = setting.endDate?.toDate
        ? setting.endDate.toDate().toISOString().split("T")[0]
        : setting.endDate;

      setFormData({
        ...setting,
        startDate,
        endDate,
      });
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSetting(null);
    resetForm();
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFirebaseError = (error) => {
    console.error("Firebase Error:", error);

    switch (error.code) {
      case "permission-denied":
        return "ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาตรวจสอบการตั้งค่าสิทธิ์";
      case "unavailable":
        return "เชื่อมต่อฐานข้อมูลไม่ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
      case "not-found":
        return "ไม่พบข้อมูลที่ต้องการ";
      case "already-exists":
        return "ข้อมูลนี้มีอยู่แล้ว";
      default:
        return `เกิดข้อผิดพลาด: ${error.message}`;
    }
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.startDate || !formData.endDate) {
        alert("กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด");
        return;
      }

      if (formData.startDate > formData.endDate) {
        alert("วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด");
        return;
      }

      if (formData.startTime >= formData.endTime) {
        alert("เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด");
        return;
      }

      // ตรวจสอบการเชื่อมต่อ
      if (!db) {
        throw new Error("ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
      }

      const saveData = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        updatedAt: new Date(),
      };

      console.log("กำลังบันทึกข้อมูล...", modalMode);

      if (modalMode === "add") {
        await addDoc(collection(db, "documentSettings"), {
          ...saveData,
          createdAt: new Date(),
        });
        alert("เพิ่มการตั้งค่าสำเร็จ!");
      } else if (modalMode === "edit") {
        if (!selectedSetting?.id) {
          throw new Error("ไม่พบ ID ของข้อมูลที่ต้องการแก้ไข");
        }

        await updateDoc(
          doc(db, "documentSettings", selectedSetting.id),
          saveData
        );
        alert("แก้ไขการตั้งค่าสำเร็จ!");
      }

      closeModal();
      await fetchDocumentSettings(); // รอให้โหลดเสร็จ
    } catch (error) {
      console.error("Error saving document setting:", error);
      const errorMessage = handleFirebaseError(error);
      alert(errorMessage);
    }
  };

  const handleDelete = async (settingId) => {
    if (!settingId) {
      alert("ไม่พบ ID ของข้อมูลที่ต้องการลบ");
      return;
    }

    if (window.confirm("ต้องการลบการตั้งค่านี้ใช่หรือไม่?")) {
      try {
        console.log("กำลังลบข้อมูล ID:", settingId);

        if (!db) {
          throw new Error("ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
        }

        await deleteDoc(doc(db, "documentSettings", settingId));
        alert("ลบการตั้งค่าสำเร็จ!");
        await fetchDocumentSettings(); // รอให้โหลดเสร็จ
      } catch (error) {
        console.error("Error deleting setting:", error);
        const errorMessage = handleFirebaseError(error);
        alert(errorMessage);
      }
    }
  };

  const toggleActiveStatus = async (setting) => {
    try {
      await updateDoc(doc(db, "documentSettings", setting.id), {
        isActive: !setting.isActive,
        updatedAt: new Date(),
      });
      fetchDocumentSettings();
    } catch (error) {
      console.error("Error updating active status:", error);
      alert("เกิดข้อผิดพลาดในการอัพเดทสถานะ");
    }
  };

  // ปรับปรุงฟังก์ชัน checkTimeInRange ให้รับ parameter เวลา
  const checkTimeInRange = (setting, checkTime = null) => {
    if (!setting.isActive) return false;

    const now = checkTime || currentTime;
    const startDate = setting.startDate?.toDate
      ? setting.startDate.toDate()
      : new Date(setting.startDate);
    const endDate = setting.endDate?.toDate
      ? setting.endDate.toDate()
      : new Date(setting.endDate);

    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    if (now < startDate || now > endDate) return false;

    // Check time range - ใช้เวลาปัจจุบันแบบ Bangkok timezone
    const bangkokTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    );
    const currentTime = bangkokTime.toTimeString().substring(0, 5);

    return currentTime >= setting.startTime && currentTime <= setting.endTime;
  };

  const formatDateTime = (date, time = null) => {
    if (!date) return "-";

    const d = date?.toDate ? date.toDate() : new Date(date);
    const dateStr = d.toLocaleDateString("th-TH");

    if (time) {
      return `${dateStr} ${time}`;
    }
    return dateStr;
  };

  const getBangkokTime = () => {
    return new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={styles.containerCenter}>
        <div style={styles.loading}>กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>จัดการระบบส่งเอกสาร</h1>
          <div style={styles.currentTime}>
            เวลาปัจจุบัน (Bangkok): {getBangkokTime()}
          </div>
        </div>
        <button onClick={() => openModal("add")} style={styles.addButton}>
          + เพิ่มการตั้งค่าใหม่
        </button>
      </div>

      {/* Settings Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <div style={styles.resultsCount}>
            การตั้งค่าทั้งหมด {documentSettings.length} รายการ
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr style={styles.tableRow}>
              <th style={styles.tableHeaderCell}>เทอม/ปีการศึกษา</th>
              <th style={styles.tableHeaderCell}>ช่วงวันที่</th>
              <th style={styles.tableHeaderCell}>ช่วงเวลา</th>
              <th style={styles.tableHeaderCell}>สถานะ</th>
              <th style={styles.tableHeaderCell}>สถานะปัจจุบัน</th>
              <th style={styles.tableHeaderCell}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {documentSettings.map((setting) => (
              <tr key={setting.id} style={styles.tableRow}>
                <td style={styles.tableCell}>
                  {setting.semester}/{setting.academicYear}
                </td>
                <td style={styles.tableCell}>
                  {formatDateTime(setting.startDate)} -{" "}
                  {formatDateTime(setting.endDate)}
                </td>
                <td style={styles.tableCell}>
                  {setting.startTime} - {setting.endTime}
                </td>
                <td style={styles.tableCell}>
                  <button
                    onClick={() => toggleActiveStatus(setting)}
                    style={{
                      ...styles.statusButton,
                      backgroundColor: setting.isActive ? "#28a745" : "#dc3545",
                    }}
                  >
                    {setting.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </button>
                </td>
                <td style={styles.tableCell}>
                  <span
                    style={{
                      ...styles.statusIndicator,
                      backgroundColor: checkTimeInRange(setting)
                        ? "#28a745"
                        : "#dc3545",
                      color: "white",
                    }}
                  >
                    {checkTimeInRange(setting)
                      ? "ใช้งานได้"
                      : "ไม่สามารถใช้งาน"}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => openModal("view", setting)}
                      style={styles.viewButton}
                    >
                      ดู
                    </button>
                    <button
                      onClick={() => openModal("edit", setting)}
                      style={styles.editButton}
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(setting.id)}
                      style={styles.deleteButton}
                    >
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {documentSettings.length === 0 && (
          <div style={styles.noData}>ไม่มีการตั้งค่า</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {modalMode === "add" && "เพิ่มการตั้งค่าใหม่"}
                {modalMode === "edit" && "แก้ไขการตั้งค่า"}
                {modalMode === "view" && "ดูการตั้งค่า"}
              </h2>
              <button onClick={closeModal} style={styles.closeButton}>
                ×
              </button>
            </div>

            <div style={styles.modalContent}>
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>ข้อมูลการตั้งค่า</h3>

                <div style={styles.formRow}>
                  <div style={styles.field}>
                    <label style={styles.label}>เทอม:</label>
                    <select
                      value={formData.semester}
                      onChange={(e) =>
                        handleInputChange("semester", e.target.value)
                      }
                      style={styles.select}
                      disabled={modalMode === "view"}
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>ปีการศึกษา (พ.ศ.):</label>
                    <input
                      type="number"
                      value={formData.academicYear}
                      onChange={(e) =>
                        handleInputChange(
                          "academicYear",
                          parseInt(e.target.value)
                        )
                      }
                      style={styles.input}
                      disabled={modalMode === "view"}
                      min="2560"
                      max="2580"
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.field}>
                    <label style={styles.label}>วันที่เริ่มต้น:</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                      style={styles.input}
                      disabled={modalMode === "view"}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>วันที่สิ้นสุด:</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        handleInputChange("endDate", e.target.value)
                      }
                      style={styles.input}
                      disabled={modalMode === "view"}
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.field}>
                    <label style={styles.label}>เวลาเริ่มต้น:</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        handleInputChange("startTime", e.target.value)
                      }
                      style={styles.input}
                      disabled={modalMode === "view"}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>เวลาสิ้นสุด:</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        handleInputChange("endTime", e.target.value)
                      }
                      style={styles.input}
                      disabled={modalMode === "view"}
                    />
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        handleInputChange("isActive", e.target.checked)
                      }
                      disabled={modalMode === "view"}
                      style={styles.checkbox}
                    />
                    เปิดใช้งาน
                  </label>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>คำอธิบาย (ไม่บังคับ):</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    style={styles.textarea}
                    disabled={modalMode === "view"}
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closeModal} style={styles.cancelButton}>
                {modalMode === "view" ? "ปิด" : "ยกเลิก"}
              </button>
              {modalMode !== "view" && (
                <button onClick={handleSubmit} style={styles.saveButton}>
                  {modalMode === "add" ? "เพิ่ม" : "บันทึก"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  containerCenter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  loading: {
    fontSize: 18,
    color: "#666",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#333",
    margin: 0,
    marginBottom: 5,
  },
  currentTime: {
    color: "#666",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  tableHeader: {
    padding: 15,
    borderBottom: "1px solid #eee",
  },
  resultsCount: {
    color: "#666",
    fontSize: 14,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableRow: {
    borderBottom: "1px solid #eee",
  },
  tableHeaderCell: {
    padding: 12,
    textAlign: "left",
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: "#f8f9fa",
  },
  tableCell: {
    padding: 12,
    textAlign: "left",
    fontSize: 14,
    verticalAlign: "middle",
  },
  statusButton: {
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "bold",
  },
  statusIndicator: {
    padding: "4px 8px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "bold",
  },
  actionButtons: {
    display: "flex",
    gap: 5,
  },
  viewButton: {
    backgroundColor: "#17a2b8",
    color: "white",
    border: "none",
    padding: "5px 10px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  editButton: {
    backgroundColor: "#ffc107",
    color: "black",
    border: "none",
    padding: "5px 10px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    padding: "5px 10px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  noData: {
    textAlign: "center",
    padding: 40,
    color: "#666",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 8,
    maxWidth: "90vw",
    maxHeight: "90vh",
    width: 600,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottom: "1px solid #eee",
    backgroundColor: "#f8f9fa",
  },
  modalTitle: {
    margin: 0,
    color: "#333",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    color: "#666",
  },
  modalContent: {
    padding: 20,
    overflow: "auto",
    flex: 1,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: 20,
    borderTop: "1px solid #eee",
    backgroundColor: "#f8f9fa",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    cursor: "pointer",
  },
  saveButton: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    cursor: "pointer",
  },
  section: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    border: "1px solid #e9ecef",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 15,
    color: "#495057",
    fontSize: 16,
    fontWeight: "bold",
  },
  formRow: {
    display: "flex",
    gap: 15,
    marginBottom: 15,
  },
  field: {
    flex: 1,
    marginBottom: 15,
  },
  label: {
    display: "block",
    marginBottom: 5,
    fontWeight: "bold",
    color: "#333",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: "bold",
    color: "#333",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: 8,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
  },
  select: {
    width: "100%",
    padding: 8,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: "white",
  },
  textarea: {
    width: "100%",
    padding: 8,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    resize: "vertical",
  },
  checkbox: {
    margin: 0,
  },
};
