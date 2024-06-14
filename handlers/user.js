//user.js
const admin = require('../admin.js');
const db = admin.firestore();
const bcrypt = require('bcrypt');
const fc = require('./function.js');
const imgController = require('./img.js'); // อ้างอิงไปยังฟังก์ชันการอัปโหลดรูปภาพ

module.exports.createUser = async (req, res) => {
    try {
        console.log(req.body);
        const email = req.body.email;
        console.log(email);
        // Check if email already exists in companies and employees collections
        const companiesEmailSnapshot = await db.collection('companies').where('email', '==', email).get();
        const usersEmailSnapshot = await db.collection('users').where('email', '==', email).get();

        const existingEmails = new Set([...companiesEmailSnapshot.docs.map(doc => doc.data().email), ...usersEmailSnapshot.docs.map(doc => doc.data().email)]);

        if (existingEmails.size > 0) {
            res.status(400).json({ message: 'Email already exists. Please choose a different email.' });
            console.log("existingEmails");
            return;
        }

        console.log(req.body.password);
        const password = await bcrypt.hash(req.body.password, 10);

        const userData = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: password,
            gender : req.body.gender,
            birthdate : new Date(req.body.birthdate),
            companybranch :req.body.companybranch||null,
            department : req.body.department||null,
            positionTemplate : req.body.positionTemplate,
            phone : req.body.phone,
            position : req.body.position,
            startwork : req.body.startwork||null,
            address: req.body.subdistrict+","+req.body.district+","+req.body.province+","+req.body.country,

        };
       

        const userDocRef = await db.collection('users').add(userData);

        

        res.json({ message: 'User created successfully', userId: userDocRef.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating user: ' + error.message });
    }
};
module.exports.uploadProfile = async (req, res) => {
    try {
        const userId = req.body.uid; // ID ของผู้ใช้
        const folder = req.body.folder || 'profile'; // โฟลเดอร์ที่จะเก็บรูปภาพโปรไฟล์
        const userRef = db.collection('users').doc(userId); // อ้างอิงไปยังเอกสารผู้ใช้

        // ตรวจสอบว่าผู้ใช้มีอยู่จริงหรือไม่
        const userSnapshot = await userRef.get();
        if (!userSnapshot.exists) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // อัปโหลดรูปภาพและรับ URL ที่เซ็นชื่อแล้ว
        const uploadRes = await imgController.uploadImage(req, res);
        const imageUrl = uploadRes.Url; // รับ URL ของรูปภาพที่อัปโหลด

        // อัปเดตโปรไฟล์ผู้ใช้ด้วย URL ของรูปภาพ
        await userRef.update({ profilePicture: imageUrl });

        res.json({ message: 'Profile updated successfully', imageUrl: imageUrl });
    } catch (error) {
        console.error('Error uploading profile:', error);
        res.status(500).json({ message: 'Error uploading profile' });
    }
};
module.exports.getUsers = async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get(); // ดึงข้อมูลผู้ใช้ทั้งหมด
        const users = [];

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            userData.id = doc.id; // เพิ่ม ID ของผู้ใช้
            userData.birthdate = fc.formatDate(userData.birthdate); // แปลง birthdate เป็นวันที่ที่เข้าใจได้

            // // ดึงข้อมูล address
            // const addressSnapshot = await doc.ref.collection('address').get();
            // const addressData = addressSnapshot.docs.map(addressDoc => addressDoc.data());
            // userData.address = addressData; // เพิ่ม address เข้าไปใน userData

            users.push(userData); // เก็บ userData ลงใน array
        }

        res.json(users); // ส่งข้อมูลกลับไป
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting users: ' + error.message }); // ข้อความข้อผิดพลาด
    }
};

module.exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id; // รับ ID ของผู้ใช้จาก URL parameters
        const userDoc = await db.collection('users').doc(userId).get(); // ดึงเอกสารของผู้ใช้

        if (!userDoc.exists) {
            res.status(404).json({ message: 'User not found' }); // ถ้าไม่พบผู้ใช้
            return;
        }

        const userData = userDoc.data();
        userData.id = userDoc.id; // เพิ่ม ID ของผู้ใช้
        userData.birthdate = fc.formatDate(userData.birthdate); // แปลง birthdate เป็นวันที่

        // // ดึงข้อมูล address
        // const addressSnapshot = await userDoc.ref.collection('address').get();
        // const addressData = addressSnapshot.docs.map(addressDoc => addressDoc.data());
        // userData.address = addressData; // เพิ่ม address เข้าไปใน userData

        res.json(userData); // ส่งข้อมูลกลับไป
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving user: ' + error.message }); // ข้อความข้อผิดพลาด
    }
};
module.exports.getUsersByCompanyBranch = async (req, res) => {
    try {
        const companyBranch = req.params.branch; // รับสาขาจาก URL parameter
        const usersSnapshot = await db.collection('users').where('companybranch', '==', companyBranch).get(); // ดึงข้อมูลผู้ใช้ตามสาขาของบริษัท

        if (usersSnapshot.empty) {
            res.status(404).json({ message: 'No users found in this company branch' }); // ถ้าไม่พบผู้ใช้ในสาขานี้
            return;
        }

        const users = [];
        
        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            userData.id = doc.id; // เพิ่ม ID ของผู้ใช้
            
            // // ดึงข้อมูลที่อยู่
            // const addressSnapshot = await doc.ref.collection('address').get();
            // const addressData = addressSnapshot.docs.map(addressDoc => addressDoc.data());
            // userData.address = addressData; // เพิ่มที่อยู่เข้าไปในข้อมูลผู้ใช้
            
            users.push(userData); // เพิ่มผู้ใช้ลงใน array
        }

        res.json(users); // ส่งข้อมูลผู้ใช้กลับไป
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting users by company branch: ' + error.message }); // ข้อความข้อผิดพลาด
    }
};

