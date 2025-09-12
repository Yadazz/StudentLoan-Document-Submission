// checkDocument.js

// Import Libraries
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// 1. Load environment variables from .env file
// This should be at the very top of your file
dotenv.config();

// Function to convert a file to a Base64-encoded string
function fileToGenerativePart(filePath) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType: "image/jpeg", // Adjust mime type as needed
    },
  };
}

// Main function to check the document
async function checkKYorsorDocument() {
  try {
    // 2. Access the API key directly from process.env
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "API_KEY not found. Please set your GEMINI_API_KEY environment variable in the .env file."
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 3. Prepare the prompt and image file
    const prompt =
      "ตรวจสอบเอกสารนี้เป็น หนังสือให้ความยินยอมในการเปิดเผยข้อมูลไหม พร้อมเช็คว่ามีการลงชื่อหรือลายเซ็นแล้วหรือไม่ ถ้าเซ็นหรือลงชื่อแล้วตรวจว่าเป็นของจริงหรือของปลอม แล้วดึงข้อมูล ชื่อ-นามสกุล, เลขที่บัตรประชาชน, ที่อยู่, เบอร์โทรศัพท์, อีเมล";
    const imagePath = path.resolve(
      "C:/Users/zaqwe/Documents/เอกสาร 2_page-0001 (1).jpg"
    );
    const imagePart = fileToGenerativePart(imagePath);

    // 4. Send the request to Gemini API
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // 5. Log the result
    console.log("-----------------------------------------");
    console.log("ผลการวิเคราะห์จาก Gemini:");
    console.log(text);
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
  }
}

// Run the function
checkKYorsorDocument();
