// join.js
const admin = require('../admin.js');
const db = admin.firestore();

module.exports.createJoin = async (req, res) => {
    try {
        const joinData = {
            GroupId: req.body.GroupId,
            userId: req.body.userId,
        };

        const joinDocRef = await db.collection('joins').add(joinData);
        res.json({ message: 'Join created successfully', joinId: joinDocRef.id });
    } catch (error) {
        console.error('Error creating join:', error);
        res.status(500).json({ message: 'Error creating join: ' + error.message });
    }
};

module.exports.getJoins = async (req, res) => {
    try {
        const joinsSnapshot = await db.collection('joins').get();
        const joins = joinsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.joinId = doc.id; // เพิ่ม ID ของเอกสาร
            return data;
        });

        res.json(joins); // ส่งข้อมูลการเข้าร่วมกลุ่มกลับไป
    } catch (error) {
        console.error('Error getting joins:', error);
        res.status(500).json({ message: 'Error getting joins: ' + error.message });
    }
};

module.exports.getJoinById = async (req, res) => {
    try {
        const joinId = req.params.id; // รับ Join ID จาก URL parameters
        const joinDoc = await db.collection('joins').doc(joinId).get();

        if (!joinDoc.exists) {
            res.status(404).json({ message: 'Join not found' });
            return;
        }

        const joinData = joinDoc.data();
        joinData.joinId = joinDoc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ

        res.json(joinData); // ส่งข้อมูลการเข้าร่วมกลุ่มกลับไป
    } catch (error) {
        console.error('Error getting join by ID:', error);
        res.status(500).json({ message: 'Error getting join by ID: ' + error.message });
    }
};

module.exports.getJoinsByGroupId = async (req, res) => {
    try {
        const groupId = req.params.GroupId; // รับ GroupId จาก URL parameters
        const joinsSnapshot = await db.collection('joins').where('GroupId', '==', groupId).get();

        if (joinsSnapshot.empty) {
            res.status(404).json({ message: 'No joins found for this group' });
            return;
        }

        const joins = joinsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.joinId = doc.id; 
            return data;
        });

        res.json(joins);
    } catch (error) {
        console.error('Error getting joins by Group ID:', error);
        res.status(500).json({ message: 'Error getting joins by Group ID: ' + error.message });
    }
};
module.exports.getJoinsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId; // รับ UserId จาก URL parameters
        const joinsSnapshot = await db.collection('joins').where('userId', '==', userId).get(); // ค้นหาการเข้าร่วมที่มี UserId นี้

        if (joinsSnapshot.empty) { // หากไม่มีการเข้าร่วมที่ตรงกับเงื่อนไข
            res.status(404).json({ message: 'No joins found for this user' });
            return;
        }

        const joins = joinsSnapshot.docs.map(doc => {
            const data = doc.data(); // ดึงข้อมูลของแต่ละเอกสาร
            data.joinId = doc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ
            return data;
        });

        res.json(joins); // ส่งข้อมูลกลับไป
    } catch (error) {
        console.error('Error getting joins by User ID:', error);
        res.status(500).json({ message: 'Error getting joins by User ID: ' + error.message });
    }
};

module.exports.updateJoin = async (req, res) => {
    try {
        const joinId = req.params.id; 
        const joinRef = db.collection('joins').doc(joinId); 

        const updatedData = {
            GroupId: req.body.GroupId,
            userId: req.body.userId,
        };

        await joinRef.update(updatedData); 

        res.json({ message: 'Join updated successfully' });
    } catch (error) {
        console.error('Error updating join:', error);
        res.status(500).json({ message: 'Error updating join: ' + error.message });
    }
};

module.exports.deleteJoin = async (req, res) => {
    try {
        const joinId = req.params.id; // รับ Join ID จาก URL parameters
        const joinRef = db.collection('joins').doc(joinId); 

        await joinRef.delete(); // ลบการเข้าร่วมกลุ่ม

        res.json({ message: 'Join deleted successfully' });
    } catch (error) {
        console.error('Error deleting join:', error);
        res.status(500).json({ message: 'Error deleting join: ' + error.message });
    }
};
