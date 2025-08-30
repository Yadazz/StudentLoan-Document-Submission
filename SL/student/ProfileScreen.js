import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { doc, getDoc } from "firebase/firestore";

// You should import auth and db from your own Firebase configuration file
import { auth, db } from "../database/firebase";

const formatAddress = (address) => {
  if (!address) return "ไม่มีข้อมูลที่อยู่";
  const { house_no, moo, village, soi, road, sub_district, district, province, zipcode } = address;
  const parts = [
    `บ้านเลขที่ ${house_no}`,
    moo && `หมู่ที่ ${moo}`,
    village && `หมู่บ้าน ${village}`,
    soi && `ซอย ${soi}`,
    road && `ถนน ${road}`,
    `ตำบล${sub_district}`,
    `อำเภอ${district}`,
    `จังหวัด${province}`,
    `รหัสไปรษณีย์ ${zipcode}`
  ].filter(Boolean);
  return parts.join(', ');
};

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            console.log("No such user in Firestore!");
          }
        } catch (error) {
          console.error("Error getting user data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log("No user is signed in");
        setLoading(false);
        if (navigation) {
          navigation.navigate("LoginScreen");
        }
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  const profileSection = (title, items) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        item.value ? (
          <Text key={index} style={styles.profileItem}>
            <Text style={{ fontWeight: 'bold' }}>{item.label}: </Text>
            {item.value}
          </Text>
        ) : null
      ))}
    </View>
  );

  const renderUserInfo = () => {
    if (!userData) return null;
    const {
      name, citizen_id, birth_date, phone_number, email,
      school, major, student_id, siblings_count,
      address_perm, address_current, father_info, mother_info, guardian_info
    } = userData;
  
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {profileSection("ข้อมูลนักศึกษา", [
          { label: "ชื่อ-นามสกุล", value: name},
          { label: "เลขบัตรประจำตัวประชาชน", value: citizen_id },
          { label: "วันเดือนปีเกิด", value: birth_date ? new Date(birth_date.seconds * 1000).toLocaleDateString("th-TH") : null },
          { label: "เบอร์มือถือ", value: phone_number },
          { label: "อีเมล", value: email },
          { label: "สำนักวิชา", value: school },
          { label: "สาขาวิชา", value: major },
          { label: "รหัสประจำตัวนักศึกษา", value: student_id },
          { label: "จำนวนพี่น้องที่กำลังศึกษาอยู่", value: siblings_count },
          { label: "ที่อยู่ตามทะเบียนบ้าน", value: formatAddress(address_perm) },
          { label: "ที่อยู่ปัจจุบัน", value: formatAddress(address_current) },
        ])}
  
        {father_info && profileSection("ข้อมูลบิดา", [
          { label: "ชื่อ-นามสกุล", value: father_info.name },
          { label: "เลขที่บัตรประชาชน", value: father_info.citizen_id },
          { label: "เบอร์โทรศัพท์", value: father_info.phone_number },
          { label: "ระดับการศึกษา", value: father_info.education_level },
          { label: "ที่อยู่ตามทะเบียนบ้าน", value: formatAddress(father_info.address_perm) },
          { label: "ที่อยู่ปัจจุบัน", value: formatAddress(father_info.address_current) },
        ])}
  
        {mother_info && profileSection("ข้อมูลมารดา", [
          { label: "ชื่อ-นามสกุล", value: mother_info.name },
          { label: "เลขที่บัตรประชาชน", value: mother_info.citizen_id },
          { label: "เบอร์โทรศัพท์", value: mother_info.phone_number },
          { label: "ระดับการศึกษา", value: mother_info.education_level },
          { label: "ที่อยู่ตามทะเบียนบ้าน", value: formatAddress(mother_info.address_perm) },
          { label: "ที่อยู่ปัจจุบัน", value: formatAddress(mother_info.address_current) },
        ])}
  
        {guardian_info && profileSection("ข้อมูลผู้ปกครอง", [
          { label: "ชื่อ-นามสกุล", value: guardian_info.name },
          { label: "เลขที่บัตรประชาชน", value: guardian_info.citizen_id },
          { label: "เบอร์โทรศัพท์", value: guardian_info.phone_number },
          { label: "ระดับการศึกษา", value: guardian_info.education_level },
          { label: "เกี่ยวข้องกับผู้กู้เป็น", value: guardian_info.relation },
          { label: "ที่อยู่ตามทะเบียนบ้าน", value: formatAddress(guardian_info.address_perm) },
          { label: "ที่อยู่ปัจจุบัน", value: formatAddress(guardian_info.address_current) },
        ])}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text style={{ marginTop: 10 }}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>ข้อมูลผู้ใช้ไม่พบ</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.profileTitle}>ข้อมูลโปรไฟล์</Text>
      {renderUserInfo()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f2f5",
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 50,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  profileItem: {
    fontSize: 16,
    color: "#555",
    marginVertical: 4,
  },
});

export default ProfileScreen;
