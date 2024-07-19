//company.js
const admin = require('../admin.js');
const db = admin.firestore();
const bcrypt = require('bcrypt');
const fc = require('./function.js');
const companyBranch = require('./companybranch.js');


module.exports.createCompany = async (req, res) => {
    try {

        console.log(req.body);
        const email = req.body.email;
        console.log(email);
        // Check if email already exists in companies and employees collections
        const companiesEmailSnapshot = await db.collection('companies').where('email', '==', email).get();
        const employeesEmailSnapshot = await db.collection('users').where('email', '==', email).get();

        const existingEmails = new Set([...companiesEmailSnapshot.docs.map(doc => doc.data().email), ...employeesEmailSnapshot.docs.map(doc => doc.data().email)]);

        if (existingEmails.size > 0) {
            res.status(400).json({ message: 'Email exists.',companyId: "0" });
            return;
        }

        console.log(req.body.password);
        const password = await bcrypt.hash(req.body.password, 10);

        // Parse yearFounded as datetime
        const yearFounded = new Date(req.body.yearFounded);

        const companyData = {
            businessType: req.body.businessType,
            name: req.body.name,
            website: req.body.website,
            yearFounded: yearFounded,
            logo: req.body.logo,            
            email: req.body.email,
            password: password,
            status:"0",
            
        };

        console.log(companyData);

        

        // Create a company document
        const companyDocRef = await db.collection('companies').add(companyData);

     

        // Create a company branch document
        // สร้างสาขาใหม่ (เรียกใช้ createCompanybranch)
        
            await companyBranch.createbranch({
                body: {
                    name: "สาขาที่ 1",
                    companyID: companyDocRef.id, // ใช้ ID ของบริษัทที่สร้าง
                    address: req.body.subdistrict+","+req.body.district+","+req.body.province+","+req.body.country,
                }
            }, res);
        

        res.json({ message: 'Company created successfully', companyId: companyDocRef.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating company: ' + error.message });
    }
};


module.exports.getCompanies = async (req, res) => {
    try {
        const companiesSnapshot = await db.collection('companies').get();
        const companies = [];

        // ดึงข้อมูลของแต่ละบริษัท
        for (const doc of companiesSnapshot.docs) {
            const companyData = doc.data();

            // เพิ่ม ID ของเอกสารเข้าไปในข้อมูลของบริษัท
            companyData.id = doc.id;

            // // ดึงข้อมูลของ subcollection "address"
            // const addressSnapshot = await doc.ref.collection('address').get();
            // const addressData = addressSnapshot.docs.map(doc => doc.data());

            // // เพิ่มข้อมูลของ subcollection "address" เข้าไปในข้อมูลของบริษัท
            // companyData.address = addressData;

            // แปลง yearFounded เป็นรูปแบบ YYYY-MM-DD โดยใช้ฟังก์ชัน formatDate
            companyData.yearFounded = fc.formatDate(companyData.yearFounded);

            // เก็บข้อมูลของบริษัทใน array
            companies.push(companyData);
        }

        res.json(companies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving companies: ' + error.message });
    }
};

module.exports.getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.companyId; // รับ ID ของบริษัทจาก URL parameters
        const companyDoc = await db.collection('companies').doc(companyId).get(); // ดึงเอกสารของบริษัทจาก Firestore

        if (!companyDoc.exists) {
            // ถ้าไม่พบเอกสารบริษัท
            res.status(404).json({ message: 'Company not found' });
            return;
        }

        // แปลงข้อมูลของบริษัทเป็น JSON
        const companyData = companyDoc.data();

        // เพิ่ม ID ของเอกสารเข้าไปในข้อมูลของบริษัท
        companyData.id = companyDoc.id;
        
        // แปลง yearFounded เป็นรูปแบบ YYYY-MM-DD โดยใช้ฟังก์ชัน formatDate
        companyData.yearFounded = fc.formatDate(companyData.yearFounded);

        // // ดึงข้อมูลของ subcollection "address"
        // const addressSnapshot = await companyDoc.ref.collection('address').get();
        // const addressData = addressSnapshot.docs.map(doc => doc.data());

        // // เพิ่มข้อมูลของ subcollection "address" เข้าไปในข้อมูลของบริษัท
        // companyData.address = addressData;

        // ส่งข้อมูลบริษัทกลับไปยัง client
        console.log(companyData);
        res.json(companyData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving company: ' + error.message });
    }
};
module.exports.getCompanyByName = async (req, res) => {
    try {
        const companyName = req.params.companyName; // รับชื่อของบริษัทจาก URL parameters
        const companiesSnapshot = await db.collection('companies').where('name', '==', companyName).get(); // ค้นหาบริษัทโดยใช้ชื่อจาก Firestore

        if (companiesSnapshot.empty) {
            // ถ้าไม่พบบริษัท
            res.status(404).json({ message: 'Company not found' });
            return;
        }

        const companiesData = [];

        // วน loop เพื่อดึงข้อมูลของทุกบริษัทที่ตรงกับชื่อ
        for (const doc of companiesSnapshot.docs) {
            const companyData = doc.data();

            // เพิ่ม ID ของเอกสารเข้าไปในข้อมูลของบริษัท
            companyData.id = doc.id;

            // // ดึงข้อมูลของ subcollection "address"
            // const addressSnapshot = await doc.ref.collection('address').get();
            // const addressData = addressSnapshot.docs.map(doc => doc.data());

            // // เพิ่มข้อมูลของ subcollection "address" เข้าไปในข้อมูลของบริษัท
            // companyData.address = addressData;

            // แปลง yearFounded เป็นรูปแบบ YYYY-MM-DD โดยใช้ฟังก์ชัน formatDate
             companyData.yearFounded = fc.formatDate(companyData.yearFounded);

            // เก็บข้อมูลของบริษัทใน array
            companiesData.push(companyData);
        }

        // ส่งข้อมูลบริษัทกลับไปยัง client
        res.json(companiesData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving company: ' + error.message });
    }
};
module.exports.updateCompany = async (req, res) => {
    try {
        const companyId = req.params.id; // รับ ID ของบริษัทจาก URL parameters
        const companyRef = db.collection('companies').doc(companyId); // อ้างอิงไปยังเอกสารของบริษัทใน Firestore
        const companySnapshot = await companyRef.get(); // ดึงข้อมูลเอกสารของบริษัท

        if (!companySnapshot.exists) {
            // ถ้าไม่พบเอกสารบริษัท
            res.status(404).json({ message: 'Company not found' });
            return;
        }

        // รับข้อมูลใหม่ที่จะอัปเดต
        const updatedData = {
            businessType: req.body.businessType,
            name: req.body.name,
            website: req.body.website,
            yearFounded: new Date(req.body.yearFounded),
            logo: req.body.logo,
            email: req.body.email,
            password: req.body.password,
            status: req.body.status,
            
            
        };

        // ทำการอัปเดตข้อมูลบริษัทใน Firestore
        await companyRef.update(updatedData);

        // // ตรวจสอบความถูกต้องของอีเมล
        // const email = req.body.email;
        // if (email) {
        //     const companiesEmailSnapshot = await db.collection('companies').where('email', '==', email).get();
        //     const employeesEmailSnapshot = await db.collection('users').where('email', '==', email).get();

        //     // ตรวจสอบว่าอีเมลนี้มีอยู่ในระบบแล้วหรือไม่
        //     if (!companiesEmailSnapshot.empty || !employeesEmailSnapshot.empty) {
        //         res.status(400).json({ message: 'Email already exists. Please choose a different email.' });
        //         return;
        //     }

        //     // อัปเดตอีเมลในบริษัท
        //     await companyRef.update({ email: email });
        // }

        // // อัปเดตที่อยู่
        // const addressData = {
        //     subdistrict: req.body.subdistrict,
        //     district: req.body.district,
        //     province: req.body.province,
        //     country: req.body.country
        // };
        // const addressRef = companyRef.collection('address').doc();
        // await addressRef.set(addressData);

        res.json({ message: 'Company updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating company: ' + error.message });
    }
};
module.exports.updateStatus = async (req, res) => {
    try {
        const companyId = req.params.id;
        const status = req.body.status;
        const companyRef = db.collection('companies').doc(companyId);
        await companyRef.update({ status: status });
        res.json({ message: 'Company status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating company status: ' + error.message });
    
}
}
module.exports.deleteCompany = async (req, res) => {
    try {
        const companyId = req.params.id;
        console.log(companyId);
        // Delete departments related to the company
        const departmentsQuerySnapshot = await db.collection('departments').where('companyID', '==', companyId).get();
        const deleteDepartmentsPromises = departmentsQuerySnapshot.docs.map(async doc => {
            // Delete users in the department
            const usersQuerySnapshot = await db.collection('users').where('department', '==', doc.id).get();
            const deleteUsersPromises = usersQuerySnapshot.docs.map(userDoc => userDoc.ref.delete());

            // Delete the department document
            await Promise.all(deleteUsersPromises);
            return doc.ref.delete();
        });
        await Promise.all(deleteDepartmentsPromises);

        // Delete company branches related to the company
        const branchesQuerySnapshot = await db.collection('companybranches').where('companyID', '==', companyId).get();
        const deleteBranchesPromises = branchesQuerySnapshot.docs.map(async doc => {
            // Delete users in the branch
            const usersQuerySnapshot = await db.collection('users').where('companybranch', '==', doc.id).get();
            const deleteUsersPromises = usersQuerySnapshot.docs.map(userDoc => userDoc.ref.delete());

            // Delete the branch document
            await Promise.all(deleteUsersPromises);
            return doc.ref.delete();
        });
        await Promise.all(deleteBranchesPromises);

        // Delete templates related to the company (if applicable)
        const templatesQuerySnapshot = await db.collection('templates').where('companyID', '==', companyId).get();
        const deleteTemplatesPromises = templatesQuerySnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deleteTemplatesPromises);

        // Delete the company document itself
        await companyRef.delete();

        res.json({ message: 'ลบบริษัทและข้อมูลที่เกี่ยวข้องเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบบริษัท:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบบริษัท: ' + error.message });
    }
};
