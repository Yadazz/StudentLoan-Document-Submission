import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
  SafeAreaView,
} from "react-native";
import RenderHtml from "react-native-render-html";

// props: item = object ของข่าวที่ส่งมาจาก FlatList
const NewsContent = ({ route }) => {
  const { item } = route.params; // รับ item จาก navigation
  const { width } = Dimensions.get("window");

  // ฟังก์ชันเปิดไฟล์ Document (PDF) ถ้ามี
  const openDocument = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Cannot open document:", err)
      );
    }
  };

  // ฟังก์ชันแสดง Media
  const renderMedia = () => {
    if (!item.mediaURLs || item.mediaURLs.length === 0) return null;

    return item.mediaURLs.map((media, index) => {
      // ถ้าเป็น YouTube link ให้เปิดผ่าน Linking
      if (media.includes("youtube.com") || media.includes("youtu.be")) {
        return (
          <TouchableOpacity
            key={index}
            onPress={() => Linking.openURL(media)}
            style={styles.mediaButton}
          >
            <Text style={styles.mediaText}>เปิดวิดีโอ</Text>
          </TouchableOpacity>
        );
      }

      // ถ้าเป็นรูปภาพ
      return (
        <Image key={index} source={{ uri: media }} style={styles.mediaImage} />
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ padding: 15 }}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{item.title || "ไม่มีหัวข้อ"}</Text>
          <Text style={styles.createdAt}>
            {item.createdAt && item.createdAt.toDate
              ? item.createdAt.toDate().toLocaleString("th-TH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "ไม่มีวันที่"}
          </Text>
        </View>

        {/* Media */}
        {renderMedia()}

        {/* Document / File */}
        {item.documentURL ? (
          <TouchableOpacity
            onPress={() => openDocument(item.documentURL)}
            style={styles.documentButton}
          >
            <Text style={styles.documentText}>เปิดเอกสาร</Text>
          </TouchableOpacity>
        ) : null}

        {/* Description ที่รองรับ HTML */}
        {item.description ? (
          <RenderHtml
            contentWidth={width - 30} // 30 = padding ซ้าย 15 + padding ขวา 15
            source={{
              html: `<div style="font-size: 16px; color: #000000ff; line-height: 22;">${item.description}</div>`,
            }}
            tagsStyles={htmlStyles}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  scrollContainer: {
    flex: 1,
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
  // เราจะไม่ใช้ description ในส่วนนี้แล้ว แต่จะใช้ tagsStyles แทน
});

const htmlStyles = {
  p: {
    fontSize: 16,
    color: "#000000ff",
    lineHeight: 22,
    marginBottom: 10,
  },
  strong: {
    fontWeight: "bold",
  },
  // สามารถเพิ่ม style สำหรับ tag อื่นๆ ได้ตามต้องการ เช่น
  em: {
    fontStyle: "italic",
  },
  ul: {
    marginBottom: 10,
  },
  li: {
    marginBottom: 5,
  },
};

export default NewsContent;
