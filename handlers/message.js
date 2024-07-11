const admin = require('../admin.js');
const db = admin.firestore();
const { format } = require('date-fns'); // เพิ่มการ import date-fns

module.exports.createMessage = async (req, res) => {
    try {
        const messageData = {
            messageContent: req.body.messageContent,
            DateTime: new Date(),
            senderId: req.body.senderId,
            receiverId: req.body.receiverId,
        };

        const messageDocRef = await db.collection('messages').add(messageData);
        res.status(201).json({ message: 'Message created successfully', messageId: messageDocRef.id });
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ message: 'Error creating message: ' + error.message });
    }
};

module.exports.getMessages = async (req, res) => {
    try {
        const messagesSnapshot = await db.collection('messages').get();
        if (messagesSnapshot.empty) {
            return res.status(404).json({ message: 'No messages found' });
        }
        
        const messages = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            data.DateTime = format(data.DateTime.toDate(), 'yyyy-MM-dd HH:mm:ss'); // ใช้ date-fns ในการ format วันที่
            return data;
        });
        res.json(messages);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ message: 'Error getting messages: ' + error.message });
    }
};

module.exports.getMessagesBySenderId = async (req, res) => {
    try {
        const senderId = req.params.senderId;
        const messagesSnapshot = await db.collection('messages').where('senderId', '==', senderId).get();

        if (messagesSnapshot.empty) {
            return res.status(404).json({ message: 'No messages found for this sender' });
        }

        const messages = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            data.DateTime = format(data.DateTime.toDate(), 'yyyy-MM-dd HH:mm:ss'); // ใช้ date-fns ในการ format วันที่
            return data;
        });

        res.json(messages);
    } catch (error) {
        console.error('Error getting messages by sender ID:', error);
        res.status(500).json({ message: 'Error getting messages by sender ID: ' + error.message });
    }
};

module.exports.getMessagesByReceiverId = async (req, res) => {
    try {
        const receiverId = req.params.receiverId;
        const messagesSnapshot = await db.collection('messages').where('receiverId', '==', receiverId).get();

        if (messagesSnapshot.empty) {
            return res.status(404).json({ message: 'No messages found for this receiver' });
        }

        const messages = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            data.DateTime = format(data.DateTime.toDate(), 'yyyy-MM-dd HH:mm:ss'); // ใช้ date-fns ในการ format วันที่
            return data;
        });

        res.json(messages);
    } catch (error) {
        console.error('Error getting messages by receiver ID:', error);
        res.status(500).json({ message: 'Error getting messages by receiver ID: ' + error.message });
    }
};
