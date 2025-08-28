import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  StatusBar,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../database/firebase";

const Stack = createNativeStackNavigator();

// Props
const NewsItem = ({ item, navigation }) => {
  return (
    <View style={styles.card}>
      {item.bannerURL ? (
        <Image
          source={{
            uri:
              item.bannerURL ||
              "https://via.placeholder.com/300x200.png?text=No+Image",
          }}
          style={styles.banner}
        />
      ) : null}
      <Text style={styles.title}>{item.title || "ไม่มีหัวข้อ"}</Text>
      <Text style={styles.description} numberOfLines={3}>
        {item.description
          ? item.description.replace(/<[^>]+>/g, "")
          : "ไม่มีรายละเอียด"}
      </Text>
      <TouchableOpacity
        style={styles.readMoreContainer}
        onPress={() => navigation.navigate("NewsContent", { item })}
      >
        <Text style={styles.readMore}>อ่านเพิ่มเติม</Text>
      </TouchableOpacity>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ค้นหา Lowercase - แก้ไขให้ปลอดภัย
  const filteredData = newsData.filter((item) => {
    const title = item.title || "";
    const search = searchText || "";
    return String(title).toLowerCase().includes(String(search).toLowerCase());
  });

  // โหลดข้อมูลจาก Firestore
  const fetchNews = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "news"));
      const newsList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "",
          description: data.description || "",
          bannerURL: data.bannerURL || "",
          createdAt: data.createdAt || null,
          documentName: data.documentName || "",
          documentURL: data.documentURL || "",
          mediaURLs: data.mediaURLs || [],
          ...data,
        };
      });
      setNewsData(newsList);
    } catch (error) {
      console.error("❌ Error fetching news:", error);
    } finally {
      setLoading(false);
      setRefreshing(false); // ปิด refresh หลังโหลดเสร็จ
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // ฟังก์ชันสำหรับ Pull-to-Refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBarContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหา..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={(text) => setSearchText(text || "")}
          />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("ProfileScreen")}>
          <Ionicons name="person-circle-outline" size={30} color="#333" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color="#1e90ff"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={({ item }) => (
            <NewsItem item={item} navigation={navigation} />
          )}
          keyExtractor={(item) => item.id}
          refreshing={refreshing} // เพิ่ม prop refreshing
          onRefresh={handleRefresh} // เพิ่ม prop onRefresh
        />
      )}

      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    paddingTop: 50,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flex: 1,
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#333" },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 20,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  banner: { width: "100%", height: 180, borderRadius: 10, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "bold", color: "#222", marginBottom: 5 },
  description: { fontSize: 16, color: "#555", marginBottom: 10 },
  readMoreContainer: { alignItems: "flex-end" },
  readMore: { fontSize: 14, color: "#1e90ff", fontWeight: "500" },
});

export default HomeScreen;
