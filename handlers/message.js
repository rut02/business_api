const admin = require('../admin.js');
const db = admin.firestore();
const { format } = require('date-fns');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
    ws.on('message', async (message) => {
        console.log('m');
        const data = JSON.parse(message);
        if (data.type === 'createMessage') {
            console
            try {
                console.log('createMessage');
                console.log(data);
                const messageData = {
                    messageContent: data.messageContent,
                    dateTime: new Date(),
                    senderId: data.senderId,
                    receiverId: data.receiverId,
                };

                const messageDocRef = await db.collection('messages').add(messageData);
                const savedMessage = await messageDocRef.get();
                const messageWithId = { ...savedMessage.data(), id: savedMessage.id };

                ws.send(JSON.stringify({ message: 'Message created successfully', messageId: messageDocRef.id }));
                
                // Broadcast the message to all connected clients
                wss.clients.forEach(client => {
                    console.log('wss.clients');
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'newMessage',
                            message: messageWithId
                        }));
                    }
                });

            } catch (error) {
                console.error('Error creating message:', error);
                ws.send(JSON.stringify({ message: 'Error creating message: ' + error.message }));
            }
        }
    });
});


module.exports = {
    wss,
    getMessages: async (req, res) => {
        try {
            const messagesSnapshot = await db.collection('messages').get();
            if (messagesSnapshot.empty) {
                return res.status(404).json({ message: 'No messages found' });
            }
            
            const messages = messagesSnapshot.docs.map(doc => {
                const data = doc.data();
                data.id = doc.id;
                // data.dateTime = format(data.dateTime.toDate(), 'yyyy-MM-dd HH:mm:ss');
                return data;
            });
            res.json(messages);
        } catch (error) {
            console.error('Error getting messages:', error);
            res.status(500).json({ message: 'Error getting messages: ' + error.message });
        }
    },

    getMessagesByReceiverId: async (req, res) => {
        try {
            console.log("getMessagesByReceiverId");
            const userId = req.params.userId;
            const friendId = req.params.friendId;
    
            const messagesSnapshot = await db.collection('messages')
                .where('receiverId', '==', userId)
                .where('senderId', '==', friendId)
                .get();
    
            if (messagesSnapshot.empty) {
                return res.status(404).json({ message: 'No messages found for this receiver' });
            }
    
            const messages = messagesSnapshot.docs.map(doc => {
                const data = doc.data();
                data.id = doc.id;
                // data.dateTime = format(data.dateTime.toDate(), 'yyyy-MM-dd HH:mm:ss');
                return data;
            });
    
            res.json(messages);
        } catch (error) {
            console.error('Error getting messages by receiver ID:', error);
            res.status(500).json({ message: 'Error getting messages by receiver ID: ' + error.message });
        }
    },
    

    getMessagesBySenderId: async (req, res) => {
        try {
            console.log("getMessagesBySenderId");
            const userId = req.params.userId;
            const friendId = req.params.friendId;
    
            const messagesSnapshot = await db.collection('messages')
                .where('senderId', '==', userId)
                .where('receiverId', '==', friendId)
                .get();
    
            if (messagesSnapshot.empty) {
                return res.status(404).json({ message: 'No messages found for this sender' });
            }
    
            const messages = messagesSnapshot.docs.map(doc => {
                const data = doc.data();
                data.id = doc.id;
                // data.dateTime = format(data.dateTime.toDate(), 'yyyy-MM-dd HH:mm:ss');
                return data;
            });
    
            res.json(messages);
        } catch (error) {
            console.error('Error getting messages by sender ID:', error);
            res.status(500).json({ message: 'Error getting messages by sender ID: ' + error.message });
        }
    },
};
