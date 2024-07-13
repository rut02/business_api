// server.js
const express = require("express");
const app = express();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const cors = require("cors");
const { format } = require('date-fns');
const WebSocket = require('ws');
const admin = require('./admin.js');
const db = admin.firestore();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', ws => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        if (data.type === 'createMessage') {
            try {
                const messageData = {
                    messageContent: data.messageContent,
                    DateTime: new Date(),
                    senderId: data.senderId,
                    receiverId: data.receiverId,
                };

                const messageDocRef = await db.collection('messages').add(messageData);
                ws.send(JSON.stringify({ message: 'Message created successfully', messageId: messageDocRef.id }));
                
                // ส่งข้อความไปยังลูกค้าทั้งหมดที่เชื่อมต่ออยู่
                wss.clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'newMessage',
                            message: messageData
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

const server = app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
    });
});

app.get('/', (req, res) => {
    console.log('Hello World!');
    res.send('Hello World!');
});

// REST API endpoints for messages
app.get('/messages', async (req, res) => {
    try {
        const messagesSnapshot = await db.collection('messages').get();
        if (messagesSnapshot.empty) {
            return res.status(404).json({ message: 'No messages found' });
        }
        
        const messages = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            data.DateTime = format(data.DateTime.toDate(), 'yyyy-MM-dd HH:mm:ss');
            return data;
        });
        res.json(messages);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ message: 'Error getting messages: ' + error.message });
    }
});

app.get('/messages/sender/:senderId', async (req, res) => {
    try {
        const senderId = req.params.senderId;
        const messagesSnapshot = await db.collection('messages').where('senderId', '==', senderId).get();

        if (messagesSnapshot.empty) {
            return res.status(404).json({ message: 'No messages found for this sender' });
        }

        const messages = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            data.DateTime = format(data.DateTime.toDate(), 'yyyy-MM-dd HH:mm:ss');
            return data;
        });

        res.json(messages);
    } catch (error) {
        console.error('Error getting messages by sender ID:', error);
        res.status(500).json({ message: 'Error getting messages by sender ID: ' + error.message });
    }
});

app.get('/messages/receiver/:receiverId', async (req, res) => {
    try {
        const receiverId = req.params.receiverId;
        const messagesSnapshot = await db.collection('messages').where('receiverId', '==', receiverId).get();

        if (messagesSnapshot.empty) {
            return res.status(404).json({ message: 'No messages found for this receiver' });
        }

        const messages = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            data.DateTime = format(data.DateTime.toDate(), 'yyyy-MM-dd HH:mm:ss');
            return data;
        });

        res.json(messages);
    } catch (error) {
        console.error('Error getting messages by receiver ID:', error);
        res.status(500).json({ message: 'Error getting messages by receiver ID: ' + error.message });
    }
});

// Other routes for your application
const companyController = require('./handlers/company');
app.post('/companies', companyController.createCompany);
app.get('/companies', companyController.getCompanies);
app.get('/companies/:companyId', companyController.getCompanyById);
app.get('/companies/Name/:companyName', companyController.getCompanyByName);
app.put('/companies/:id', companyController.updateCompany);
app.delete('/companies/:id', companyController.deleteCompany);

const userController = require('./handlers/user');
app.post('/users', userController.createUser);
app.get('/users', userController.getUsers);
app.get('/user/:id', userController.getUserById_all);
app.get('/generalusers', userController.getGeneralUsers);
app.get('/generalusers/:id', userController.getGeneralUserById);
app.get('/users/by-company/:company', userController.getUsersByCompany);
app.get('/users/by-companyandposition/:company/:position', userController.getUsersByCompany_position);
app.get('/users/:id', userController.getUserById);
app.get('/users/by-department/:department', userController.getUsersByDepartment);
app.get('/users/by-companybranch/:branch', userController.getUsersByCompanyBranch);
app.put('/users/:id', userController.updateUser);
app.put('/users/:id/address', userController.updateAddress);
app.delete('/users/:id', userController.deleteUser);

const companyBranchController = require('./handlers/companybranch');
app.post('/companybranches', companyBranchController.createCompanybranch);
app.get('/companybranches', companyBranchController.getCompanybranches);
app.get('/companybranches/:id', companyBranchController.getCompanybranchById);
app.get('/companybranches/by-company/:companyID', companyBranchController.getCompanybranchesByCompanyID);
app.put('/companybranches/:id', companyBranchController.updateCompanybranch);
app.delete('/companybranches/:id', companyBranchController.deleteCompanyBranch);

const departmentController = require('./handlers/department');
app.post('/departments', departmentController.createDepartment);
app.get('/departments', departmentController.getDepartments);
app.get('/departments/:id', departmentController.getDepartmentById);
app.get('/departments/by-company/:companyId', departmentController.getDepartmentsByCompanyID);
app.put('/departments/:id', departmentController.updateDepartment);
app.delete('/departments/:id', departmentController.deleteDepartment);

const imgController = require('./handlers/img');
app.post('/upload-image', upload.single('file'), imgController.insert_img);

const templateController = require('./handlers/template');
app.post('/templates', templateController.createTemplate);
app.get('/templates', templateController.getTemplates);
app.get('/templates/:id', templateController.getTemplateById);
app.get('/templates/by-company/:companyID', templateController.getTemplatesByCompanyID);
app.put('/templates/:id', templateController.updateTemplate);
app.delete('/templates/:id', templateController.deleteTemplate);

const positionController = require('./handlers/positiontem');
app.post('/positions', positionController.createPosition);
app.get('/positions', positionController.getPositions);
app.get('/positions/:id', positionController.getPositionById);
app.put('/positions/:id', positionController.updatePosition);
app.delete('/positions/:id', positionController.deletePosition);

const requestController = require('./handlers/request');
app.post('/requests', requestController.createRequest);
app.get('/requests', requestController.getRequests);
app.get('/requests/:id', requestController.getRequestById);
app.get('/requests/friends/:id', requestController.getFriendsByUserId);
app.get('/requests/check/:requesterId/:responderId', requestController.checkRequest);
app.get('/requests/by-responder/:responderId', requestController.getRequestsByResponderId);
app.get('/requests/by-requester/:requesterId', requestController.getRequestsByRequesterId);
app.put('/requests/:id', requestController.updateRequest);
app.delete('/requests/:id', requestController.deleteRequest);

const friendController = require('./handlers/friend');
app.post('/friends', friendController.createFriend);
app.get('/friends', friendController.getFriends);
app.get('/friends/:id', friendController.getFriendById);
app.get('/friends/by-user/:userId', friendController.getFriendsByUserId);
app.get('/friends/by-friend/:friendId', friendController.getFriendsByFriendsId);
app.put('/friends/:id', friendController.updateFriend);
app.delete('/friends/:id', friendController.deleteFriend);

const groupController = require('./handlers/group');
app.post('/groups', groupController.createGroup);
app.get('/groups', groupController.getGroups);
app.get('/groups/:id', groupController.getGroupById);
app.get('/groups/by-owner/:ownerId', groupController.getGroupsByOwnerId);
app.put('/groups/:id', groupController.updateGroup);
app.delete('/groups/:id', groupController.deleteGroup);

const joinController = require('./handlers/join');
app.post('/joins', joinController.createJoin);
app.get('/joins', joinController.getJoins);
app.get('/joins/:id', joinController.getJoinById);
app.get('/joins/by-group/:groupId', joinController.getJoinsByGroupId);
app.get('/joins/by-user/:userId', joinController.getJoinsByUserId);
app.put('/joins/:id', joinController.updateJoin);
app.delete('/joins/:id', joinController.deleteJoin);
