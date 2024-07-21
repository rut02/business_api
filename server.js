const express = require("express");
const app = express();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const cors = require("cors");
const { format } = require('date-fns');
const WebSocket = require('ws');
const admin = require('./admin.js');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

const PORT = process.env.PORT || 3000;

// Import message handlers
const messageHandlers = require('./handlers/message');

// WebSocket server for messages
const wss = messageHandlers.wss;

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
app.get('/messages', messageHandlers.getMessages);
app.get('/messages/sender/:senderId', messageHandlers.getMessagesBySenderId);
app.get('/messages/receiver/:receiverId', messageHandlers.getMessagesByReceiverId);

// Other routes for your application
const companyController = require('./handlers/company');
app.post('/companies', companyController.createCompany);
app.get('/companies', companyController.getCompanies);
app.get('/companies/:companyId', companyController.getCompanyById);
app.get('/companies/Name/:companyName', companyController.getCompanyByName);
app.put('/companies/:id', companyController.updateCompany);
app.put('/companies/status/:id', companyController.updateStatus);
app.delete('/companies/:id', companyController.deleteCompany);

const userController = require('./handlers/user');
app.get("/user/token/:id", userController.getUserToken);
app.post('/users', userController.createUser);
app.post('/user/token', userController.saveUserToken);
app.get('/users', userController.getUsers);
app.get('/user/:id', userController.getUserById_all);
app.get('/user/by-company/:companyId', userController.getUserByCompanyId);// ที่ขอ
app.get('/generalusers', userController.getGeneralUsers);
app.get('/generalusers/:id', userController.getGeneralUserById);
app.get('/users/by-company/:company', userController.getUsersByCompany);
app.get('/users/by-companyandposition/:company/:position', userController.getUsersByCompany_position);
app.get('users/by-Companyanddepartment/:companyId/:departmentId', userController.getUserByCompany_department);
app.get('/users/by-companyandcompanybranch/:companyId/:branchId', userController.getUserByCompany_companybranch);
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
app.put('/templates/status/:id/:companyId', templateController.updateStatus);
app.delete('/templates/:id', templateController.deleteTemplate);

const positionController = require('./handlers/positiontem');
app.post('/positions', positionController.createPosition);
app.get('/positions', positionController.getPositions);
app.get('/positions/:id', positionController.getPositionById);
app.put('/positions/:id', positionController.updatePosition);
app.delete('/positions/:id', positionController.deletePosition);

const loginController = require('./handlers/login');
app.post('/login', loginController.login);
// app.post('/logout', loginController.logout);

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

const notificationController = require('./handlers/notification');
app.post('/notifications', notificationController.sendNotification);


const gen_cardcontroller = require('./handlers/gen_card');
app.post('/gen_card', gen_cardcontroller.genCard); // สร้างบัตร
