import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FileItem = ({ file, onPress }) => {
  const formatFileSize = (bytes) => {
    if (!bytes) return 'ไม่ทราบขนาด';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType, filename) => {
    const type = mimeType?.toLowerCase() || "";
    const name = filename?.toLowerCase() || "";

    if (type.startsWith("image/") || name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
      return "image";
    } else if (type.includes("pdf") || name.endsWith(".pdf")) {
      return "document-text";
    } else if (type.includes("word") || name.match(/\.(doc|docx)$/)) {
      return "document";
    } else if (type.includes("excel") || name.match(/\.(xls|xlsx)$/)) {
      return "grid";
    } else if (type.includes("text") || name.match(/\.(txt|json)$/)) {
      return "document-text-outline";
    } else {
      return "document-outline";
    }
  };

  const isStorageFile = file.storageUploaded && file.downloadURL;

  return (
    <View style={styles.fileItem}>
      <TouchableOpacity style={styles.filePreview} onPress={onPress}>
        <View style={styles.fileIconContainer}>
          <Ionicons 
            name={getFileIcon(file.mimeType, file.originalFileName || file.filename)} 
            size={24} 
            color="#2563eb" 
          />
          {isStorageFile && (
            <View style={styles.cloudIndicator}>
              <Ionicons name="cloud-done" size={12} color="#10b981" />
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.fileDetails}>
        <Text style={styles.fileName} numberOfLines={1}>
          {file.originalFileName || file.filename}
        </Text>
        <Text style={styles.fileSize}>
          {formatFileSize(file.fileSize || file.size)}
        </Text>
        
        {/* OCR validation indicator */}
        {file.ocrValidated && (
          <View style={styles.ocrValidatedIndicator}>
            <Ionicons name="shield-checkmark" size={10} color="#10b981" />
            <Text style={styles.ocrValidatedText}>OCR ✓</Text>
          </View>
        )}
        
        {/* Upload date */}
        <Text style={styles.uploadDate}>
          {file.uploadedAt ? 
            new Date(file.uploadedAt).toLocaleDateString('th-TH') : 
            (file.uploadDate || "")
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fileItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 12,
    padding: 10,
    minWidth: 120,
    alignItems: 'center',
    flexDirection: 'row',
  },
  filePreview: {
    alignItems: 'left',
    marginBottom: 8,
  },
  fileIconContainer: {
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 8,
    position: 'relative',
    marginBottom: 4,
  },
  cloudIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: "#d1fae5",
    borderRadius: 8,
    padding: 2,
  },
  fileDetails: {
    paddingHorizontal: 16,
    alignItems: 'left',
    width: '100%',
  },
  fileName: {
    paddingHorizontal: 16,
    alignItems: 'left',
    fontSize: 11,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  fileSize: {
    paddingHorizontal: 16,
    fontSize: 10,
    color: "#9ca3af",
    marginBottom: 2,
  },
  ocrValidatedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#d1fae5",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  ocrValidatedText: {
    fontSize: 8,
    color: "#065f46",
    fontWeight: "600",
    marginLeft: 2,
  },
  uploadDate: {
    paddingHorizontal: 16,
    alignItems: 'left',
    fontSize: 9,
    color: "#9ca3af",
  },
});

export default FileItem;
