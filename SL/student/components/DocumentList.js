// DocumentList.js
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';

const DocumentList = ({ documents, uploads, uploadProgress, handleFileUpload, handleRemoveFile, handleShowFileModal, handleDownloadDocument }) => {
  return (
    <View style={styles.documentsCard}>
      <Text style={styles.documentsTitle}>รายการเอกสารที่ต้องอัพโหลด</Text>
      {documents.map((doc, idx) => (
        <View
          key={doc.id}
          style={[
            styles.documentItem,
            idx % 2 === 0 ? styles.documentItemEven : styles.documentItemOdd
          ]}
        >
          <View style={styles.documentHeader}>
            <View style={styles.documentTitleContainer}>
              <Text style={styles.documentTitle}>{doc.title}</Text>
              {doc.required && <Text style={styles.requiredBadge}>*จำเป็น</Text>}
            </View>
            {/* แก้ไข: ใช้เงื่อนไขใหม่สำหรับแสดงปุ่มดาวน์โหลด */}
            {(doc.id === 'form_101' || doc.id === 'consent_student_form' || doc.downloadUrl) && (
              <TouchableOpacity
                onPress={() => handleDownloadDocument(doc.id, doc.downloadUrl)} // เรียกใช้ฟังก์ชันใหม่
                style={styles.downloadButton}
              >
                <Text style={styles.downloadButtonText}>⬇️</Text>
              </TouchableOpacity>
            )}
          </View>
          {doc.description ? (
            <Text style={styles.documentDescription}>{doc.description}</Text>
          ) : null}
          <View style={styles.uploadArea}>
            {uploadProgress[doc.id] !== undefined ? (
              <View style={styles.uploadProgressContainer}>
                <Text style={styles.uploadProgressText}>
                  กำลังอัพโหลด... {uploadProgress[doc.id]}%
                </Text>
                <View style={styles.uploadProgressBar}>
                  <View
                    style={[
                      styles.uploadProgressFill,
                      { width: `${uploadProgress[doc.id]}%` },
                    ]}
                  />
                </View>
              </View>
            ) : uploads[doc.id] ? (
              <View style={styles.uploadedContainer}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => handleShowFileModal(doc.id, doc.title)}
                >
                  <Text style={styles.uploadedFileName}> ✅ {uploads[doc.id].filename} </Text>
                  <Text style={styles.uploadedDate}>
                    อัพโหลดเมื่อ: {uploads[doc.id].uploadDate}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFile(doc.id)}
                >
                  <Text style={styles.removeButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handleFileUpload(doc.id)}
              >
                <Text style={styles.uploadButtonText}>📁 เลือกไฟล์</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  documentsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  documentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  documentItem: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  documentItemEven: {
    backgroundColor: '#f1f5f9',
  },
  documentItemOdd: {
    backgroundColor: '#f8fafc',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  documentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginRight: 6,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  documentDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  uploadArea: {
    marginTop: 8,
  },
  uploadButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadProgressContainer: {
    marginTop: 4,
  },
  uploadProgressText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  uploadProgressBar: {
    height: 8,
    backgroundColor: '#e0e7ef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  uploadedFileName: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
  },
  uploadedDate: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  removeButton: {
    marginLeft: 10,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  downloadButton: {
    marginLeft: 10,
    backgroundColor: '#2563eb',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DocumentList;
