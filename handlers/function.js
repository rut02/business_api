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
