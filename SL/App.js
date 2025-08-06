import { StyleSheet, Text, View, TextInput, StatusBar } from "react-native"; // เปลี่ยนการนำเข้า StatusBar
import { Ionicons } from "@expo/vector-icons"; // นำเข้า Ionicons สำหรับไอคอน

export default function App() {
  return (
    <View style={styles.container}>
      {/* ส่วนหัวสำหรับแถบค้นหาและไอคอนโปรไฟล์ */}
      <View style={styles.header}>
        {/* คอนเทนเนอร์สำหรับแถบค้นหา */}
        <View style={styles.searchBarContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหา..." // ข้อความตัวอย่างในช่องค้นหา
            placeholderTextColor="#888"
          />
        </View>
        {/* ไอคอนโปรไฟล์ */}
        <Ionicons name="person-circle-outline" size={30} color="#333" />
      </View>

      {/* เนื้อหาเดิมของแอป */}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5", // เปลี่ยนสีพื้นหลังเล็กน้อยเพื่อให้ดูดีขึ้น
    paddingTop: 50, // เพิ่ม padding ด้านบนเพื่อหลีกเลี่ยง StatusBar
    alignItems: "center",
    // ไม่ต้อง justify-content: 'center' สำหรับ container หลักอีกต่อไป เพราะ header จะอยู่ด้านบน
  },
  header: {
    flexDirection: "row", // จัดเรียงองค์ประกอบในแนวนอน
    alignItems: "center", // จัดแนวตั้งให้อยู่ตรงกลาง
    justifyContent: "space-between", // กระจายพื้นที่ระหว่างองค์ประกอบ
    width: "90%", // กำหนดความกว้างของ header
    paddingHorizontal: 10,
    marginBottom: 20, // เพิ่มระยะห่างด้านล่าง
  },
  searchBarContainer: {
    flexDirection: "row", // จัดเรียงไอคอนและ TextInput ในแนวนอน
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25, // ทำให้ขอบมน
    paddingHorizontal: 15,
    paddingVertical: 8,
    flex: 1, // ให้แถบค้นหาขยายเต็มพื้นที่ที่เหลือ
    marginRight: 15, // ระยะห่างระหว่างแถบค้นหากับไอคอนโปรไฟล์
    shadowColor: "#000", // เพิ่มเงาเล็กน้อย
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10, // ระยะห่างระหว่างไอคอนแว่นขยายกับ TextInput
  },
  searchInput: {
    flex: 1, // ทำให้ TextInput ขยายเต็มพื้นที่ที่เหลือ // กำหนดความสูงของ TextInput
    fontSize: 16,
    color: "#333",
  },
  mainContentText: {
    marginTop: 20, // เพิ่มระยะห่างจาก header
    fontSize: 16,
    color: "#555",
  },
});
