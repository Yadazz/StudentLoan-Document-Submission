import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "./database/firebase";
import { useNavigate } from "react-router-dom";

const POST_TYPES = ["ทั่วไป", "ทุนการศึกษา", "ชั่วโมงจิตอาสา", "จ้างงาน"];

export default function AllPostsScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const fetchPosts = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "news"));
    const allPosts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPosts(allPosts);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("คุณแน่ใจว่าต้องการลบโพสต์นี้?")) {
      await deleteDoc(doc(db, "news", id));
      fetchPosts();
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = typeFilter ? post.postType === typeFilter : true;
    const matchesDate = dateFilter
      ? post.createdAt?.toDate().toDateString() ===
        new Date(dateFilter).toDateString()
      : true;
    return matchesSearch && matchesType && matchesDate;
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>โพสต์ทั้งหมด</h1>

      {/* Filters */}
      <div style={styles.filterContainer}>
        <input
          type="text"
          placeholder="ค้นหาหัวข้อ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.input}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={styles.select}
        >
          <option value="">ประเภททั้งหมด</option>
          {POST_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={styles.input}
        />
      </div>

      {loading ? (
        <p style={styles.loadingText}>กำลังโหลดโพสต์...</p>
      ) : (
        <div style={styles.postsContainer}>
          {filteredPosts.map((post) => (
            <div key={post.id} style={styles.postCard}>
              {post.bannerURL && (
                <img
                  src={post.bannerURL}
                  alt={post.title}
                  style={styles.bannerImage}
                />
              )}
              <h3 style={styles.postTitle}>{post.title}</h3>
              <div
                style={styles.postDescription}
                dangerouslySetInnerHTML={{ __html: post.description }}
              />

              {post.mediaURLs && post.mediaURLs.length > 0 && (
                <div style={styles.mediaContainer}>
                  {post.mediaURLs.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`media-${idx}`}
                      style={styles.mediaPreview}
                    />
                  ))}
                </div>
              )}

              {post.documentURL && (
                <div style={styles.documentContainer}>
                  <a
                    href={post.documentURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.documentLink}
                  >
                    📄 {post.documentName || "ไฟล์เอกสาร"}
                  </a>
                </div>
              )}

              {post.createdAt && (
                <p style={styles.dateText}>
                  วันที่สร้าง: {post.createdAt.toDate().toLocaleString()}
                </p>
              )}

              <div style={styles.menuContainer}>
                <PostMenu post={post} onDelete={() => handleDelete(post.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  function PostMenu({ post, onDelete }) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    return (
      <div style={styles.menuWrapper}>
        <button onClick={() => setOpen(!open)} style={styles.menuButton}>
          ⋮
        </button>
        {open && (
          <div style={styles.menuDropdown}>
            <button
              onClick={() => navigate("/edit", { state: { post } })}
              style={styles.menuItem}
            >
              แก้ไขโพสต์
            </button>
            <button onClick={onDelete} style={styles.menuItemDelete}>
              ลบโพสต์
            </button>
          </div>
        )}
      </div>
    );
  }
}

const styles = {
  container: {
    padding: 30,
    maxWidth: 1200,
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    fontSize: 16,
    lineHeight: 1.5,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 30,
    textAlign: "center",
  },
  filterContainer: {
    display: "flex",
    gap: 15,
    marginBottom: 30,
    alignItems: "center",
    flexWrap: "wrap",
  },
  input: {
    padding: 12,
    fontSize: 16,
    border: "1px solid #ccc",
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    flex: 1,
    minWidth: 200,
  },
  select: {
    padding: 12,
    fontSize: 16,
    border: "1px solid #ccc",
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    backgroundColor: "#fff",
    minWidth: 150,
  },
  loadingText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
  postsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 25,
  },
  postCard: {
    background: "#fff",
    padding: 25,
    borderRadius: 12,
    position: "relative",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    border: "1px solid #e0e0e0",
  },
  bannerImage: {
    width: "100%",
    maxHeight: 250,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 15,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    marginTop: 0,
  },
  postDescription: {
    fontSize: 16,
    lineHeight: 1.6,
    color: "#555",
    marginBottom: 15,
  },
  mediaContainer: {
    display: "flex",
    gap: 12,
    marginBottom: 15,
    flexWrap: "wrap",
  },
  mediaPreview: {
    width: 120,
    height: 120,
    objectFit: "cover",
    borderRadius: 8,
    border: "1px solid #ddd",
  },
  documentContainer: {
    marginBottom: 15,
  },
  documentLink: {
    fontSize: 16,
    color: "#3b82f6",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#777",
    marginBottom: 0,
    fontStyle: "italic",
  },
  menuContainer: {
    position: "absolute",
    bottom: 15,
    right: 15,
  },
  menuWrapper: {
    position: "relative",
  },
  menuButton: {
    fontSize: 20,
    padding: "8px 12px",
    background: "transparent",
    border: "1px solid #ddd",
    borderRadius: 6,
    cursor: "pointer",
    color: "#666",
  },
  menuDropdown: {
    position: "absolute",
    right: 0,
    top: "100%",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    zIndex: 10,
    minWidth: 140,
  },
  menuItem: {
    padding: "12px 16px",
    fontSize: 16,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    color: "#333",
  },
  menuItemDelete: {
    padding: "12px 16px",
    fontSize: 16,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    color: "#dc3545",
  },
};
