import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import HomeScreen from "./HomeScreen.web";
import PostScreen from "./PostScreen.web";
import AllPostsScreen from "./AllPostsScreen";
import PostEditScreen from "./PostEditScreen.web";
import StudentInfo from "./Studentinfo";
export default function App() {
  return (
    <Router>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div style={{ flex: 1, background: "#f3f4f6" }}>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/create-post" element={<PostScreen />} />
            <Route path="/all-posts" element={<AllPostsScreen />} />
            <Route path="/edit" element={<PostEditScreen />} />
            <Route path="/studentinfo" element={<StudentInfo />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

// Sidebar component
function Sidebar() {
  const navigate = useNavigate();
  const [openPosts, setOpenPosts] = useState(false);
  const [selected, setSelected] = useState("home");

  const handleNavigate = (path, key) => {
    setSelected(key);
    navigate(path);
  };

  return (
    <div
      style={{
        width: 220,
        background: "#0C3169",
        color: "#ffffffff",
        display: "flex",
        flexDirection: "column",
        paddingTop: 40,
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: 22,
          textAlign: "center",
          marginBottom: 40,
        }}
      ></div>

      <SidebarItem
        label="หน้าหลัก"
        active={selected === "home"}
        onClick={() => handleNavigate("/", "home")}
      />
      <SidebarItem
        label="ข้อมูลนักศึกษา"
        active={selected === "studentsInfo"}
        onClick={() => handleNavigate("/studentinfo", "studentsInfo")}
      />

      <div>
        <SidebarItem
          label="โพสต์"
          active={openPosts}
          onClick={() => setOpenPosts(!openPosts)}
        />
        {openPosts && (
          <div style={{ marginLeft: 20 }}>
            <SidebarItem
              label="สร้างโพสต์"
              active={selected === "createPost"}
              onClick={() => handleNavigate("/create-post", "createPost")}
            />
            <SidebarItem
              label="โพสต์ทั้งหมด"
              active={selected === "allPosts"}
              onClick={() => handleNavigate("/all-posts", "allPosts")}
            />
          </div>
        )}
      </div>

      <SidebarItem
        label="เอกสารนักศึกษา"
        active={selected === "docs"}
        onClick={() => handleNavigate("/docs", "docs")}
      />
    </div>
  );
}

function SidebarItem({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 24px",
        background: active ? "#1a4483ff" : "transparent",
        cursor: "pointer",
        fontWeight: active ? "bold" : "normal",
        fontSize: 16,
        transition: "background 0.2s",
      }}
    >
      {label}
    </div>
  );
}
