import { useState } from "react";
import { 
  View, 
  TextInput, 
  Button, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView,
  TouchableOpacity 
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "./database/firebase";

const SignUpScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Basic Info
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [major, setMajor] = useState("");
  const [school, setSchool] = useState("");
  const [siblingsCount, setSiblingsCount] = useState("");
    // Date Picker state
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isFatherDatePickerVisible, setFatherDatePickerVisible] = useState(false);
  const [isMotherDatePickerVisible, setMotherDatePickerVisible] = useState(false);
  const [isGuardianDatePickerVisible, setGuardianDatePickerVisible] = useState(false);

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };
  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };
  const handleConfirm = (date) => {
    setBirthDate(Timestamp.fromDate(date)); // Store as Firestore Timestamp
    hideDatePicker();
  };

  const showFatherDatePicker = () => setFatherDatePickerVisible(true);
  const hideFatherDatePicker = () => setFatherDatePickerVisible(false);
  const handleFatherConfirm = (date) => {
    updateFatherInfo('birth_date', Timestamp.fromDate(date));
    hideFatherDatePicker();
  };

  const showMotherDatePicker = () => setMotherDatePickerVisible(true);
  const hideMotherDatePicker = () => setMotherDatePickerVisible(false);
  const handleMotherConfirm = (date) => {
    updateMotherInfo('birth_date', Timestamp.fromDate(date));
    hideMotherDatePicker();
  };

  const showGuardianDatePicker = () => setGuardianDatePickerVisible(true);
  const hideGuardianDatePicker = () => setGuardianDatePickerVisible(false);
  const handleGuardianConfirm = (date) => {
    updateGuardianInfo('birth_date', Timestamp.fromDate(date));
    hideGuardianDatePicker();
  };

  // Current Address
  const [currentAddress, setCurrentAddress] = useState({
    sub_district: "",
    moo: "",
    village: "",
    province: "",
    road: "",
    soi: "",
    district: "",
    house_no: "",
    zipcode: ""
  });

  // Permanent Address
  const [permAddress, setPermAddress] = useState({
    sub_district: "",
    moo: "",
    village: "",
    province: "",
    road: "",
    soi: "",
    district: "",
    house_no: "",
    zipcode: ""
  });

  // Father Info
  const [fatherInfo, setFatherInfo] = useState({
    name: "",
    citizen_id: "",
    birth_date: "",
    occupation: "",
    education_level: "",
    phone_number: "",
    email: "",
    nationality: "",
    income: "",
    address_current: {
      sub_district: "",
      moo: "",
      village: "",
      province: "",
      road: "",
      soi: "",
      district: "",
      house_no: "",
      zipcode: ""
    },
    address_perm: {
      sub_district: "",
      moo: "",
      village: "",
      province: "",
      road: "",
      soi: "",
      district: "",
      house_no: "",
      zipcode: ""
    },
    workplace: {
      name: "",
      district: "",
      house_no: "",
      moo: "",
      province: "",
      road: "",
      soi: "",
      sub_district: "",
      zipcode: ""
    }
  });

  // Mother Info
  const [motherInfo, setMotherInfo] = useState({
    name: "",
    citizen_id: "",
    birth_date: "",
    occupation: "",
    education_level: "",
    phone_number: "",
    email: "",
    nationality: "",
    income: "",
    address_current: {
      sub_district: "",
      moo: "",
      village: "",
      province: "",
      road: "",
      soi: "",
      district: "",
      house_no: "",
      zipcode: ""
    },
    address_perm: {
      sub_district: "",
      moo: "",
      village: "",
      province: "",
      road: "",
      soi: "",
      district: "",
      house_no: "",
      zipcode: ""
    },
    workplace: {
      name: "",
      district: "",
      house_no: "",
      moo: "",
      province: "",
      road: "",
      soi: "",
      sub_district: "",
      zipcode: ""
    }
  });

  // Guardian Info
  const [guardianInfo, setGuardianInfo] = useState({
    name: "",
    citizen_id: "",
    birth_date: "",
    occupation: "",
    education_level: "",
    phone_number: "",
    email: "",
    nationality: "",
    income: "",
    guardian_relation: "", // <-- เพิ่ม field ใหม่ตรงนี้
    address_current: {
      sub_district: "",
      moo: "",
      village: "",
      province: "",
      road: "",
      soi: "",
      district: "",
      house_no: "",
      zipcode: ""
    },
    address_perm: {
      sub_district: "",
      moo: "",
      village: "",
      province: "",
      road: "",
      soi: "",
      district: "",
      house_no: "",
      zipcode: ""
    },
    workplace: {
      name: "",
      district: "",
      house_no: "",
      moo: "",
      province: "",
      road: "",
      soi: "",
      sub_district: "",
      zipcode: ""
    }
  });

  // Helper functions for updating nested objects
  const updateCurrentAddress = (field, value) => {
    setCurrentAddress(prev => ({ ...prev, [field]: value }));
  };

  const updatePermAddress = (field, value) => {
    setPermAddress(prev => ({ ...prev, [field]: value }));
  };

  const updateFatherInfo = (field, value) => {
    setFatherInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateFatherAddress = (type, field, value) => {
    setFatherInfo(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const updateMotherInfo = (field, value) => {
    setMotherInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateMotherAddress = (type, field, value) => {
    setMotherInfo(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const updateGuardianInfo = (field, value) => {
    setGuardianInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateGuardianAddress = (type, field, value) => {
    setGuardianInfo(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  // Copy permanent address to current address
  const copyPermToCurrent = (setter, permData) => {
    setter(prev => ({ ...prev, address_current: { ...permData } }));
  };

  // Validation functions
  const validateStep1 = () => {
    return email && password && name && citizenId && studentId && birthDate && phoneNum;
  };

  const validateStep2 = () => {
    const required = ['house_no', 'sub_district', 'district', 'province', 'zipcode'];
    return required.every(field => currentAddress[field] && permAddress[field]);
  };

  // Handle Sign Up
  const handleSignUp = async () => {
    if (!validateStep1()) {
      Alert.alert("กรุณากรอกข้อมูล", "โปรดกรอกข้อมูลพื้นฐานให้ครบถ้วน");
      return;
    }

    // Show loading indicator
    Alert.alert("กำลังดำเนินการ", "โปรดรอสักครู่...", [], { cancelable: false });

    try {
      const authInstance = getAuth();
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
      const user = userCredential.user;
      
      const fatherIncome = parseInt(fatherInfo.income) || 0;
      const motherIncome = parseInt(motherInfo.income) || 0;
      const guardianIncome = parseInt(guardianInfo.income) || 0;

      // Prepare data for Firestore
      const userData = {
        // Basic Info
        citizen_id: citizenId,
        name: name,
        email: email,
        student_id: studentId,
        birth_date: birthDate,
        phone_num: phoneNum,
        major: major,
        school: school,
        siblings_count: parseInt(siblingsCount) || 0,
        
        // Addresses
        address_current: currentAddress,
        address_perm: permAddress,
        
        // Family Info
        father_info: {
          ...fatherInfo,
          income: fatherIncome
        },
        mother_info: {
          ...motherInfo,
          income: motherIncome
        },
        guardian_info: {
          ...guardianInfo,
          income: guardianIncome
        },
        
        // Metadata
        createdAt: new Date(),
        updatedAt: new Date(),
        profileComplete: true,
        status: 'active'
      };

      // Save to Firestore with error handling
      await setDoc(doc(db, "users", user.uid), userData);

      // Clear any stored progress
      // await AsyncStorage.removeItem('signupProgress');

      Alert.alert(
        "สำเร็จ", 
        "ลงทะเบียนเรียบร้อยแล้ว กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี", 
        [
          { 
            text: "ตกลง", 
            onPress: () => navigation.navigate("MainTabs") 
          }
        ]
      );

    } catch (error) {
      console.error("Sign up error:", error);
      
      // Detailed error handling
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "รูปแบบอีเมลไม่ถูกต้อง";
          break;
        case "auth/weak-password":
          errorMessage = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
          break;
        case "auth/email-already-in-use":
          errorMessage = "อีเมลนี้ถูกใช้งานแล้ว";
          break;
        case "permission-denied":
          errorMessage = "ไม่มีสิทธิ์ในการบันทึกข้อมูล";
          break;
        case "network-error":
          errorMessage = "ปัญหาการเชื่อมต่ออินเทอร์เน็ต โปรดลองอีกครั้ง";
          break;
        default:
          errorMessage = error.message || "เกิดข้อผิดพลาดในการลงทะเบียน";
      }
      
      Alert.alert("การลงทะเบียนไม่สำเร็จ", errorMessage);
    }
  };

  // Render Address Form
  const renderAddressForm = (addressData, updateFunction, title) => (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      
      <TextInput
        style={styles.input}
        placeholder="บ้านเลขที่"
        value={addressData.house_no}
        onChangeText={(text) => updateFunction('house_no', text)}
      />
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="หมู่"
          value={addressData.moo}
          onChangeText={(text) => updateFunction('moo', text)}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="หมู่บ้าน"
          value={addressData.village}
          onChangeText={(text) => updateFunction('village', text)}
        />
      </View>
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="ซอย"
          value={addressData.soi}
          onChangeText={(text) => updateFunction('soi', text)}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="ถนน"
          value={addressData.road}
          onChangeText={(text) => updateFunction('road', text)}
        />
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="ตำบล/แขวง"
        value={addressData.sub_district}
        onChangeText={(text) => updateFunction('sub_district', text)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="อำเภอ/เขต"
        value={addressData.district}
        onChangeText={(text) => updateFunction('district', text)}
      />
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="จังหวัด"
          value={addressData.province}
          onChangeText={(text) => updateFunction('province', text)}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="รหัสไปรษณีย์"
          value={addressData.zipcode}
          onChangeText={(text) => updateFunction('zipcode', text)}
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  // Render Parent/Guardian Form
  const renderPersonForm = (personData, updatePersonFunction, updateAddressFunction, title, type) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="ชื่อ-นามสกุล"
          value={personData.name}
          onChangeText={(text) => updatePersonFunction('name', text)}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="เลขบัตรประชาชน"
          value={personData.citizen_id}
          onChangeText={(text) => updatePersonFunction('citizen_id', text)}
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.row}>
        <TouchableOpacity 
          style={[styles.input, styles.halfInput]} 
          onPress={
            type === 'father' ? showFatherDatePicker :
            type === 'mother' ? showMotherDatePicker : showGuardianDatePicker
          }
        >
          <Text style={{ color: personData.birth_date ? 'black' : '#aaa' }}>
            {personData.birth_date ? `วันเกิด: ${personData.birth_date.toDate().toLocaleDateString()}` : "เลือกวันเกิด"}
          </Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={
            type === 'father' ? isFatherDatePickerVisible :
            type === 'mother' ? isMotherDatePickerVisible : isGuardianDatePickerVisible
          }
          mode="date"
          onConfirm={
            type === 'father' ? handleFatherConfirm :
            type === 'mother' ? handleMotherConfirm : handleGuardianConfirm
          }
          onCancel={
            type === 'father' ? hideFatherDatePicker :
            type === 'mother' ? hideMotherDatePicker : hideGuardianDatePicker
          }
        />

        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="สัญชาติ"
          value={personData.nationality}
          onChangeText={(text) => updatePersonFunction('nationality', text)}
        />
      </View>
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="อาชีพ"
          value={personData.occupation}
          onChangeText={(text) => updatePersonFunction('occupation', text)}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="ระดับการศึกษา"
          value={personData.education_level}
          onChangeText={(text) => updatePersonFunction('education_level', text)}
        />
      </View>
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="เบอร์โทรศัพท์"
          value={personData.phone_number}
          onChangeText={(text) => updatePersonFunction('phone_number', text)}
          keyboardType="phone-pad"
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="อีเมล"
          value={personData.email}
          onChangeText={(text) => updatePersonFunction('email', text)}
          keyboardType="email-address"
        />
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="รายได้ต่อเดือน"
        value={personData.income}
        onChangeText={(text) => updatePersonFunction('income', text)}
        keyboardType="numeric"
      />
      {type === 'guardian' && (
        <TextInput
          style={styles.input}
          placeholder="ความสัมพันธ์กับนักศึกษา"
          value={personData.guardian_relation}
          onChangeText={(text) => updatePersonFunction('guardian_relation', text)}
        />
      )}
      <Text style={styles.subTitle}>ที่อยู่ตามทะเบียนบ้าน</Text>
      {renderAddressForm(personData.address_perm, (field, value) => updateAddressFunction('address_perm', field, value), "")}
      
      <Text style={styles.subTitle}>ที่อยู่ปัจจุบัน</Text>
      <TouchableOpacity 
        style={styles.copyButton}
        onPress={() => copyPermToCurrent(
          type === 'father' ? setFatherInfo :
          type === 'mother' ? setMotherInfo : setGuardianInfo,
          personData.address_perm
        )}
      >
        <Text style={styles.copyButtonText}>คัดลอกที่อยู่ตามทะเบียนบ้าน</Text>
      </TouchableOpacity>
      {renderAddressForm(personData.address_current, (field, value) => updateAddressFunction('address_current', field, value), "")}
      
      <Text style={styles.subTitle}>ข้อมูลที่ทำงาน</Text>
      <TextInput
        style={styles.input}
        placeholder="ชื่อสถานที่ทำงาน"
        value={personData.workplace.name}
        onChangeText={(text) => updatePersonFunction('workplace', {...personData.workplace, name: text})}
      />
      {renderAddressForm(personData.workplace, (field, value) => updatePersonFunction('workplace', {...personData.workplace, [field]: value}), "")}
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>ขั้นตอนที่ 1: ข้อมูลพื้นฐาน</Text>
            
            <TextInput
              style={styles.input}
              placeholder="เลขบัตรประชาชน"
              value={citizenId}
              onChangeText={setCitizenId}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="รหัสนักศึกษา"
              value={studentId}
              onChangeText={setStudentId}
            />
            
            <TextInput
              style={styles.input}
              placeholder="ชื่อ-นามสกุล"
              value={name}
              onChangeText={setName}
            />
            
            {/* Birth Date Picker */}
            <TouchableOpacity style={styles.input} onPress={showDatePicker}>
              <Text style={{ color: birthDate ? 'black' : '#aaa' }}>
                {birthDate ? `วันเกิด: ${birthDate.toDate().toLocaleDateString()}` : "เลือกวันเกิด"}
              </Text>
            </TouchableOpacity>

            {/* Date Picker Modal */}
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
            />
            
            <TextInput
              style={styles.input}
              placeholder="เบอร์โทรศัพท์"
              value={phoneNum}
              onChangeText={setPhoneNum}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="สำนัก"
              value={school}
              onChangeText={setSchool}
            />

            <TextInput
              style={styles.input}
              placeholder="สาขาวิชา"
              value={major}
              onChangeText={setMajor}
            />
            
            
            
            <TextInput
              style={styles.input}
              placeholder="จำนวนพี่น้อง"
              value={siblingsCount}
              onChangeText={setSiblingsCount}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="อีเมล"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="รหัสผ่าน"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>ขั้นตอนที่ 2: ที่อยู่</Text>
            
            {renderAddressForm(permAddress, updatePermAddress, "ที่อยู่ตามทะเบียนบ้าน")}
            
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => setCurrentAddress({...permAddress})}
            >
              <Text style={styles.copyButtonText}>คัดลอกที่อยู่ตามทะเบียนบ้าน</Text>
            </TouchableOpacity>
            
            {renderAddressForm(currentAddress, updateCurrentAddress, "ที่อยู่ปัจจุบัน")}
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>ขั้นตอนที่ 3: ข้อมูลบิดา</Text>
            {renderPersonForm(fatherInfo, updateFatherInfo, updateFatherAddress, "ข้อมูลบิดา", "father")}
          </View>
        );
      
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>ขั้นตอนที่ 4: ข้อมูลมารดา</Text>
            {renderPersonForm(motherInfo, updateMotherInfo, updateMotherAddress, "ข้อมูลมารดา", "mother")}
          </View>
        );
      
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>ขั้นตอนที่ 5: ข้อมูลผู้ปกครอง</Text>
            {renderPersonForm(guardianInfo, updateGuardianInfo, updateGuardianAddress, "ข้อมูลผู้ปกครอง", "guardian")}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>ลงทะเบียน</Text>
        
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View
              key={step}
              style={[
                styles.progressStep,
                currentStep >= step ? styles.activeStep : styles.inactiveStep
              ]}
            >
              <Text style={styles.progressText}>{step}</Text>
            </View>
          ))}
        </View>
        
        {renderStep()}
        
        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <Text style={styles.buttonText}>ก่อนหน้า</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < 5 ? (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={() => setCurrentStep(currentStep + 1)}
            >
              <Text style={styles.buttonText}>ถัดไป</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.submitButton]}
              onPress={handleSignUp}
            >
              <Text style={styles.buttonText}>ลงทะเบียน</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Login link */}
        <Text style={styles.loginText}>
          มีบัญชีแล้ว?{" "}
          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate("LoginScreen")}
          >
            เข้าสู่ระบบ
          </Text>
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#333",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  activeStep: {
    backgroundColor: "#1e90ff",
  },
  inactiveStep: {
    backgroundColor: "#ccc",
  },
  progressText: {
    color: "white",
    fontWeight: "bold",
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e90ff",
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 15,
    color: "#666",
  },
  input: {
    width: "100%",
    height: 45,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "white",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  copyButton: {
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  copyButtonText: {
    color: "white",
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  prevButton: {
    backgroundColor: "#6c757d",
  },
  nextButton: {
    backgroundColor: "#1e90ff",
  },
  submitButton: {
    backgroundColor: "#28a745",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginText: {
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  loginLink: {
    color: "#1e90ff",
    fontWeight: "bold",
  },
});

export default SignUpScreen;
