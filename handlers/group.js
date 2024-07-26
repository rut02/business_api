// group.js
const admin = require('../admin.js');
const db = admin.firestore();

module.exports.createGroup = async (req, res) => {
    try {
        const groupData = {
            name: req.body.name,
            ownerId: req.body.ownerId,
        };

        const groupDocRef = await db.collection('groups').add(groupData);
        res.json({ message: 'Group created successfully', groupId: groupDocRef.id });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Error creating group: ' + error.message });
    }
};

module.exports.getGroups = async (req, res) => {
    try {
        const groupsSnapshot = await db.collection('groups').get();
        const groups = groupsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.groupId = doc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ
            return data;
        });

        res.json(groups);
    } catch (error) {
        console.error('Error getting groups:', error);
        res.status(500).json({ message: 'Error getting groups: ' + error.message });
    }
};

module.exports.getGroupById = async (req, res) => {
    try {
        const groupId = req.params.id; // รับ GroupId จาก URL parameters
        const groupDoc = await db.collection('groups').doc(groupId).get(); 

        if (!groupDoc.exists) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }

        const groupData = groupDoc.data();
        groupData.groupId = groupDoc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ

        res.json(groupData);
    } catch (error) {
        console.error('Error getting group by ID:', error);
        res.status(500).json({ message: 'Error getting group by ID: ' + error.message });
    }
};

module.exports.getGroupsByOwnerId = async (req, res) => {
    try {
        const ownerId = req.params.ownerId; 
        const groupsSnapshot = await db.collection('groups').where('ownerId', '==', ownerId).get();

        if (groupsSnapshot.empty) {
            res.status(404).json({ message: 'No groups found for this owner' });
            return;
        }

        const groups = groupsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; 
            return data;
        });

        res.json(groups);
    } catch (error) {
        console.error('Error getting groups by owner ID:', error);
        res.status(500).json({ message: 'Error getting groups by owner ID: ' + error.message });
    }
};

module.exports.updateGroup = async (req, res) => {
    try {
        const groupId = req.params.id; // รับ GroupId
        const groupRef = db.collection('groups').doc(groupId); 

        const updatedData = {
            name: req.body.name,
        };

        await groupRef.update(updatedData); 

        res.json({ message: 'Group updated successfully' });
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ message: 'Error updating group: ' + error.message });
    }
};

module.exports.deleteGroup = async (req, res) => {
    try {
        const groupId = req.params.id; // รับ GroupId
        const groupRef = db.collection('groups').doc(groupId); 

        await groupRef.delete(); // ลบกลุ่ม

        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ message: 'Error deleting group: ' + error.message });
    }
};
