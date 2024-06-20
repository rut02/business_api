//server.js
const express = require("express");
const app = express();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const cors = require("cors");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// การตั้งค่าคำขอทั้งหมด


// หรือจำกัดเฉพาะบาง origin
// app.use(cors({ origin: 'https://webbusinesscard.onrender.com' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));


app.get('/', (req, res) => {
    console.log('Hello World!');
    res.send('Hello World!');
  })



  const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});

const companyController = require('./handlers/company');
app.post('/companies',companyController.createCompany);
app.get('/companies',companyController.getCompanies);
app.get('/companies/:companyId',companyController.getCompanyById);
app.get('/companies/Name/:companyName',companyController.getCompanyByName);
app.put('/companies/:id',companyController.updateCompany);
app.delete('/companies/:id',companyController.deleteCompany);

const userController = require('./handlers/user');
app.post('/users',userController.createUser);
// app.post('/upload-profile', upload.single('file'), userController.uploadProfile); // ฟังก์ชันที่จะอัปเดตโปรไฟล์พร้อมกับอัปโหลดรูปภาพ
app.get('/users', userController.getUsers); // ดึงข้อมูลผู้ใช้ทั้งหมด
app.get('/users/by-company/:company',userController.getUsersByCompany)//
app.get('/users/by-companyandposition/:company/:position', userController.getUsersByCompany_position);
app.get('/users/:id', userController.getUserById); // ดึงข้อมูลผู้ใช้ตาม ID
app.get('/users/by-department/:department', userController.getUsersByDepartment); // ดึงข้อมูลผู้ใช้ตามแผนก
app.get('/users/by-companybranch/:branch', userController.getUsersByCompanyBranch); // ดึงข้อมูลผู้ใช้ตามสาขาของบริษัท
app.put('/users/:id', userController.updateUser); // อัปเดตข้อมูลผู้ใช้ตาม ID
app.put('/users/:id/address', userController.updateAddress); // อัปเดตที่อยู่ของผู้ใช้ตาม ID
app.delete('/users/:id', userController.deleteUser); // ลบผู้ใช้ตาม ID


const companyBranchController = require('./handlers/companybranch');
app.post('/companybranches', companyBranchController.createCompanybranch); // สร้างสาขาใหม่
app.get('/companybranches', companyBranchController.getCompanybranches); // ดึงข้อมูลสาขาทั้งหมด
app.get('/companybranches/:id', companyBranchController.getCompanybranchById); // ดึงข้อมูลสาขาตาม ID
app.get('/companybranches/by-company/:companyID', companyBranchController.getCompanybranchesByCompanyID); // ดึงข้อมูลสาขาตาม CompanyID
app.get('/users/company/:companyId', userController.getUsersByCompany);
app.put('/companybranches/:id', companyBranchController.updateCompanybranch); // อัปเดตสาขา
app.delete('/companybranches/:id', companyBranchController.deleteCompanybranch); // ลบสาขา

const departmentController = require('./handlers/department');

app.post('/departments', departmentController.createDepartment); // สร้างแผนกใหม่
app.get('/departments', departmentController.getDepartments); // ดึงข้อมูลแผนกทั้งหมด
app.get('/departments/:id', departmentController.getDepartmentById); // ดึงข้อมูลแผนกตาม ID
app.get('/departments/by-company/:companyId', departmentController.getDepartmentsByCompanyID); // ดึงข้อมูลแผนกตาม CompanyID
app.put('/departments/:id', departmentController.updateDepartment); // อัปเดตข้อมูลแผนก
app.delete('/departments/:id', departmentController.deleteDepartment); // ลบแผนกตาม ID

const imgController = require('./handlers/img');

app.post('/upload-image', upload.single('file'), imgController.insert_img);


const templateController = require('./handlers/template');

app.post('/templates', templateController.createTemplate); // สร้าง template ใหม่
app.get('/templates', templateController.getTemplates); // ดึงข้อมูล template ทั้งหมด
app.get('/templates/:id', templateController.getTemplateById); // ดึงข้อมูล template ตาม ID
app.get('/templates/by-company/:companyID', templateController.getTemplatesByCompanyID); // ดึงข้อมูล template ตาม CompanyID
app.put('/templates/:id', templateController.updateTemplate); // อัปเดตข้อมูล template
app.delete('/templates/:id', templateController.deleteTemplate); // ลบ template ตาม ID

