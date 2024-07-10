//message.js
const admin = require('../admin.js');
const db = admin.firestore();
const fc = require('./function.js');
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
        const messages = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            data.DateTime = fc.formatDate(data.DateTime);
            return data;
        });
        res.json(messages);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ message: 'Error getting messages: ' + error.message });
    }
}
module.exports.getMessagesBySenderId = async (req, res) => {
    try {
        const senderId = req.params.senderId;
        const messagesSnapshot = await db.collection('messages').where('senderId', '==', senderId).get();

        if (messagesSnapshot.empty) {
            res.status(404).json({ message: 'No messages found for this sender' });
            return ;
        }

        const messages = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            data.DateTime = fc.formatDate(data.DateTime);
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
            res.status(404).json({ message: 'No messages found for this receiver' });
            return;
        }

        const messages = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            data.messageId = doc.id;
            data.DateTime = fc.formatDate(data.DateTime);
            return data;
        });

        res.json(messages);
    } catch (error) {
        console.error('Error getting messages by receiver ID:', error);
        res.status(500).json({ message: 'Error getting messages by receiver ID: ' + error.message });
    }
};
