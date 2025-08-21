import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from "react-native";

// props: item = object ของข่าวที่ส่งมาจาก FlatList
const NewsContent = ({ route }) => {
  const { item } = route.params; // รับ item จาก navigation

  // ฟังก์ชันเปิดไฟล์ Document (PDF) ถ้ามี
  const openDocument = () => {
    if (item.Document) {
      Linking.openURL(item.Document).catch((err) =>
        console.error("Cannot open document:", err)
      );
    }
  };

  // ฟังก์ชันแสดง Media
  const renderMedia = () => {
    if (!item.Media) return null;

    // ถ้าเป็น YouTube link ให้เปิดผ่าน Linking
    if (item.Media.includes("youtube.com") || item.Media.includes("youtu.be")) {
      return (
        <TouchableOpacity
          onPress={() => Linking.openURL(item.Media)}
          style={styles.mediaButton}
        >
          <Text style={styles.mediaText}>เปิดวิดีโอ</Text>
        </TouchableOpacity>
      );
    }

    // ถ้าเป็นรูปภาพ
    return <Image source={{ uri: item.Media }} style={styles.mediaImage} />;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 15 }}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{item.Title}</Text>
        <Text style={styles.createdAt}>
          {item["CreateAt"].toDate().toLocaleString("th-TH", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </Text>
      </View>

      {/* Media */}
      {renderMedia()}

      {/* Document / File */}
      {item.Document ? (
        <TouchableOpacity onPress={openDocument} style={styles.documentButton}>
          <Text style={styles.documentText}>เปิดเอกสาร</Text>
        </TouchableOpacity>
      ) : null}

      {/* Description */}
      {item.Description ? (
        <Text style={styles.description}>{item.Description}</Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  titleContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  createdAt: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  mediaImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  mediaButton: {
    backgroundColor: "#1e90ff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  mediaText: {
    color: "#fff",
    fontWeight: "500",
  },
  documentButton: {
    backgroundColor: "#32cd32",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  documentText: {
    color: "#fff",
    fontWeight: "500",
  },
  description: {
    fontSize: 16,
    color: "#000000ff",
    lineHeight: 22,
  },
});

export default NewsContent;
