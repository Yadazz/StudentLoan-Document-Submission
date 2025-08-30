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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../database/firebase";

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
  const [selectedFilter, setSelectedFilter] = useState("ทั้งหมด"); // ค่า default

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
          postType: data.postType || "ทั่วไป",
          createdAt: data.createdAt || null,
          documentName: data.documentName || "",
          documentURL: data.documentURL || "",
          mediaURLs: data.mediaURLs || [],
          ...data,
        };
      });

      // เรียงจากล่าสุดไปเก่า
      newsList.sort((a, b) => {
        // ถ้าใช้ Firestore Timestamp
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA; // มาก → น้อย = ล่าสุดก่อน
      });

      setNewsData(newsList);
    } catch (error) {
      console.error("❌ Error fetching news:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  // ฟิลเตอร์ข้อมูลตาม search + postType
  const filteredData = newsData.filter((item) => {
    const title = item.title || "";
    const search = searchText || "";
    const matchSearch = title.toLowerCase().includes(search.toLowerCase());

    if (selectedFilter === "ทั้งหมด") {
      return matchSearch;
    }
    return matchSearch && item.postType === selectedFilter;
  });

  // ตัวเลือก filter
  const filters = [
    "ทั้งหมด",
    "ทั่วไป",
    "ทุนการศึกษา",
    "ชั่วโมงจิตอาสา",
    "จ้างงาน",
  ];

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

      {/* Filter Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              selectedFilter === f && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === f && styles.filterTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={() => (
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Text style={{ fontSize: 16, color: "#777" }}>ไม่มีข้อมูล</Text>
            </View>
          )}
          contentContainerStyle={
            filteredData.length === 0 ? { flexGrow: 1 } : null
          }
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
    marginBottom: 10,
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

  // Filter bar
  filterScroll: {
    paddingVertical: 10,
    paddingLeft: 15,
  },
  filterButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    height: 40, // กำหนดความสูงคงที่
    minWidth: 80, // กำหนดความกว้างขั้นต่ำ
    paddingHorizontal: 15,
  },
  filterButtonActive: {
    backgroundColor: "#1e90ff",
    borderColor: "#1e90ff",
  },
  filterText: {
    fontSize: 15,
    color: "#333",
    textAlign: "center",
    fontWeight: "normal",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },

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
    width: "90%", // ✅ หรือจะใช้ "100%" ก็ได้
    alignSelf: "center", // ให้การ์ดอยู่ตรงกลางแบบไม่บีบข้อความ
  },
  banner: { width: "100%", height: 180, borderRadius: 10, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "bold", color: "#222", marginBottom: 5 },
  description: { fontSize: 16, color: "#555", marginBottom: 10 },
  readMoreContainer: { alignItems: "flex-end" },
  readMore: { fontSize: 14, color: "#1e90ff", fontWeight: "500" },
});

export default HomeScreen;
