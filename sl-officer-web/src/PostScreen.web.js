import React, { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { db, storage } from "./database/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Custom Upload Adapter สำหรับ CKEditor
class MyUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then(
      (file) =>
        new Promise((resolve, reject) => {
          this._initRequest();
          this._initListeners(resolve, reject, file);
          this._sendRequest(file);
        })
    );
  }

  abort() {
    // ยกเลิกการอัปโหลด
  }

  _initRequest() {
    // ไม่จำเป็นต้องใช้ XMLHttpRequest เพราะเราใช้ Firebase
  }

  _initListeners(resolve, reject, file) {
    // Upload ไฟล์ไป Firebase Storage
    const uploadToFirebase = async () => {
      try {
        const storageRef = ref(
          storage,
          `ckeditor-uploads/${Date.now()}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        resolve({
          default: downloadURL,
        });
      } catch (error) {
        reject(`Cannot upload file: ${file.name}.`);
      }
    };

    uploadToFirebase();
  }

  _sendRequest(file) {
    // ไม่จำเป็นเพราะเราจัดการใน _initListeners แล้ว
  }
}

// Plugin function เพื่อเพิ่ม upload adapter
function MyCustomUploadAdapterPlugin(editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
    return new MyUploadAdapter(loader);
  };
}

export default function PostScreen() {
  const [title, setTitle] = useState("");
  const [banner, setBanner] = useState(null);
  const [description, setDescription] = useState("");
  const [documentFiles, setDocumentFiles] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [postType, setPostType] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Configuration สำหรับ CKEditor
  const editorConfiguration = {
    extraPlugins: [MyCustomUploadAdapterPlugin],
    toolbar: [
      "heading",
      "|",
      "bold",
      "italic",
      "link",
      "bulletedList",
      "numberedList",
      "|",
      "outdent",
      "indent",
      "|",
      "imageUpload", // เพิ่ม image upload button
      "blockQuote",
      "insertTable",
      "undo",
      "redo",
    ],
    image: {
      toolbar: [
        "imageTextAlternative",
        "imageStyle:inline",
        "imageStyle:block",
        "imageStyle:side",
      ],
    },
    table: {
      contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
    },
  };

  const handleFileUpload = async (file, folder = "media") => {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const handleSubmit = async () => {
    setErrors({});
    let tempErrors = {};

    if (!title.trim()) tempErrors.title = "กรุณากรอกหัวข้อ";
    if (!postType) tempErrors.postType = "กรุณาเลือกประเภทโพสต์";

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    try {
      const bannerURL = banner
        ? await handleFileUpload(banner, "banner")
        : null;

      const documentURLs = [];
      const documentNames = [];
      for (let file of documentFiles) {
        const url = await handleFileUpload(file, "documents");
        documentURLs.push(url);
        documentNames.push(file.name);
      }

      const mediaURLs = [];
      for (let file of mediaFiles) {
        const url = await handleFileUpload(file, "media");
        mediaURLs.push(url);
      }

      await addDoc(collection(db, "news"), {
        title,
        description,
        postType,
        bannerURL,
        documentNames: documentNames.length > 0 ? documentNames : null,
        documentURLs: documentURLs.length > 0 ? documentURLs : null,
        mediaURLs,
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setTitle("");
      setBanner(null);
      setDescription("");
      setDocumentFiles([]);
      setMediaFiles([]);
      setPostType("");
      setErrors({});
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด!");
    }
  };

  const addDocumentFile = (file) => {
    if (file && !documentFiles.some((f) => f.name === file.name)) {
      setDocumentFiles((prev) => [...prev, file]);
    }
  };

  const removeDocumentFile = (index) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addMediaFiles = (files) => {
    const newFiles = Array.from(files).filter(
      (file) => !mediaFiles.some((f) => f.name === file.name)
    );
    setMediaFiles((prev) => [...prev, ...newFiles]);
  };

  const removeMediaFile = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>สร้างโพสต์ใหม่</h1>

      {success && <div style={styles.successMsg}>โพสต์สำเร็จ!</div>}

      <div style={styles.field}>
        <label style={styles.label}>หัวข้อ:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />
        {errors.title && <div style={styles.errorMsg}>{errors.title}</div>}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>ประเภทโพสต์:</label>
        <select
          value={postType}
          onChange={(e) => setPostType(e.target.value)}
          style={styles.select}
        >
          <option value="">-- เลือกประเภทโพสต์ --</option>
          <option value="ทั่วไป">ทั่วไป</option>
          <option value="ทุนการศึกษา">ทุนการศึกษา</option>
          <option value="ชั่วโมงจิตอาสา">ชั่วโมงจิตอาสา</option>
          <option value="จ้างงาน">จ้างงาน</option>
        </select>
        {errors.postType && (
          <div style={styles.errorMsg}>{errors.postType}</div>
        )}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Banner:</label>

        {banner && (
          <div style={styles.bannerContainer}>
            <img
              src={URL.createObjectURL(banner)}
              alt="Banner preview"
              style={styles.bannerPreview}
            />
            <button
              onClick={() => setBanner(null)}
              style={styles.removeBannerButton}
            >
              ลบ Banner
            </button>
          </div>
        )}

        {!banner && (
          <div style={styles.addFileSection}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBanner(e.target.files[0])}
              style={styles.fileInput}
            />
          </div>
        )}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>รายละเอียด:</label>
        <CKEditor
          editor={ClassicEditor}
          config={editorConfiguration}
          data={description}
          onChange={(event, editor) => setDescription(editor.getData())}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>เอกสาร (PDF, DOCX):</label>

        {documentFiles.length > 0 && (
          <div style={styles.selectedFiles}>
            <h4 style={styles.subHeader}>เอกสารที่เลือก:</h4>
            {documentFiles.map((file, index) => (
              <div key={index} style={styles.fileItem}>
                <span>📄 {file.name}</span>
                <button
                  onClick={() => removeDocumentFile(index)}
                  style={styles.removeButton}
                >
                  ลบ
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={styles.addFileSection}>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              if (e.target.files[0]) {
                addDocumentFile(e.target.files[0]);
                e.target.value = "";
              }
            }}
            style={styles.fileInput}
          />
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>สื่อ (รูป/วิดีโอ):</label>

        {mediaFiles.length > 0 && (
          <div style={styles.selectedFiles}>
            <h4 style={styles.subHeader}>สื่อที่เลือก:</h4>
            <div style={styles.mediaGrid}>
              {mediaFiles.map((file, index) => (
                <div key={index} style={styles.mediaItem}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`media-${index}`}
                    style={styles.mediaPreview}
                  />
                  <div style={styles.fileName}>{file.name}</div>
                  <button
                    onClick={() => removeMediaFile(index)}
                    style={styles.removeMediaButton}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={styles.addFileSection}>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => {
              if (e.target.files.length > 0) {
                addMediaFiles(e.target.files);
                e.target.value = "";
              }
            }}
            style={styles.fileInput}
          />
        </div>
      </div>

      <button onClick={handleSubmit} style={styles.button}>
        สร้างโพสต์
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 800,
    margin: "0 auto",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  field: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontWeight: "bold",
    color: "#555",
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ccc",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  select: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ccc",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    backgroundColor: "#fff",
  },
  fileInput: {
    display: "block",
    marginBottom: 10,
  },
  selectedFiles: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#f8f9fa",
    border: "1px solid #dee2e6",
    borderRadius: 8,
  },
  fileItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 4,
    marginBottom: 8,
  },
  removeButton: {
    padding: "4px 8px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  addFileSection: {
    padding: 15,
    backgroundColor: "#f0f8ff",
    border: "1px dashed #3b82f6",
    borderRadius: 8,
  },
  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 15,
  },
  mediaItem: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
  },
  mediaPreview: {
    width: "100%",
    height: 120,
    objectFit: "cover",
    display: "block",
  },
  fileName: {
    padding: 8,
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f8f9fa",
    textAlign: "center",
    wordBreak: "break-word",
  },
  removeMediaButton: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    backgroundColor: "rgba(220, 53, 69, 0.9)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
  bannerContainer: {
    marginBottom: 15,
    position: "relative",
  },
  bannerPreview: {
    width: "100%",
    maxHeight: 200,
    objectFit: "cover",
    borderRadius: 8,
    border: "1px solid #ddd",
    display: "block",
  },
  removeBannerButton: {
    marginTop: 8,
    padding: "6px 12px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 14,
  },
  button: {
    padding: "12px 24px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
    transition: "0.3s",
    width: "100%",
    marginTop: 20,
  },
  successMsg: {
    color: "green",
    marginBottom: 16,
    fontWeight: "bold",
    textAlign: "center",
    padding: 10,
    backgroundColor: "#d4edda",
    border: "1px solid #c3e6cb",
    borderRadius: 8,
  },
  errorMsg: {
    color: "red",
    marginTop: 4,
    fontSize: 14,
  },
};
