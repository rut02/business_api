const admin = require('../admin.js');
const db = admin.firestore();
const fc = require('./function.js');

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
module.exports.getFriendsByUserId = async (req, res) => {
    try {
        const userId = req.params.id; // รับ userId จาก URL parameters

        // ค้นหาคำขอที่มี status = 1 (ยอมรับแล้ว) ที่ requesterId หรือ responderId เป็น userId ที่ระบุ
        const requestsSnapshot = await db.collection('requests')
            .where('status', '==', "1")
            .where('requesterId', '==', userId)
            .get();
        
        // ดึงข้อมูลคำขอที่ผู้ใช้เป็นผู้ตอบสนอง (responderId)
        const responderSnapshot = await db.collection('requests')
            .where('status', '==', "1")
            .where('responderId', '==', userId)
            .get();

        const friends = [];

        // เพิ่มเพื่อนจากคำขอที่ผู้ใช้เป็นผู้ขอ (requesterId)
        requestsSnapshot.forEach(doc => {
            const data = doc.data();
            friends.push({
                friendsId: data.responderId, // responderId เป็นเพื่อน
                time: fc.formatDate(data.Time), // รูปแบบการแสดงเวลา
                status: data.status
            });
        });

        // เพิ่มเพื่อนจากคำขอที่ผู้ใช้เป็นผู้ตอบสนอง (responderId)
        responderSnapshot.forEach(doc => {
            const data = doc.data();
            friends.push({
                friendsId: data.requesterId, // requesterId เป็นเพื่อน
                time: fc.formatDate(data.Time), // รูปแบบการแสดงเวลา
                status: data.status
            });
        });

        res.json(friends);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงรายชื่อเพื่อน:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายชื่อเพื่อน: ' + error.message });
    }
};

module.exports.getRequests = async (req, res) => {
    try {
        const requestsSnapshot = await db.collection('requests').get();
        const requests = requestsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // Add document ID to the data
            data.Time = fc.formatDate(data.Time); // Format the Time field
            return data;
        });

        res.json(requests); // Send all request data
    } catch (error) {
        console.error('Error getting requests:', error);
        res.status(500).json({ message: 'Error getting requests: ' + error.message });
    }
};

module.exports.getRequestById = async (req, res) => {
    try {
        const requestId = req.params.id; // Get the request ID
        const requestDoc = await db.collection('requests').doc(requestId).get();

        if (!requestDoc.exists) {
            res.status(404).json({ message: 'Request not found' });
            return;
        }

        const requestData = requestDoc.data();
        requestData.id = requestDoc.id; // Add document ID to the data
        requestData.Time = fc.formatDate(requestData.Time); // Format the Time field

        res.json(requestData); // Send request data back
    } catch (error) {
        console.error('Error getting request by ID:', error);
        res.status(500).json({ message: 'Error getting request by ID: ' + error.message });
    }
};

module.exports.getRequestsByRequesterId = async (req, res) => {
    try {
        const requesterId = req.params.requesterId; // Get the requester ID
        const requestsSnapshot = await db.collection('requests').where('requesterId', '==', requesterId).get();

        if (requestsSnapshot.empty) {
            res.status(404).json({ message: 'No requests found for this requester' });
            return;
        }

        const requests = requestsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // Add document ID to the data
            data.Time = fc.formatDate(data.Time); // Format the Time field
            return data;
        });

        res.json(requests); // Send all requests for the requester
    } catch (error) {
        console.error('Error getting requests by requester ID:', error);
        res.status(500).json({ message: 'Error getting requests by requester ID: ' + error.message });
    }
};

module.exports.getRequestsByResponderId = async (req, res) => {
    try {
        const responderId = req.params.responderId; // Get the responder ID
        const requestsSnapshot = await db.collection('requests').where('responderId', '==', responderId).get();

        if (requestsSnapshot.empty) {
            res.status(404).json({ message: 'No requests found for this responder' });
            return;
        }

        const requests = requestsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // Add document ID to the data
            data.Time = fc.formatDate(data.Time); // Format the Time field
            return data;
        });

        res.json(requests); // Send all requests for the responder
    } catch (error) {
        console.error('Error getting requests by responder ID:', error);
        res.status(500).json({ message: 'Error getting requests by responder ID: ' + error.message });
    }
};
module.exports.checkRequest = async (req, res) => {
    
    try {
        const requesterId = req.params.requesterId;
        const responderId = req.params.responderId;

        const snapshot = await db.collection('requests')
        
        .where('requesterId', 'in', [requesterId, responderId])
        .where('responderId', 'in', [requesterId, responderId])
        .get();
              if (snapshot.empty) {
            console.log('No matching documents');
            return res.status(200).json({ status: false });
        }
        else {
            console.log('Found a request');
            return res.status(200).json({ status: true });
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ status: true });
    }
}

module.exports.updateRequest = async (req, res) => {
    try {
        const requestId = req.params.id; // Get the request ID
        const updatedData = {
            status: req.body.status, // Update status (0=pending, 1=accepted, 2=cancelled)
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
        const requestId = req.params.id; // Get the request ID
        const requestRef = db.collection('requests').doc(requestId);

        await requestRef.delete(); // Delete the request

        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ message: 'Error deleting request: ' + error.message });
    }
};
