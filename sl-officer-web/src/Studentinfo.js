import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./database/firebase";

export default function StudentInfo() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add", "edit", "view"
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSchool, setFilterSchool] = useState("");
  const [filterMajor, setFilterMajor] = useState("");
  const [schools, setSchools] = useState([]);
  const [majors, setMajors] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    student_id: "",
    citizen_id: "",
    phone_num: "",
    email: "",
    school: "",
    major: "",
    siblings_count: "",
    address_current: {
      house_no: "",
      moo: "",
      village: "",
      soi: "",
      road: "",
      sub_district: "",
      district: "",
      province: "",
      zipcode: "",
    },
    address_perm: {
      house_no: "",
      moo: "",
      village: "",
      soi: "",
      road: "",
      sub_district: "",
      district: "",
      province: "",
      zipcode: "",
    },
    father_info: {
      name: "",
      citizen_id: "",
      phone_number: "",
      education_level: "",
      email: "",
      address_current: {
        house_no: "",
        moo: "",
        village: "",
        soi: "",
        road: "",
        sub_district: "",
        district: "",
        province: "",
        zipcode: "",
      },
    },
    mother_info: {
      name: "",
      citizen_id: "",
      phone_number: "",
      education_level: "",
      email: "",
      address_current: {
        house_no: "",
        moo: "",
        village: "",
        soi: "",
        road: "",
        sub_district: "",
        district: "",
        province: "",
        zipcode: "",
      },
    },
    guardian_info: {
      name: "",
      citizen_id: "",
      phone_number: "",
      education_level: "",
      email: "",
      address_current: {
        house_no: "",
        moo: "",
        village: "",
        soi: "",
        road: "",
        sub_district: "",
        district: "",
        province: "",
        zipcode: "",
      },
    },
    survey: {
      familyStatus: "",
      fatherIncome: "",
      motherIncome: "",
      guardianIncome: "",
      legalStatus: "",
      livingWith: "",
      parentLegalStatus: "",
      timestamp: new Date(),
    },
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filterSchool, filterMajor]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest(".dropdown-container")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "users"));
      const studentsData = [];
      const schoolsSet = new Set();
      const majorsSet = new Set();

      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        studentsData.push(data);

        if (data.school) schoolsSet.add(data.school);
        if (data.major) majorsSet.add(data.major);
      });

      setStudents(studentsData);
      setSchools([...schoolsSet].sort());
      setMajors([...majorsSet].sort());
    } catch (error) {
      console.error("Error fetching students:", error);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Search by name, student_id, or email
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.student_id
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by school
    if (filterSchool) {
      filtered = filtered.filter((student) => student.school === filterSchool);
    }

    // Filter by major
    if (filterMajor) {
      filtered = filtered.filter((student) => student.major === filterMajor);
    }

    setFilteredStudents(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nickname: "",
      student_id: "",
      citizen_id: "",
      phone_num: "",
      email: "",
      school: "",
      major: "",
      siblings_count: "",
      address_current: {
        house_no: "",
        moo: "",
        village: "",
        soi: "",
        road: "",
        sub_district: "",
        district: "",
        province: "",
        zipcode: "",
      },
      address_perm: {
        house_no: "",
        moo: "",
        village: "",
        soi: "",
        road: "",
        sub_district: "",
        district: "",
        province: "",
        zipcode: "",
      },
      father_info: {
        name: "",
        citizen_id: "",
        phone_number: "",
        education_level: "",
        email: "",
        address_current: {
          house_no: "",
          moo: "",
          village: "",
          soi: "",
          road: "",
          sub_district: "",
          district: "",
          province: "",
          zipcode: "",
        },
      },
      mother_info: {
        name: "",
        citizen_id: "",
        phone_number: "",
        education_level: "",
        email: "",
        address_current: {
          house_no: "",
          moo: "",
          village: "",
          soi: "",
          road: "",
          sub_district: "",
          district: "",
          province: "",
          zipcode: "",
        },
      },
      guardian_info: {
        name: "",
        citizen_id: "",
        phone_number: "",
        education_level: "",
        email: "",
        address_current: {
          house_no: "",
          moo: "",
          village: "",
          soi: "",
          road: "",
          sub_district: "",
          district: "",
          province: "",
          zipcode: "",
        },
      },
      survey: {
        familyStatus: "",
        fatherIncome: "",
        motherIncome: "",
        guardianIncome: "",
        legalStatus: "",
        livingWith: "",
        parentLegalStatus: "",
        timestamp: new Date(),
      },
    });
  };

  const openModal = (mode, student = null) => {
    setModalMode(mode);
    setSelectedStudent(student);
    setOpenDropdown(null); // Close dropdown when opening modal

    if (mode === "add") {
      resetForm();
    } else if (student) {
      setFormData({ ...student });
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    resetForm();
  };

  const handleInputChange = (path, value) => {
    const keys = path.split(".");
    setFormData((prev) => {
      const newData = { ...prev };
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = async () => {
    try {
      if (modalMode === "add") {
        await addDoc(collection(db, "users"), {
          ...formData,
          createdAt: new Date(),
        });
        alert("เพิ่มข้อมูลนักศึกษาสำเร็จ!");
      } else if (modalMode === "edit") {
        await updateDoc(doc(db, "users", selectedStudent.id), {
          ...formData,
          updatedAt: new Date(),
        });
        alert("แก้ไขข้อมูลนักศึกษาสำเร็จ!");
      }

      closeModal();
      fetchStudents();
    } catch (error) {
      console.error("Error saving student:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleDelete = async (studentId) => {
    if (window.confirm("ต้องการลบข้อมูลนักศึกษานี้ใช่หรือไม่?")) {
      try {
        await deleteDoc(doc(db, "users", studentId));
        alert("ลบข้อมูลนักศึกษาสำเร็จ!");
        fetchStudents();
        setOpenDropdown(null);
      } catch (error) {
        console.error("Error deleting student:", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  const toggleDropdown = (studentId) => {
    setOpenDropdown(openDropdown === studentId ? null : studentId);
  };

  const handleDropdownAction = (action, student) => {
    setOpenDropdown(null);

    switch (action) {
      case "view":
        openModal("view", student);
        break;
      case "edit":
        openModal("edit", student);
        break;
      case "delete":
        handleDelete(student.id);
        break;
      default:
        break;
    }
  };

  const renderFormField = (label, path, placeholder = "") => (
    <div style={styles.field}>
      <label style={styles.label}>{label}:</label>
      <input
        type="text"
        value={getNestedValue(formData, path) || ""}
        onChange={(e) => handleInputChange(path, e.target.value)}
        placeholder={placeholder}
        style={styles.input}
        disabled={modalMode === "view"}
      />
    </div>
  );

  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  const renderAddressForm = (title, basePath) => (
    <div style={styles.section}>
      <h4 style={styles.sectionTitle}>{title}</h4>
      {renderFormField("บ้านเลขที่", `${basePath}.house_no`)}
      {renderFormField("หมู่", `${basePath}.moo`)}
      {renderFormField("หมู่บ้าน", `${basePath}.village`)}
      {renderFormField("ซอย", `${basePath}.soi`)}
      {renderFormField("ถนน", `${basePath}.road`)}
      {renderFormField("ตำบล/แขวง", `${basePath}.sub_district`)}
      {renderFormField("อำเภอ/เขต", `${basePath}.district`)}
      {renderFormField("จังหวัด", `${basePath}.province`)}
      {renderFormField("รหัสไปรษณีย์", `${basePath}.zipcode`)}
    </div>
  );

  const renderParentForm = (title, basePath) => (
    <div style={styles.section}>
      <h4 style={styles.sectionTitle}>{title}</h4>
      {renderFormField("ชื่อ-นามสกุล", `${basePath}.name`)}
      {renderFormField("เลขบัตรประชาชน", `${basePath}.citizen_id`)}
      {renderFormField("เบอร์โทรศัพท์", `${basePath}.phone_number`)}
      {renderFormField("ระดับการศึกษา", `${basePath}.education_level`)}
      {renderFormField("อีเมล", `${basePath}.email`)}
      {renderAddressForm("ที่อยู่", `${basePath}.address_current`)}
    </div>
  );

  // เพิ่มฟังก์ชันสุ่มข้อมูล (วางไว้ด้านบน StudentInfo หรือใน scope เดียวกับ StudentInfo)
  const randomHelpers = {
    thaiFirstNames: [
      "ธนกร",
      "ภูมิ",
      "กันตพงศ์",
      "ณัฐวุฒิ",
      "ศุภณัฐ",
      "วรรณิดา",
      "ปิยะดา",
      "กัญญา",
      "ณัฐธิดา",
      "ชนิกา",
    ],
    thaiLastNames: [
      "รักษ์ไทย",
      "สุขสันต์",
      "ใจดี",
      "รุ่งเรือง",
      "มั่นคง",
      "สว่างวงศ์",
      "ศรีสุข",
      "บุญมี",
      "วงศ์ทอง",
      "จันทร์เพ็ญ",
    ],
    schools: [
      "สำนักวิชาวิศวกรรมศาสตร์",
      "สำนักวิชาวิทยาศาสตร์",
      "สำนักวิชาเทคโนโลยีสังคม",
    ],
    majors: {
      "สำนักวิชาวิศวกรรมศาสตร์": [
        "วิศวกรรมคอมพิวเตอร์",
        "วิศวกรรมไฟฟ้า",
        "วิศวกรรมโยธา",
      ],
      "สำนักวิชาวิทยาศาสตร์": ["คณิตศาสตร์", "ฟิสิกส์", "เคมี"],
      "สำนักวิชาเทคโนโลยีสังคม": ["เทคโนโลยีสารสนเทศ", "นิเทศศาสตร์"],
    },
    locations: {
      นครราชสีมา: {
        "เมืองนครราชสีมา": [
          "ในเมือง",
          "หัวทะเล",
          "โพธิ์กลาง",
          "หนองจะบก",
          "หนองไผ่ล้อม",
        ],
        ปากช่อง: [
          "ปากช่อง",
          "หนองสาหร่าย",
          "กลางดง",
          "จันทึก",
          "วังไทร",
        ],
        พิมาย: [
          "ในเมือง",
          "กระชอน",
          "ท่าหลวง",
          "รังกาใหญ่",
          "ชีวาน",
        ],
        สีคิ้ว: [
          "สีคิ้ว",
          "บ้านหัน",
          "กุดน้อย",
          "หนองบัวน้อย",
          "มิตรภาพ",
        ],
      },
      ขอนแก่น: {
        "เมืองขอนแก่น": [
          "ในเมือง",
          "บ้านเป็ด",
          "ศิลา",
          "บ้านทุ่ม",
          "สำราญ",
        ],
        น้ำพอง: [
          "น้ำพอง",
          "วังชัย",
          "ท่ากระเสริม",
          "หนองกุง",
          "บัวเงิน",
        ],
        ชุมแพ: [
          "ชุมแพ",
          "โนนหัน",
          "นาหนองทุ่ม",
          "หนองไผ่",
          "ไชยสอ",
        ],
      },
      สุรินทร์: {
        "เมืองสุรินทร์": [
          "ในเมือง",
          "นอกเมือง",
          "แสลงพันธ์",
          "เฉนียง",
          "ตั้งใจ",
        ],
        ปราสาท: ["กังแอน", "ทุ่งมน", "ไพล", "สมุด", "โคกยาง"],
        ศีขรภูมิ: ["ระแงง", "หนองขวาว", "ตรึม", "แตล", "หนองบัว"],
      },
    },
    randomNumber: (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min,
    randomFromArray: (arr) => arr[Math.floor(Math.random() * arr.length)],
    randomPhoneNumber: () => {
      const prefix = ["06", "08", "09"];
      return `${randomHelpers.randomFromArray(prefix)}${Array(8)
        .fill(0)
        .map(() => randomHelpers.randomNumber(0, 9))
        .join("")}`;
    },
    randomAddress: () => {
      const province = randomHelpers.randomFromArray(Object.keys(randomHelpers.locations));
      const district = randomHelpers.randomFromArray(Object.keys(randomHelpers.locations[province]));
      const subDistrict = randomHelpers.randomFromArray(randomHelpers.locations[province][district]);
      return {
        house_no: randomHelpers.randomNumber(1, 999).toString(),
        moo: randomHelpers.randomNumber(1, 12).toString(),
        village: `หมู่บ้านสุขสันต์ ${randomHelpers.randomNumber(1, 5)}`,
        soi: `ซอย ${randomHelpers.randomNumber(1, 20)}`,
        road: randomHelpers.randomFromArray([
          "ถนนมิตรภาพ",
          "ถนนสุรนารี",
          "ถนนราชดำเนิน",
          "ถนนชยางกูร",
          "ถนนมหาดไทย",
        ]),
        sub_district: subDistrict,
        district: district,
        province: province,
        zipcode: randomHelpers.randomNumber(30000, 39999).toString(),
      };
    },
  };

  // เพิ่มฟังก์ชันสุ่มข้อมูลนักศึกษา (เฉพาะ text field, survey เป็น null)
  const generateRandomData = () => {
    const randomSchool = randomHelpers.randomFromArray(randomHelpers.schools);
    const randomMajor = randomHelpers.randomFromArray(randomHelpers.majors[randomSchool]);
    setFormData({
      name: `${randomHelpers.randomFromArray(randomHelpers.thaiFirstNames)} ${randomHelpers.randomFromArray(randomHelpers.thaiLastNames)}`,
      nickname: randomHelpers.randomFromArray(["นิด", "หน่อย", "ต้น", "บี", "เอ", "แบงค์", "มด"]),
      student_id: `B${randomHelpers.randomNumber(6000000, 6999999)}`,
      citizen_id: Array(13).fill(0).map(() => randomHelpers.randomNumber(0, 9)).join(""),
      phone_num: randomHelpers.randomPhoneNumber(),
      email: `b${randomHelpers.randomNumber(6000000, 6999999)}@g.sut.ac.th`,
      school: randomSchool,
      major: randomMajor,
      siblings_count: randomHelpers.randomNumber(0, 5).toString(),
      address_current: randomHelpers.randomAddress(),
      address_perm: randomHelpers.randomAddress(),
      father_info: {
        name: `${randomHelpers.randomFromArray(randomHelpers.thaiFirstNames)} ${randomHelpers.randomFromArray(randomHelpers.thaiLastNames)}`,
        citizen_id: Array(13).fill(0).map(() => randomHelpers.randomNumber(0, 9)).join(""),
        phone_number: randomHelpers.randomPhoneNumber(),
        education_level: randomHelpers.randomFromArray(["ปริญญาตรี", "ปริญญาโท", "มัธยมศึกษา", "ประถมศึกษา"]),
        email: `father${randomHelpers.randomNumber(1000, 9999)}@email.com`,
        address_current: randomHelpers.randomAddress()
      },
      mother_info: {
        name: `${randomHelpers.randomFromArray(randomHelpers.thaiFirstNames)} ${randomHelpers.randomFromArray(randomHelpers.thaiLastNames)}`,
        citizen_id: Array(13).fill(0).map(() => randomHelpers.randomNumber(0, 9)).join(""),
        phone_number: randomHelpers.randomPhoneNumber(),
        education_level: randomHelpers.randomFromArray(["ปริญญาตรี", "ปริญญาโท", "มัธยมศึกษา", "ประถมศึกษา"]),
        email: `mother${randomHelpers.randomNumber(1000, 9999)}@email.com`,
        address_current: randomHelpers.randomAddress()
      },
      guardian_info: {
        name: `${randomHelpers.randomFromArray(randomHelpers.thaiFirstNames)} ${randomHelpers.randomFromArray(randomHelpers.thaiLastNames)}`,
        citizen_id: Array(13).fill(0).map(() => randomHelpers.randomNumber(0, 9)).join(""),
        phone_number: randomHelpers.randomPhoneNumber(),
        education_level: randomHelpers.randomFromArray(["ปริญญาตรี", "ปริญญาโท", "มัธยมศึกษา", "ประถมศึกษา"]),
        email: `guardian${randomHelpers.randomNumber(1000, 9999)}@email.com`,
        address_current: randomHelpers.randomAddress()
      },
      survey: {
        familyStatus: null,
        fatherIncome: null,
        motherIncome: null,
        guardianIncome: null,
        legalStatus: null,
        livingWith: null,
        parentLegalStatus: null,
        timestamp: new Date()
      }
    });
  };

  if (loading) {
    return (
      <div style={styles.containerCenter}>
        <div style={styles.loading}>กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>จัดการข้อมูลนักศึกษา</h1>
        <button onClick={() => openModal("add")} style={styles.addButton}>
          + เพิ่มนักศึกษาใหม่
        </button>
      </div>

      {/* Search and Filter Section */}
      <div style={styles.filterSection}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="ค้นหาด้วย ชื่อ, รหัสนักศึกษา หรือ อีเมล"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterContainer}>
          <select
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">ทุกสำนักวิชา</option>
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>

          <select
            value={filterMajor}
            onChange={(e) => setFilterMajor(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">ทุกสาขาวิชา</option>
            {majors.map((major) => (
              <option key={major} value={major}>
                {major}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm("");
              setFilterSchool("");
              setFilterMajor("");
            }}
            style={styles.clearButton}
          >
            ล้างการกรอง
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <div style={styles.resultsCount}>
            พบข้อมูล {filteredStudents.length} รายการ จากทั้งหมด{" "}
            {students.length} รายการ
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr style={styles.tableRow}>
              <th style={styles.tableHeaderCell}>รหัสนักศึกษา</th>
              <th style={styles.tableHeaderCell}>ชื่อ-นามสกุล</th>
              <th style={styles.tableHeaderCell}>คณะ</th>
              <th style={styles.tableHeaderCell}>สาขา</th>
              <th style={styles.tableHeaderCell}></th> {/* ย้ายไปท้ายสุด */}
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} style={styles.tableRow}>
                <td style={styles.tableCell}>{student.student_id}</td>
                <td style={styles.tableCell}>{student.name}</td>
                <td style={styles.tableCell}>{student.school}</td>
                <td style={styles.tableCell}>{student.major}</td>
                <td style={styles.tableCell}>
                  <div
                    style={styles.dropdownContainer}
                    className="dropdown-container"
                  >
                    <button
                      style={styles.dotsButton}
                      onClick={(e) => {
                        e.stopPropagation(); // เพิ่มเพื่อป้องกันการ bubble
                        toggleDropdown(student.id);
                      }}
                    >
                      ⋮
                    </button>
                    {openDropdown === student.id && (
                      <div style={styles.dropdownMenu}>
                        <button
                          style={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation(); // เพิ่มเพื่อป้องกันการ bubble
                            handleDropdownAction("view", student);
                          }}
                        >
                          ดูข้อมูล
                        </button>
                        <button
                          style={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDropdownAction("edit", student);
                          }}
                        >
                          แก้ไข
                        </button>
                        <button
                          style={styles.dropdownItemDelete}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDropdownAction("delete", student);
                          }}
                        >
                          ลบ
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStudents.length === 0 && (
          <div style={styles.noData}>ไม่พบข้อมูลนักศึกษา</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {modalMode === "add" && "เพิ่มนักศึกษาใหม่"}
                {modalMode === "edit" && "แก้ไขข้อมูลนักศึกษา"}
                {modalMode === "view" && "ดูข้อมูลนักศึกษา"}
              </h2>
              <button onClick={closeModal} style={styles.closeButton}>
                ×
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Basic Information */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>ข้อมูลส่วนตัว</h3>
                {renderFormField("ชื่อ-นามสกุล", "name")}
                {renderFormField("ชื่อเล่น", "nickname")}
                {renderFormField("รหัสนักศึกษา", "student_id")}
                {renderFormField("เลขบัตรประชาชน", "citizen_id")}
                {renderFormField("เบอร์โทรศัพท์", "phone_num")}
                {renderFormField("อีเมล", "email")}
                {renderFormField("สำนักวิชา", "school")}
                {renderFormField("สาขาวิชา", "major")}
                {renderFormField("จำนวนพี่น้อง", "siblings_count")}
              </div>

              {/* Address Information */}
              {renderAddressForm("ที่อยู่ปัจจุบัน", "address_current")}
              {renderAddressForm("ที่อยู่ตามทะเบียนบ้าน", "address_perm")}

              {/* Parent Information */}
              {renderParentForm("ข้อมูลบิดา", "father_info")}
              {renderParentForm("ข้อมูลมารดา", "mother_info")}
              {renderParentForm("ข้อมูลผู้ปกครอง", "guardian_info")}

              {/* Survey Information */}
              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>ข้อมูลแบบสอบถาม</h4>
                {renderFormField("สถานภาพครอบครัว", "survey.familyStatus")}
                {renderFormField("รายได้บิดา", "survey.fatherIncome")}
                {renderFormField("รายได้มารดา", "survey.motherIncome")}
                {renderFormField("รายได้ผู้ปกครอง", "survey.guardianIncome")}
                {renderFormField("สถานะทางกฎหมาย", "survey.legalStatus")}
                {renderFormField("ผู้ที่อาศัยอยู่ด้วย", "survey.livingWith")}
                {renderFormField(
                  "เอกสารทางกฎหมายของบิดามารดา",
                  "survey.parentLegalStatus"
                )}
              </div>
            </div>

            <div style={styles.modalFooter}>
              {modalMode !== "view" && (
                <button
                  onClick={generateRandomData}
                  style={{
                    ...styles.saveButton,
                    backgroundColor: "#6c757d",
                    marginRight: "auto",
                  }}
                >
                  สุ่มข้อมูล
                </button>
              )}
              <button onClick={closeModal} style={styles.cancelButton}>
                ยกเลิก
              </button>
              {modalMode !== "view" && (
                <button onClick={handleSubmit} style={styles.saveButton}>
                  {modalMode === "add" ? "เพิ่ม" : "บันทึก"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  containerCenter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  loading: {
    fontSize: 18,
    color: "#666",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#333",
    margin: 0,
  },
  addButton: {
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  },
  filterSection: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    width: "100%",
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
  },
  filterContainer: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  filterSelect: {
    padding: 8,
    border: "1px solid #ddd",
    borderRadius: 8,
    minWidth: 150,
  },
  clearButton: {
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: 8,
    cursor: "pointer",
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "visible", // เปลี่ยนเป็น visible เพื่อให้ dropdown แสดงได้
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  tableHeader: {
    padding: 15,
    borderBottom: "1px solid #eee",
  },
  resultsCount: {
    color: "#666",
    fontSize: 14,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableRow: {
    borderBottom: "1px solid #eee",
  },
  tableHeaderCell: {
    padding: 12,
    textAlign: "left",
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: "#f8f9fa",
  },
  tableCell: {
    padding: 12,
    textAlign: "left",
    fontSize: 14,
  },
  dropdownContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end", // เพิ่มเพื่อจัดปุ่มไปทางขวา
  },
  dotsButton: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    padding: "5px 10px",
    borderRadius: 4,
    color: "#666",
    fontWeight: "bold",
    lineHeight: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%", // เปลี่ยนกลับเป็นแสดงด้านล่าง
    right: 0,
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 9999, // เพิ่ม z-index ให้สูงขึ้น
    minWidth: 130,
    overflow: "visible", // เปลี่ยนเป็น visible
  },
  dropdownItem: {
    display: "block",
    width: "100%",
    padding: "10px 15px",
    border: "none",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: 14,
    textAlign: "left",
    color: "#333",
    borderBottom: "1px solid #f0f0f0",
  },
  dropdownItemDelete: {
    display: "block",
    width: "100%",
    padding: "10px 15px",
    border: "none",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: 14,
    textAlign: "left",
    color: "#dc3545",
  },
  noData: {
    textAlign: "center",
    padding: 40,
    color: "#666",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 8,
    maxWidth: "90vw",
    maxHeight: "90vh",
    width: 800,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottom: "1px solid #eee",
    backgroundColor: "#f8f9fa",
  },
  modalTitle: {
    margin: 0,
    color: "#333",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    color: "#666",
  },
  modalContent: {
    padding: 20,
    overflow: "auto",
    flex: 1,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: 20,
    borderTop: "1px solid #eee",
    backgroundColor: "#f8f9fa",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    cursor: "pointer",
  },
  saveButton: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    cursor: "pointer",
  },
  section: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    border: "1px solid #e9ecef",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 15,
    color: "#495057",
    fontSize: 16,
    fontWeight: "bold",
  },
  field: {
    marginBottom: 15,
  },
  label: {
    display: "block",
    marginBottom: 5,
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: 8,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
  },
};
