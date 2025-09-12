import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';

// ฟังก์ชันสำหรับรวมรูปภาพหลายไฟล์ให้เป็น PDF ไฟล์เดียว
export const mergeImagesToPdf = async (imageFiles, docId) => {
  if (!Array.isArray(imageFiles) || imageFiles.length === 0) {
    throw new Error("ไม่มีไฟล์รูปภาพให้รวม");
  }

  try {
    const htmlImages = imageFiles.map((file, index) => {
      const isLastImage = index === imageFiles.length - 1;
      // ใช้แท็ก div เพื่อสร้างการขึ้นหน้าใหม่
      const pageBreakDiv = isLastImage ? '' : '<div style="page-break-after: always;"></div>';
      
      const imgTag = `
        <div>
          <img src="data:${file.mimeType || 'image/jpeg'};base64,${file.base64Content}" style="width:100%; height:auto; display:block;" />
        </div>
      `;
      return imgTag + pageBreakDiv;
    });

    // อ่านไฟล์รูปภาพเป็น base64 ในขั้นตอนเดียว
    const filesWithBase64 = await Promise.all(imageFiles.map(async (file) => {
      const base64Content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return { ...file, base64Content };
    }));
    
    const combinedHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              /* กำหนดขนาดหน้ากระดาษและขอบให้ไม่มีเลย */
              @page {
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
              img {
                width: 100vw;
                height: 100vh;
                object-fit: contain;
                display: block;
              }
          </style>
      </head>
      <body>
          ${filesWithBase64.map((file, index) => {
            const isLastImage = index === filesWithBase64.length - 1;
            // ใช้คุณสมบัติ page-break-after บนรูปภาพโดยตรง
            const pageBreakStyle = isLastImage ? '' : 'page-break-after: always;';
            return `<img src="data:${file.mimeType || 'image/jpeg'};base64,${file.base64Content}" style="width:100%; height:auto; display:block; ${pageBreakStyle}" />`;
          }).join('')}
      </body>
      </html>
    `;

    const { uri: pdfUri } = await Print.printToFileAsync({
      html: combinedHtmlContent,
      base64: false,
    });

    const pdfInfo = await FileSystem.getInfoAsync(pdfUri);
    
    // ตั้งชื่อไฟล์สำหรับ PDF ที่รวมแล้ว
    const mergedFileName = `${docId}_merged_${Date.now()}.pdf`;

    const mergedPdfFile = {
      filename: mergedFileName,
      uri: pdfUri,
      mimeType: 'application/pdf',
      size: pdfInfo.size,
      uploadDate: new Date().toLocaleString("th-TH"),
      status: "pending",
      ocrValidated: true,
      convertedFromImage: true,
      originalImageNames: imageFiles.map(file => (file.filename || file.name) ?? null),
    };

    return mergedPdfFile;

  } catch (error) {
    console.error('Error in mergeImagesToPdf:', error);
    throw new Error(`ไม่สามารถรวมรูปภาพเป็น PDF ได้: ${error.message}`);
  }
};