module.exports.getUsersByDepartment = async (req, res) => {
    try {
        const department = req.params.department; // รับแผนกจาก URL parameter
        const usersSnapshot = await db.collection('users').where('department', '==', department).get(); // ดึงข้อมูลผู้ใช้ตามแผนก

        if (usersSnapshot.empty) {
            res.status(404).json({ message: 'No users found in this department' }); // ถ้าไม่พบผู้ใช้ในแผนกนี้
            return;
        }

        const users = [];
        
        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            userData.id = doc.id; // เพิ่ม ID ของผู้ใช้
            
            // // ดึงข้อมูลที่อยู่
            // const addressSnapshot = await doc.ref.collection('address').get();
            // const addressData = addressSnapshot.docs.map(addressDoc => addressDoc.data());
            // userData.address = addressData; // เพิ่มที่อยู่เข้าไปในข้อมูลผู้ใช้
            
            users.push(userData); // เพิ่มผู้ใช้ลงใน array
        }

        res.json(users); // ส่งข้อมูลผู้ใช้กลับไป
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting users by department: ' + error.message }); // ข้อความข้อผิดพลาด
    }
};



module.exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id; // รับ ID ของผู้ใช้จาก URL parameters
        const userRef = db.collection('users').doc(userId); // อ้างอิงไปยังเอกสารผู้ใช้
        const userSnapshot = await userRef.get(); // ดึงข้อมูลของผู้ใช้

        if (!userSnapshot.exists) {
            // ถ้าไม่พบผู้ใช้
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // ข้อมูลที่จะอัปเดต
        const updatedData = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            // email: req.body.email,
            // password: password,
            gender : req.body.gender,
            birthdate : new Date(req.body.birthdate),
            companybranch :req.body.companybranch||null,
            department : req.body.department||null,
            positionTemplate : req.body.positionTemplate,
            phone : req.body.phone,
            position : req.body.position,
            startwork : req.body.startwork||null,
            address: req.body.subdistrict+","+req.body.district+","+req.body.province+","+req.body.country,

        };

        await userRef.update(updatedData); // อัปเดตข้อมูลผู้ใช้

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating user: ' + error.message });
    }
};
module.exports.updateAddress = async (req, res) => {
    try {
        const userId = req.params.id; // รับ ID ของผู้ใช้

        // ดึงเอกสารแรกใน subcollection "address"
        const addressSnapshot = await db.collection('users').doc(userId).collection('address').limit(1).get();
        
        if (addressSnapshot.empty) {
            res.status(404).json({ message: 'Address not found' }); // ถ้าไม่มีที่อยู่
            return;
        }

        const addressRef = addressSnapshot.docs[0].ref; // อ้างอิงถึงเอกสารที่อยู่แรก
        
        // ข้อมูลที่จะอัปเดต
        const updatedAddress = {
            subdistrict: req.body.subdistrict,
            district: req.body.district,
            province: req.body.province,
            country: req.body.country,
        };

        // อัปเดตเอกสารที่อยู่
        await addressRef.update(updatedAddress);

        res.json({ message: 'Address updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating address: ' + error.message }); // ข้อความข้อผิดพลาด
    }
};


module.exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id; // รับ ID ของผู้ใช้
        const userRef = db.collection('users').doc(userId); // อ้างอิงไปยังเอกสารผู้ใช้

        // // ดึง subcollection "address"
        // const addressSnapshot = await userRef.collection('address').get();
        // const deleteAddressPromises = addressSnapshot.docs.map((addressDoc) => addressDoc.ref.delete());

        // // ลบที่อยู่ทั้งหมด
        // await Promise.all(deleteAddressPromises);

        // ลบผู้ใช้
        await userRef.delete();

        res.json({ message: 'User and associated addresses deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting user: ' + error.message }); // ส่งข้อความข้อผิดพลาด
    }
};




