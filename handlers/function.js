//function.js
// ฟังก์ชันเพื่อแปลง Firestore timestamp หรือ Date object ให้เป็นรูปแบบ YYYY-MM-DD
module.exports.formatDate = function formatDate(date) {
    if (!date) {
        return null; // ถ้าไม่มีวันที่ส่งมา ให้คืนค่าเป็น null
    }

    // แปลง Firestore timestamp เป็น Date object หรือสร้าง Date object จากสตริง
    let dateObj;
    if (date.toDate) { // ถ้าเป็น Firestore timestamp
        dateObj = date.toDate();
    } else if (typeof date === "string") { // ถ้าเป็นสตริง
        dateObj = new Date(date);
    } else if (date instanceof Date) { // ถ้าเป็น Date object
        dateObj = date;
    } else {
        return null; // ถ้าไม่สามารถแปลงเป็น Date object
    }

    // ตรวจสอบว่าเป็น Date object ก่อนเรียกใช้ toISOString()
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return null; // คืนค่าเป็น null ถ้าค่าไม่ถูกต้อง
    }

    return dateObj.toISOString().split('T')[0]; // แปลงเป็นรูปแบบ YYYY-MM-DD
};

module.exports.calculateAge = (birthdate) => {
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  module.exports.deleteDocumentWithSubcollectionsAndReferences = async (docRef, linkedCollections = {}) => {
    try {
        // ดึงเอกสารเพื่อตรวจสอบว่ามีอยู่หรือไม่
        const documentSnapshot = await docRef.get();

        if (!documentSnapshot.exists) {
            throw new Error('เอกสารไม่พบ');
        }

        // ดึงซับคอลเลกชัน
        const subcollections = await docRef.listCollections();
        const deletePromises = [];

        // ลบเอกสารภายในซับคอลเลกชันแบบเรียงลำดับ
        for (const subcollection of subcollections) {
            const subDocsSnapshot = await subcollection.get();
            for (const subDoc of subDocsSnapshot.docs) {
                deletePromises.push(deleteDocumentWithSubcollectionsAndReferences(subDoc.ref, linkedCollections));
            }
        }

        // ลบเอกสารหลัก
        deletePromises.push(docRef.delete());

        // ตรวจสอบเอกสารที่อ้างอิงถึงเอกสารหลัก
        for (const [collectionName, field] of Object.entries(linkedCollections)) {
            const linkedSnapshot = await db.collection(collectionName).where(field, '==', docRef.id).get();
            for (const linkedDoc of linkedSnapshot.docs) {
                // ลบเอกสารที่เชื่อมโยง
                deletePromises.push(deleteDocumentWithSubcollectionsAndReferences(linkedDoc.ref, linkedCollections));
            }
        }

        // รอให้การลบทั้งหมดเสร็จสิ้น
        await Promise.all(deletePromises);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบเอกสารและซับคอลเลกชัน:', error);
    }
};
