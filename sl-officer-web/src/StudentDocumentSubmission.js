import React, { useState, useEffect } from "react";
import { db } from "./database/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const StudentDocumentSubmission = () => {
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // เปลี่ยนจาก "all" เป็น "pending"
  // Document type mappings in Thai
  const documentTypes = {
    consent_student_form: "แบบฟอร์มยินยอมนักศึกษา",
    fam_id_copies_gov: "สำเนาบัตรประชาชนครอบครัว (ราชการ)",
    family_status_cert: "หนังสือรับรองสถานภาพครอบครัว",
    form_101: "แบบฟอร์ม 101",
    guar_id_copies_gov: "สำเนาบัตรประชาชนผู้ปกครอง (ราชการ)",
    guardian_consent: "หนังสือยินยอมผู้ปกครอง",
    guardian_id_copies: "สำเนาบัตรประชาชนผู้ปกครอง",
    guardian_income: "หนังสือรับรองรายได้ผู้ปกครอง",
    id_copies_student: "สำเนาบัตรประชาชนนักเรียน",
    volunteer_doc: "เอกสารอาสาสมัคร",
    guardian_income_cert: "หนังสือรับรองรายได้ผู้ปกครอง (ราชการ)",
  };

  const statusOptions = {
    pending: "รอการตรวจสอบ",
    approved: "เอกสารถูกต้อง",
    rejected: "เอกสารไม่ถูกต้อง",
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch document submissions
      const submissionsRef = collection(db, "document_submissions_2568_1");
      const submissionsSnap = await getDocs(submissionsRef);
      const submissionsData = [];

      submissionsSnap.forEach((doc) => {
        submissionsData.push({ id: doc.id, ...doc.data() });
      });

      // Fetch users data
      const usersRef = collection(db, "users");
      const usersSnap = await getDocs(usersRef);
      const usersData = {};

      usersSnap.forEach((doc) => {
        usersData[doc.id] = doc.data();
      });

      setSubmissions(submissionsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentStatus = async (
    submissionId,
    documentType,
    status,
    comments
  ) => {
    try {
      const submissionRef = doc(
        db,
        "document_submissions_2568_1",
        submissionId
      );

      // Update the specific document status
      const updateData = {
        [`documentStatuses.${documentType}.status`]: status,
        [`documentStatuses.${documentType}.comments`]: comments,
        [`documentStatuses.${documentType}.reviewedAt`]:
          new Date().toISOString(),
        [`documentStatuses.${documentType}.reviewedBy`]: "admin", // You can replace this with actual admin info
      };

      await updateDoc(submissionRef, updateData);

      // Update local state
      setSubmissions((prev) =>
        prev.map((sub) => {
          if (sub.id === submissionId) {
            return {
              ...sub,
              documentStatuses: {
                ...sub.documentStatuses,
                [documentType]: {
                  ...sub.documentStatuses[documentType],
                  status,
                  comments,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: "admin",
                },
              },
            };
          }
          return sub;
        })
      );
    } catch (error) {
      console.error("Error updating document status:", error);
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const userName = users[submission.userId]?.name || "";
    const matchesSearch = userName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;

    // Check if any document has the selected status
    const hasStatus = Object.values(submission.documentStatuses || {}).some(
      (doc) => doc.status === statusFilter
    );

    return matchesSearch && hasStatus;
  });

  const DocumentViewer = ({ submission }) => {
    const [documentStates, setDocumentStates] = useState({});

    const initializeDocumentStates = () => {
      const states = {};
      Object.keys(submission.documentStatuses || {}).forEach((docType) => {
        const docStatus = submission.documentStatuses[docType];
        states[docType] = {
          status: docStatus.status || "pending",
          comments: docStatus.comments || "",
        };
      });
      setDocumentStates(states);
    };

    useEffect(() => {
      initializeDocumentStates();
    }, [submission]);

    const handleStatusChange = (docType, newStatus) => {
      setDocumentStates((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], status: newStatus },
      }));
    };

    const handleCommentsChange = (docType, comments) => {
      setDocumentStates((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], comments },
      }));
    };

    const handleSave = async (docType) => {
      const state = documentStates[docType];
      await updateDocumentStatus(
        submission.id,
        docType,
        state.status,
        state.comments
      );
    };

    return (
      <div style={styles.container}>
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setSelectedSubmission(null)}
            style={styles.backButton}
          >
            ← กลับไปหน้าหลัก
          </button>
        </div>

        <h2 style={styles.header}>
          เอกสารของ {users[submission.userId]?.name || "ไม่ระบุชื่อ"}
        </h2>

        <div style={styles.documentsGrid}>
          {Object.keys(submission.documentStatuses || {}).map((docType) => {
            const docData = submission.documentStatuses[docType];
            const uploads = submission.uploads?.[docType] || [];
            const currentState = documentStates[docType] || {
              status: "pending",
              comments: "",
            };

            return (
              <div key={docType} style={styles.documentCard}>
                <h3 style={styles.documentTitle}>
                  {documentTypes[docType] || docType}
                </h3>

                <div style={styles.documentInfo}>
                  <p>จำนวนไฟล์: {docData.fileCount || 0}</p>
                  <p>
                    สถานะปัจจุบัน:
                    <span
                      style={{
                        color:
                          currentState.status === "approved"
                            ? "green"
                            : currentState.status === "rejected"
                            ? "red"
                            : "orange",
                        fontWeight: "bold",
                        marginLeft: 5,
                      }}
                    >
                      {statusOptions[currentState.status] ||
                        currentState.status}
                    </span>
                  </p>
                </div>

                {uploads.length > 0 && (
                  <div style={styles.filesList}>
                    <h4>ไฟล์ที่อัปโหลด:</h4>
                    {uploads.map((file, index) => (
                      <div key={index} style={styles.fileItem}>
                        {file.mimeType?.startsWith("image/") ? (
                          // ถ้าเป็นรูป
                          <div style={styles.imageContainer}>
                            <img
                              src={file.downloadURL}
                              alt={file.originalFileName}
                              style={styles.imagePreview}
                              onClick={() =>
                                window.open(file.downloadURL, "_blank")
                              }
                            />
                            <div style={styles.fileName}>
                              เล็งที่เอกสาร Ctrl + ลูกกลิ้งเมาส์ เพื่อ
                              ซูมเข้า/ออก{file.originalFileName}
                            </div>
                          </div>
                        ) : file.mimeType === "application/pdf" ? (
                          // ถ้าเป็น PDF
                          <div style={styles.pdfContainer}>
                            <div style={styles.pdfViewerWrapper}>
                              <iframe
                                src={file.downloadURL}
                                title={file.originalFileName}
                                style={styles.pdfPreview}
                              />
                            </div>
                            <div style={styles.fileName}>
                              เล็งที่เอกสาร Ctrl + ลูกกลิ้งเมาส์ เพื่อ
                              ซูมเข้า/ออก {file.originalFileName}
                            </div>
                          </div>
                        ) : (
                          // ไฟล์อื่น ๆ
                          <a
                            href={file.downloadURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.documentLink}
                          >
                            📎 {file.originalFileName}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div style={styles.statusControls}>
                  <label style={styles.label}>เปลี่ยนสถานะ:</label>
                  <select
                    value={currentState.status}
                    onChange={(e) =>
                      handleStatusChange(docType, e.target.value)
                    }
                    style={styles.select}
                  >
                    <option value="pending">รอการตรวจสอบ</option>
                    <option value="approved">เอกสารถูกต้อง</option>
                    <option value="rejected">เอกสารไม่ถูกต้อง</option>
                  </select>

                  <label style={styles.label}>หมายเหตุ:</label>
                  <textarea
                    value={currentState.comments}
                    onChange={(e) =>
                      handleCommentsChange(docType, e.target.value)
                    }
                    style={styles.textarea}
                    placeholder="ใส่หมายเหตุ (ถ้ามี)"
                    rows={3}
                  />

                  <button
                    onClick={() => handleSave(docType)}
                    style={styles.saveButton}
                  >
                    บันทึกการเปลี่ยนแปลง
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div style={styles.loadingText}>กำลังโหลดข้อมูล...</div>;
  }

  if (selectedSubmission) {
    return <DocumentViewer submission={selectedSubmission} />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>ระบบตรวจสอบเอกสารนักเรียน</h1>

      <div style={styles.filterContainer}>
        <input
          type="text"
          placeholder="ค้นหาชื่อนักเรียน..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.input}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.select}
        >
          <option value="pending">รอการตรวจสอบ</option>
          <option value="approved">เอกสารถูกต้อง</option>
          <option value="rejected">เอกสารไม่ถูกต้อง</option>
          <option value="all">ทุกสถานะ</option>
        </select>
      </div>

      <div style={styles.postsContainer}>
        {filteredSubmissions.map((submission) => {
          const user = users[submission.userId] || {};
          const totalDocuments = Object.keys(
            submission.documentStatuses || {}
          ).length;
          const approvedDocuments = Object.values(
            submission.documentStatuses || {}
          ).filter((doc) => doc.status === "approved").length;
          const rejectedDocuments = Object.values(
            submission.documentStatuses || {}
          ).filter((doc) => doc.status === "rejected").length;
          const pendingDocuments =
            totalDocuments - approvedDocuments - rejectedDocuments;

          return (
            <div
              key={submission.id}
              style={styles.postCard}
              onClick={() => setSelectedSubmission(submission)}
            >
              <h3 style={styles.postTitle}>{user.name || "ไม่ระบุชื่อ"}</h3>

              <div style={styles.postDescription}>
                <p style={styles.infoLine}>
                  <strong>อีเมล:</strong> {submission.userEmail}
                </p>
                <p style={styles.infoLine}>
                  <strong>ปีการศึกษา:</strong> {submission.academicYear}
                </p>
                <p style={styles.infoLine}>
                  <strong>เทอม:</strong> {submission.submissionTerm}
                </p>
                <p style={styles.infoLine}>
                  <strong>วันที่ส่ง:</strong>{" "}
                  {new Date(submission.submittedAt).toLocaleDateString("th-TH")}
                </p>

                <div style={styles.statusSummary}>
                  <div
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: "#28a745",
                    }}
                  >
                    ถูกต้อง: {approvedDocuments}
                  </div>
                  <div
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: "#dc3545",
                    }}
                  >
                    ไม่ถูกต้อง: {rejectedDocuments}
                  </div>
                  <div
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: "#ffc107",
                    }}
                  >
                    รอตรวจ: {pendingDocuments}
                  </div>
                </div>
              </div>

              <p style={styles.clickText}>คลิกเพื่อดูรายละเอียดเอกสาร</p>
            </div>
          );
        })}
      </div>

      {filteredSubmissions.length === 0 && (
        <div style={styles.loadingText}>ไม่พบข้อมูลการส่งเอกสาร</div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: 30,
    maxWidth: 1400,
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    fontSize: 16,
    lineHeight: 1.5,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 30,
    textAlign: "center",
  },
  filterContainer: {
    display: "flex",
    gap: 15,
    marginBottom: 30,
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  input: {
    padding: 12,
    fontSize: 16,
    border: "1px solid #ccc",
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    minWidth: 250,
  },
  select: {
    padding: 12,
    fontSize: 16,
    border: "1px solid #ccc",
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    backgroundColor: "#fff",
    minWidth: 180,
  },
  loadingText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
  postsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 20,
  },
  postCard: {
    background: "#fff",
    padding: 15,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    aspectRatio: "3/4",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginTop: 0,
    textAlign: "center",
  },
  postDescription: {
    fontSize: 13,
    lineHeight: 1.4,
    color: "#555",
    marginBottom: 10,
    flex: 1,
  },
  infoLine: {
    margin: "5px 0",
    fontSize: 12,
  },
  statusSummary: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    margin: "10px 0",
  },
  statusBadge: {
    padding: "3px 8px",
    borderRadius: 12,
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  clickText: {
    fontSize: 11,
    color: "#777",
    marginBottom: 0,
    fontStyle: "italic",
    textAlign: "center",
  },
  backButton: {
    padding: "10px 20px",
    fontSize: 16,
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    marginBottom: 20,
  },
  documentsGrid: {
    display: "grid",
    gap: 20,
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
  },
  documentCard: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    border: "1px solid #e0e0e0",
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  documentInfo: {
    marginBottom: 15,
    fontSize: 14,
    color: "#666",
  },
  filesList: {
    marginBottom: 20,
  },
  fileItem: {
    marginBottom: 20,
  },
  imageContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  pdfContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 15,
    backgroundColor: "#f9f9f9",
    maxWidth: "100%",
  },
  pdfViewerWrapper: {
    width: "100%",
    maxWidth: 350,
    height: 400,
    border: "1px solid #ccc",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  pdfControls: {
    display: "flex",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  fileName: {
    fontSize: 14,
    color: "#3b82f6",
    marginTop: 8,
    textAlign: "center",
    wordBreak: "break-word",
  },
  downloadLink: {
    fontSize: 13,
    color: "#28a745",
    textDecoration: "none",
    padding: "8px 12px",
    backgroundColor: "#e8f5e8",
    borderRadius: 4,
    border: "1px solid #28a745",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  },
  downloadButton: {
    fontSize: 13,
    color: "#fff",
    backgroundColor: "#007bff",
    border: "1px solid #007bff",
    padding: "8px 12px",
    borderRadius: 4,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  },
  documentLink: {
    fontSize: 16,
    color: "#3b82f6",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  imagePreview: {
    width: 120,
    height: 120,
    objectFit: "cover",
    borderRadius: 8,
    border: "1px solid #ddd",
    cursor: "pointer",
  },
  pdfPreview: {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: 4,
  },
  statusControls: {
    borderTop: "1px solid #eee",
    paddingTop: 15,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 10,
  },
  textarea: {
    width: "100%",
    padding: 8,
    fontSize: 14,
    border: "1px solid #ccc",
    borderRadius: 4,
    resize: "vertical",
    marginBottom: 10,
  },
  saveButton: {
    padding: "8px 16px",
    fontSize: 14,
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};

export default StudentDocumentSubmission;
