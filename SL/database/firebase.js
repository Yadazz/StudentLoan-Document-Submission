// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDk3jscAWX7GZFhIkv6QNbDzmV8hvGOYfs",
  authDomain: "studentloang8.firebaseapp.com",
  projectId: "studentloang8",
  storageBucket: "studentloang8.firebasestorage.app",
  messagingSenderId: "761516049440",
  appId: "1:761516049440:web:e6b5365a272fd39bb4e845",
  measurementId: "G-71TWLLB2VM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
