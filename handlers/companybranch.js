//companybranch.js
const admin = require('../admin.js');
const db = admin.firestore();
const fc = require('./function.js');
module.exports.createCompanybranch = async (req, res) => {
    try {
        const companybranchData = {
            name: req.body.name,
            companyID: req.body.companyID,
            address: req.body.subdistrict+","+req.body.district+","+req.body.province+","+req.body.country,
        };
        const companybranchDocRef = await db.collection('companybranches').add(companybranchData);
        res.json({ message: 'Companybranch created successfully', companybranchId: companybranchDocRef.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating companybranch: ' + error.message });
    }
};
module.exports.createbranch = async (req, res) => {
    try {
        const companybranchData = {
            name: req.body.name,
            companyID: req.body.companyID,
            address: req.body.address,
        };
        const companybranchDocRef = await db.collection('companybranches').add(companybranchData);
        // res.json({ message: 'Companybranch created successfully', companybranchId: companybranchDocRef.id });
    } catch (error) {
        console.error(error);
        // res.status(500).json({ message: 'Error creating companybranch: ' + error.message });
    }
};
module.exports.getCompanybranches = async (req, res) => {
    try {
        const branchesSnapshot = await db.collection('companybranches').get();
        const branches = branchesSnapshot.docs.map(doc => {
            const branchData = doc.data();
            branchData.id = doc.id; // เพิ่ม ID ของเอกสาร
            return branchData;
        });

        res.json(branches); // ส่งข้อมูลกลับไป
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting companybranches: ' + error.message });
    }
};
module.exports.getCompanybranchById = async (req, res) => {
    try {
        const branchId = req.params.id; // รับ ID ของสาขาจาก URL parameter
        const branchDoc = await db.collection('companybranches').doc(branchId).get(); // ดึงข้อมูลของสาขาโดยใช้ ID

        if (!branchDoc.exists) {
            res.status(404).json({ message: 'Company branch not found' }); // ถ้าไม่พบสาขา
            return;
        }

        const branchData = branchDoc.data();
        branchData.id = branchDoc.id; // เพิ่ม ID ของเอกสารเข้าไปในข้อมูลของสาขา

        res.json(branchData); // ส่งข้อมูลสาขากลับไป
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting company branch by ID: ' + error.message }); // ข้อความข้อผิดพลาด
    }
};

module.exports.getCompanybranchesByCompanyID = async (req, res) => {
    try {
        const companyID = req.params.companyID; // รับ CompanyID จาก URL parameter
        const branchesSnapshot = await db.collection('companybranches').where('companyID', '==', companyID).get();

        if (branchesSnapshot.empty) {
            res.status(404).json({ message: 'No branches found for this company' });
            return;
        }

        const branches = branchesSnapshot.docs.map(doc => {
            const branchData = doc.data();
            branchData.id = doc.id; // เพิ่ม ID ของเอกสาร
            return branchData;
        });

        res.json(branches); // ส่งข้อมูลกลับไป
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting companybranches: ' + error.message });
    }
};
module.exports.updateCompanybranch = async (req, res) => {
    try {
        const branchId = req.params.id; // รับ ID ของสาขาจาก URL parameter
        const branchRef = db.collection('companybranches').doc(branchId); // อ้างอิงไปยังเอกสารสาขา
        
        const updatedData = {
            name: req.body.name,
            companyID: req.body.companyID,
            address: req.body.subdistrict+","+req.body.district+","+req.body.province+","+req.body.country,
        };

        await branchRef.update(updatedData); // อัปเดตข้อมูลของสาขา

        res.json({ message: 'Companybranch updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating companybranch: ' + error.message });
    }
};
module.exports.deleteCompanybranch = async (req, res) => {
    try {
        const branchId = req.params.id; // รับ ID ของสาขาจาก URL parameters
        const branchRef = db.collection('companybranches').doc(branchId);

        // ลบสาขาและตรวจสอบเอกสารที่อ้างอิงถึง
        await fc.deleteDocumentWithSubcollectionsAndReferences(branchRef, {
            'users': 'companybranch'
        });

        res.json({ message: 'ลบสาขาและเอกสารที่เกี่ยวข้องเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบสาขา:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบสาขา: ' + error.message });
    }
};

