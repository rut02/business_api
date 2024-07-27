const admin = require('../admin.js');
const db = admin.firestore();

// ฟังก์ชันบันทึกประวัติการกระทำ
const logHistory = async (userId, action, friendId) => {
    try {
        const timestamp = new Date().toISOString(); // กำหนด timestamp

        // สร้างเอกสารใหม่ในคอลเลกชัน history
        await db.collection('history').add({
            userId,
            action,
            friendId,
            timestamp
        });
        console.log('History logged successfully');
    } catch (error) {
        console.error('Error logging history:', error);
    }
};

// ฟังก์ชันบันทึกการเพิ่มเพื่อน
const logAddFriend = async (userId, friendId) => {
    await logHistory(userId, 'add_friend', friendId);
};

// ฟังก์ชันบันทึกการลบเพื่อน
const logDeleteFriend = async (userId, friendId) => {
    await logHistory(userId, 'delete_friend', friendId);
};

// ฟังก์ชันดึงประวัติการกระทำตาม ID
const getHistoryById = async (req, res) => {
    try {
        const historyId = req.params.id;
        const historyDoc = await db.collection('history').doc(historyId).get();

        if (!historyDoc.exists) {
            res.status(404).json({ message: 'History not found' });
            return;
        }

        res.json(historyDoc.data());
    } catch (error) {
        console.error('Error getting history:', error);
        res.status(500).json({ message: 'Error getting history: ' + error.message });
    }
};

// ฟังก์ชันดึงประวัติการกระทำตาม userId
const getHistoryByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const historySnapshot = await db.collection('history').where('userId', '==', userId).get();

        if (historySnapshot.empty) {
            res.status(404).json({ message: 'No history found for this user' });
            return;
        }

        const historyList = historySnapshot.docs.map(doc => doc.data());
        res.json(historyList);
    } catch (error) {
        console.error('Error getting history by userId:', error);
        res.status(500).json({ message: 'Error getting history by userId: ' + error.message });
    }
};

// ฟังก์ชันดึงประวัติการกระทำตาม friendId
const getHistoryByFriendId = async (req, res) => {
    try {
        const friendId = req.params.friendId;
        const historySnapshot = await db.collection('history').where('friendId', '==', friendId).get();

        if (historySnapshot.empty) {
            res.status(404).json({ message: 'No history found for this friend' });
            return;
        }

        const historyList = historySnapshot.docs.map(doc => doc.data());
        res.json(historyList);
    } catch (error) {
        console.error('Error getting history by friendId:', error);
        res.status(500).json({ message: 'Error getting history by friendId: ' + error.message });
    }
};

// ฟังก์ชันดึงประวัติการกระทำตาม action
const getHistoryByAction = async (req, res) => {
    try {
        const action = req.params.action;
        const historySnapshot = await db.collection('history').where('action', '==', action).get();

        if (historySnapshot.empty) {
            res.status(404).json({ message: 'No history found for this action' });
            return;
        }

        const historyList = historySnapshot.docs.map(doc => doc.data());
        res.json(historyList);
    } catch (error) {
        console.error('Error getting history by action:', error);
        res.status(500).json({ message: 'Error getting history by action: ' + error.message });
    }
};

module.exports = {
    logAddFriend,
    logDeleteFriend,
    getHistoryById,
    getHistoryByUserId,
    getHistoryByFriendId,
    getHistoryByAction
};
