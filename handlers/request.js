// request.js
const admin = require('../admin.js');
const db = admin.firestore();

module.exports.createRequest = async (req, res) => {
    try {
        const requestData = {
            requesterId: req.body.requesterId,
            responderId: req.body.responderId,
            status: req.body.status,
            Time: new Date(),
        };

        const requestDocRef = await db.collection('requests').add(requestData);
        res.json({ message: 'Request created successfully', requestId: requestDocRef.id });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ message: 'Error creating request: ' + error.message });
    }
};
module.exports.getRequests = async (req, res) => {
    try {
        const requestsSnapshot = await db.collection('requests').get();
        const requests = requestsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ
            return data;
        });

        res.json(requests); // ส่งข้อมูลคำขอทั้งหมด
    } catch (error) {
        console.error('Error getting requests:', error);
        res.status(500).json({ message: 'Error getting requests: ' + error.message });
    }
};
module.exports.getRequestById = async (req, res) => {
    try {
        const requestId = req.params.id; // รับ ID ของคำขอ
        const requestDoc = await db.collection('requests').doc(requestId).get();

        if (!requestDoc.exists) {
            res.status(404).json({ message: 'Request not found' });
            return;
        }

        const requestData = requestDoc.data();
        requestData.id = requestDoc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ

        res.json(requestData); // ส่งข้อมูลคำขอกลับไป
    } catch (error) {
        console.error('Error getting request by ID:', error);
        res.status(500).json({ message: 'Error getting request by ID: ' + error.message });
    }
};
module.exports.getRequestsByRequesterId = async (req, res) => {
    try {
        const requesterId = req.params.requesterId; // รับ ID ของผู้ร้องขอ
        const requestsSnapshot = await db.collection('requests').where('requesterId', '==', requesterId).get();

        if (requestsSnapshot.empty) {
            res.status(404).json({ message: 'No requests found for this requester' });
            return;
        }

        const requests = requestsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ
            return data;
        });

        res.json(requests); // ส่งข้อมูลคำขอทั้งหมดสำหรับผู้ร้องขอ
    } catch (error) {
        console.error('Error getting requests by requester ID:', error);
        res.status(500).json({ message: 'Error getting requests by requester ID: ' + error.message });
    }
};
module.exports.getRequestsByResponderId = async (req, res) => {
    try {
        const responderId = req.params.responderId; // รับ ID ของผู้ตอบกลับ
        const requestsSnapshot = await db.collection('requests').where('responderId', '==', responderId).get();

        if (requestsSnapshot.empty) {
            res.status(404).json({ message: 'No requests found for this responder' });
            return;
        }

        const requests = requestsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ
            return data;
        });

        res.json(requests); // ส่งข้อมูลคำขอทั้งหมดสำหรับผู้ตอบกลับ
    } catch (error) {
        console.error('Error getting requests by responder ID:', error);
        res.status(500).json({ message: 'Error getting requests by responder ID: ' + error.message });
    }
};
module.exports.updateRequest = async (req, res) => {
    try {
        const requestId = req.params.id; // รับ ID ของคำขอ
        const updatedData = {
            status: req.body.status, // อัปเดตสถานะ (0=รอการตอบรับ, 1=ยอมรับ, 2=ยกเลิก)
        };

        const requestRef = db.collection('requests').doc(requestId);
        await requestRef.update(updatedData);

        res.json({ message: 'Request updated successfully' });
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ message: 'Error updating request: ' + error.message });
    }
};
module.exports.deleteRequest = async (req, res) => {
    try {
        const requestId = req.params.id; // รับ ID ของคำขอ
        const requestRef = db.collection('requests').doc(requestId);

        await requestRef.delete(); // ลบคำขอ

        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ message: 'Error deleting request: ' + error.message });
    }
};
