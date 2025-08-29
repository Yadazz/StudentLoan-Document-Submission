// FileDetailModal.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions, Image, ActivityIndicator, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

const FileDetailModal = ({
  visible,
  onClose,
  selectedFile,
  selectedDocTitle,
  fileContent,
  contentType,
  isLoadingContent,
  formatFileSize,
  handleOpenUploadedFile,
  handleRemoveFile,
  imageZoom,
  setImageZoom,
  setImagePosition,
  loadFileContent,
}) => {
  if (!selectedFile) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>รายละเอียดไฟล์</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.fileInfoCard}>
              <View style={styles.fileIcon}>
                <Text style={styles.fileIconText}>📄</Text>
              </View>
              <View style={styles.fileDetails}>
                <Text style={styles.modalDocTitle}>{selectedDocTitle}</Text>
                <Text style={styles.fileName}>{selectedFile.filename}</Text>
                <View style={styles.fileMetadata}>
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>ขนาดไฟล์:</Text>
                    <Text style={styles.metadataValue}>{formatFileSize(selectedFile.size)}</Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>ประเภท:</Text>
                    <Text style={styles.metadataValue}>{selectedFile.mimeType || 'ไม่ระบุ'}</Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>อัพโหลดเมื่อ:</Text>
                    <Text style={styles.metadataValue}>{selectedFile.uploadDate}</Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>สถานะ:</Text>
                    <Text style={[styles.metadataValue, styles.statusSuccess]}>✅ อัพโหลดสำเร็จ</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleOpenUploadedFile(selectedFile)}
              >
                <Text style={styles.actionButtonText}>📤 แชร์ไฟล์</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={() => handleRemoveFile(selectedFile.id)}
              >
                <Text style={styles.actionButtonText}>🗑️ ลบไฟล์</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filePreviewContainer}>
              <Text style={styles.previewTitle}>ตัวอย่างไฟล์:</Text>
              {isLoadingContent ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.loadingText}>กำลังโหลดเนื้อหาไฟล์...</Text>
                </View>
              ) : (
                <View style={styles.previewContent}>
                  {contentType === 'image' && (
                    <View style={styles.imagePreviewContainer}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        maximumZoomScale={3}
                        minimumZoomScale={0.5}
                        bouncesZoom={true}
                        contentContainerStyle={styles.imageScrollContainer}
                      >
                        <TouchableOpacity
                          activeOpacity={1}
                          onPress={() => {
                            setImageZoom(imageZoom === 1 ? 2 : 1);
                          }}
                        >
                          <Image
                            source={{ uri: fileContent }}
                            style={[styles.previewImageEnhanced, { transform: [{ scale: imageZoom }] }]}
                            resizeMode="contain"
                            onError={(error) => {
                              console.log('Image load error:', error);
                              setContentType('error');
                              setFileContent('ไม่สามารถโหลดรูปภาพได้ อาจเป็นเพราะไฟล์เสียหายหรือไม่รองรับ');
                            }}
                          />
                        </TouchableOpacity>
                      </ScrollView>
                      <View style={styles.imageControls}>
                        <TouchableOpacity
                          style={styles.zoomButton}
                          onPress={() => setImageZoom(Math.max(0.5, imageZoom - 0.5))}
                        >
                          <Text style={styles.zoomButtonText}>🔍−</Text>
                        </TouchableOpacity>
                        <Text style={styles.zoomText}>{Math.round(imageZoom * 100)}%</Text>
                        <TouchableOpacity
                          style={styles.zoomButton}
                          onPress={() => setImageZoom(Math.min(3, imageZoom + 0.5))}
                        >
                          <Text style={styles.zoomButtonText}>🔍+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.resetButton}
                          onPress={() => {
                            setImageZoom(1);
                            setImagePosition({ x: 0, y: 0 });
                          }}
                        >
                          <Text style={styles.resetButtonText}>รีเซ็ต</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.imageInfo}>
                        <Text style={styles.imageInfoText}>💡 แตะรูปภาพเพื่อซูม หรือใช้ปุ่มด้านล่าง</Text>
                      </View>
                    </View>
                  )}
                  {contentType === 'text' && (
                    <View style={styles.textPreviewEnhanced}>
                      <ScrollView style={styles.textPreviewContainer} showsVerticalScrollIndicator={true}>
                        <Text style={styles.textPreview}>{fileContent}</Text>
                      </ScrollView>
                      <Text style={styles.textInfo}>📄 เอกสารข้อความ - เลื่อนเพื่อดูเนื้อหาทั้งหมด</Text>
                    </View>
                  )}
                  {(contentType === 'pdf' || contentType === 'other' || contentType === 'error') && (
                    <View style={styles.unsupportedContainer}>
                      <Text style={styles.unsupportedIcon}>{contentType === 'pdf' ? '📄' : contentType === 'error' ? '❌' : '📁'}</Text>
                      <Text style={styles.unsupportedText}>{fileContent}</Text>
                      {contentType === 'pdf' && (
                        <TouchableOpacity
                          style={styles.openExternalButton}
                          onPress={() => handleOpenUploadedFile(selectedFile)}
                        >
                          <Text style={styles.openExternalButtonText}>🚀 เปิดด้วยแอปภายนอก</Text>
                        </TouchableOpacity>
                      )}
                      {contentType === 'error' && (
                        <TouchableOpacity
                          style={[styles.openExternalButton, { backgroundColor: '#ef4444' }]}
                          onPress={() => loadFileContent(selectedFile)}
                        >
                          <Text style={styles.openExternalButtonText}>🔄 ลองใหม่</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: width * 0.95,
    maxHeight: height * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    backgroundColor: '#ef4444',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  fileInfoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fileIcon: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileIconText: {
    fontSize: 24,
  },
  fileDetails: {
    flex: 1,
  },
  modalDocTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  fileMetadata: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  metadataValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  statusSuccess: {
    color: '#059669',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonDanger: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filePreviewContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  previewContent: {
    minHeight: 200,
    maxHeight: 500,
  },
  imagePreviewContainer: {
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 300,
    maxHeight: 500,
  },
  imageScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  previewImageEnhanced: {
    width: width * 0.8,
    height: 400,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  imageControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 15,
  },
  zoomButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  zoomText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageInfo: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  imageInfoText: {
    color: '#ffffff',
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.9,
  },
  textPreviewEnhanced: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
  },
  textPreviewContainer: {
    padding: 16,
    maxHeight: 350,
    backgroundColor: '#ffffff',
  },
  textPreview: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  textInfo: {
    backgroundColor: '#e0e7ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#3730a3',
    textAlign: 'center',
  },
  unsupportedContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  unsupportedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  unsupportedText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    maxWidth: 280,
  },
  openExternalButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  openExternalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FileDetailModal;