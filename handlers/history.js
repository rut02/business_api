const admin = require('../admin.js');
const db = admin.firestore();

// ฟังก์ชันบันทึกประวัติการกระทำ
const logHistory = async (userId, action, details) => {
    try {
        const timestamp = new Date().toISOString(); // กำหนด timestamp

        // สร้างเอกสารใหม่ในคอลเลกชัน history
        await db.collection('history').add({
            userId,
            action,
            details,
            timestamp
        });
        console.log('History logged successfully');
    } catch (error) {
        console.error('Error logging history:', error);
    }
};

// ฟังก์ชันบันทึกการเพิ่มเพื่อน
const logAddFriend = async (userId, friendId) => {
    await logHistory(userId, 'add_friend', { friendId });
};

// ฟังก์ชันบันทึกการลบเพื่อน
const logDeleteFriend = async (userId, friendId) => {
    await logHistory(userId, 'delete_friend', { friendId });
};

module.exports = {
    logAddFriend,
    logDeleteFriend
};
