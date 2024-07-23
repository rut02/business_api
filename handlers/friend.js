// friends.js
const admin = require('../admin.js');
const db = admin.firestore();
const { formatDate } = require('./function.js');
module.exports.createFriend = async (req, res) => {
    try {
        const friendData = {
            userId: req.body.userId,
            FriendsId: req.body.FriendsId,
            status: req.body.status,
            time: new Date(),
        };

        const friendDocRef = await db.collection('friends').add(friendData);
        res.json({ message: 'Friend added successfully', friendId: friendDocRef.id });
    } catch (error) {
        console.error('Error adding friend:', error);
        res.status(500).json({ message: 'Error adding friend: ' + error.message });
    }
};
module.exports.getFriends = async (req, res) => {
    try {
        const friendsSnapshot = await db.collection('friends').get();
        const friends = friendsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ
            data.time = formatDate(data.time); // แปลงและฟอแมต timestamp ให้เป็น YYYY-MM-DD
            return data;
        });

        res.json(friends); // ส่งข้อมูลเพื่อนทั้งหมด
    } catch (error) {
        console.error('Error getting friends:', error);
        res.status(500).json({ message: 'Error getting friends: ' + error.message });
    }
};
module.exports.getFriendById = async (req, res) => {
    try {
        const friendId = req.params.id; // รับ ID ของเพื่อนจาก URL parameters
        const friendDoc = await db.collection('friends').doc(friendId).get(); // ดึงเอกสารของเพื่อนโดยใช้ ID

        if (!friendDoc.exists) {
            res.status(404).json({ message: 'Friend not found' }); // ถ้าไม่พบเพื่อน
            return;
        }

        const friendData = friendDoc.data();
        friendData.id = friendDoc.id; // เพิ่ม ID ของเอกสารเข้าไปในข้อมูลที่ส่งกลับ
        friendData.time = formatDate(friendData.time); // แปลงและฟอแมต timestamp ให้เป็น YYYY-MM-DD
        res.json(friendData); // ส่งข้อมูลของเพื่อนกลับไป
    } catch (error) {
        console.error('Error getting friend by ID:', error); // ข้อผิดพลาดในการดึงข้อมูลเพื่อน
        res.status(500).json({ message: 'Error getting friend by ID: ' + error.message }); // ส่งข้อความข้อผิดพลาด
    }
};
module.exports.getFriendsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId; // รับ UserId
        const friendsSnapshot = await db.collection('friends').where('userId', '==', userId).get();

        if (friendsSnapshot.empty) {
            res.status(404).json({ message: 'No friends found for this user' });
            return;
        }

        const friends = friendsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ
            data.time = formatDate(data.time); // แปลงและฟอแมต timestamp ให้เป็น YYYY-MM-DD
            return data;
        });

        res.json(friends); // ส่งข้อมูลเพื่อนทั้งหมดสำหรับผู้ใช้ที่ระบุ
    } catch (error) {
        console.error('Error getting friends by user ID:', error);
        res.status(500).json({ message: 'Error getting friends by user ID: ' + error.message });
    }
};

module.exports.getFriendsByFriendsId = async (req, res) => {
    try {
        const friendsId = req.params.friendId; // รับ FriendsId
        const friendsSnapshot = await db.collection('friends').where('FriendsId', '==', friendsId).get();

        if (friendsSnapshot.empty) {
            res.status(404).json({ message: 'No friends found for this FriendsId' });
            return;
        }

        const friends = friendsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ
            data.time = formatDate(data.time); // แปลงและฟอแมต timestamp ให้เป็น YYYY-MM-DD
            return data;
        });

        res.json(friends); // ส่งข้อมูลเพื่อนทั้งหมดสำหรับ FriendsId ที่ระบุ
    } catch (error) {
        console.error('Error getting friends by FriendsId:', error);
        res.status(500).json({ message: 'Error getting friends by FriendsId: ' + error.message });
    }
};
module.exports.updateStatus = async (req, res) => {
    try {
        const friendId = req.params.id; // รับ ID ของเพื่อน
        const userId = req.params.userId;
        const updatedData = {
            status: req.body.status, // อัปเดตสถานะ (0=ธรรมดา, 1=โปรด)
        };

        const friendRef = db.collection('friends').doc().where('userId', '==', userId).where('FriendsId', '==', friendId);
        await friendRef.update(updatedData);

        res.json({ message: 'Friend updated successfully' });
    } catch (error) {
        console.error('Error updating friend:', error);
        res.status(500).json({ message: 'Error updating friend: ' + error.message });
    }
}
module.exports.updateFriend = async (req, res) => {
    try {
        const friendId = req.params.id; // รับ ID ของเพื่อน
        const updatedData = {
            status: req.body.status, // อัปเดตสถานะ (0=ธรรมดา, 1=โปรด)
        };

        const friendRef = db.collection('friends').doc(friendId);
        await friendRef.update(updatedData);

        res.json({ message: 'Friend updated successfully' });
    } catch (error) {
        console.error('Error updating friend:', error);
        res.status(500).json({ message: 'Error updating friend: ' + error.message });
    }
};
module.exports.deleteFriend = async (req, res) => {
    try {
        const friendId = req.params.id; // รับ ID ของเพื่อน
        const friendRef = db.collection('friends').doc(friendId);

        await friendRef.delete(); // ลบเพื่อน

        res.json({ message: 'Friend deleted successfully' });
    } catch (error) {
        console.error('Error deleting friend:', error);
        res.status(500).json({ message: 'Error deleting friend: ' + error.message });
    }
};