const requestController = require('./handlers/request');
app.post('/requests', requestController.createRequest); // สร้าง request ใหม่
app.get('/requests', requestController.getRequests); // ดึงข้อมูล request ทั้งหมด
app.get('/requests/:id', requestController.getRequestById); // ดึงข้อมูล request ตาม ID
app.get('/requests/by-responder/:responderId', requestController.getRequestsByResponderId); // ดึงข้อมูล request ตามผู้ติดตาม
app.get('/requests/by-requester/:requesterId', requestController.getRequestsByRequesterId); // ดึงข้อมูล request ตามผู้ส่งคําขอ
app.put('/requests/:id', requestController.updateRequest); // อัปเดตข้อมูล request
app.delete('/requests/:id', requestController.deleteRequest); // ลบ request ตาม ID

const friendController = require('./handlers/friend');
app.post('/friends', friendController.createFriend); // สร้างเพื่อนใหม่
app.get('/friends', friendController.getFriends); // ดึงข้อมูลเพื่อนทั้งหมด
app.get('/friends/:id', friendController.getFriendById); // ดึงข้อมูลเพื่อนตาม ID
app.get('/friends/by-user/:userId', friendController.getFriendsByUserId); // ดึงข้อมูลเพื่อนตามผู้ใช้
app.get('/friends/by-friend/:friendId', friendController.getFriendsByFriendsId); // ดึงข้อมูลเพื่อนตามเพื่อน
app.put('/friends/:id', friendController.updateFriend); // อัปเดตข้อมูลเพื่อน
app.delete('/friends/:id', friendController.deleteFriend); // ลบเพื่อนตาม ID

const groupController = require('./handlers/group');
app.post('/groups', groupController.createGroup); // สร้างกลุ่มใหม่
app.get('/groups', groupController.getGroups); // ดึงข้อมูลกลุ่มทั้งหมด
app.get('/groups/:id', groupController.getGroupById); // ดึงข้อมูลกลุ่มตาม ID
app.get('/groups/by-owner/:ownerId', groupController.getGroupsByOwnerId); // ดึงข้อมูลกลุ่มตามผู้สร้าง
app.put('/groups/:id', groupController.updateGroup); // อัปเดตข้อมูลกลุ่ม
app.delete('/groups/:id', groupController.deleteGroup); // ลบกลุ่มตาม ID

const joinController = require('./handlers/join');
app.post('/joins', joinController.createJoin); // สร้างการเข้าร่วมกลุ่มใหม่
app.get('/joins', joinController.getJoins); // ดึงข้อมูลการเข้าร่วมกลุ่มทั้งหมด
app.get('/joins/:id', joinController.getJoinById); // ดึงข้อมูลการเข้าร่วมกลุ่มตาม ID
app.get('/joins/by-group/:groupId', joinController.getJoinsByGroupId); // ดึงข้อมูลการเข้าร่วมกลุ่มตามกลุ่ม
app.get('/joins/by-user/:userId', joinController.getJoinsByUserId); // ดึงข้อมูลการเข้าร่วมกลุ่มตามผู้ใช้
app.put('/joins/:id', joinController.updateJoin); // อัปเดตข้อมูลการเข้าร่วมกลุ่ม
app.delete('/joins/:id', joinController.deleteJoin); // ลบการเข้าร่วมกลุ่มตาม ID

const messageController = require('./handlers/message');

app.post('/messages', messageController.createMessage); // สร้างข้อความใหม่
app.get('/messages/sender/:senderId', messageController.getMessagesBySenderId); // ดึงข้อความตาม ID ของผู้ส่ง
app.get('/messages/receiver/:receiverId', messageController.getMessagesByReceiverId); // ดึงข้อความตาม ID ของผู้รับ

const loginController = require('./handlers/login');
app.post('/login', loginController.login); // เข้าสู่ระบบ

const gen_cardcontroller = require('./handlers/gen_card');
app.post('/gen_card', gen_cardcontroller.genCard); // สร้างบัตร
