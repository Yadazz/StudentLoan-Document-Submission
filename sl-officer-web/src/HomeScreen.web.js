import React from "react";

export default function HomeScreen() {
  return (
    <div style={styles.container}>
      <h1 style={styles.header}>หน้าหลัก</h1>
      <p style={styles.welcomeText}>ยินดีต้อนรับเข้าสู่ระบบ Officer</p>
    </div>
  );
}

const styles = {
  container: {
    padding: 30,
    maxWidth: 1200,
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    fontSize: 16,
    lineHeight: 1.5,
    textAlign: "center",
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 0,
  },
};
