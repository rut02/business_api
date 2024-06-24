//department.js
const admin = require('../admin.js');
const db = admin.firestore();

module.exports.createDepartment = async (req, res) => {
    try {
        const departmentData = {
            name: req.body.name,
            companyID: req.body.companyID,
            phone: req.body.phone,
        };

        const departmentDocRef = await db.collection('departments').add(departmentData);
        res.json({ message: 'Department created successfully', departmentId: departmentDocRef.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating department: ' + error.message });
    }
};
module.exports.getDepartments = async (req, res) => {
    try {
        const departmentsSnapshot = await db.collection('departments').get();
        const departments = departmentsSnapshot.docs.map(doc => {
            const departmentData = doc.data();
            departmentData.id = doc.id; // เพิ่ม ID ของเอกสาร
            return departmentData;
        });

        res.json(departments); // ส่งข้อมูลกลับไป
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting departments: ' + error.message });
    }
};
module.exports.getDepartmentById = async (req, res) => {
    try {
        const departmentId = req.params.id; // รับ ID ของแผนก
        const departmentDoc = await db.collection('departments').doc(departmentId).get(); // ดึงเอกสารของแผนก

        if (!departmentDoc.exists) {
            res.status(404).json({ message: 'Department not found' }); // ถ้าไม่พบแผนก
            return;
        }

        const departmentData = departmentDoc.data();
        departmentData.id = departmentDoc.id; // เพิ่ม ID ของเอกสารเข้าไปในข้อมูลของแผนก

        res.json(departmentData); // ส่งข้อมูลกลับไป
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting department by ID: ' + error.message });
    }
};
module.exports.getDepartmentsByCompanyID = async (req, res) => {
    try {
        const companyID = req.params.companyId; // รับ CompanyID จาก URL parameter
        const departmentsSnapshot = await db.collection('departments').where('companyID', '==', companyID).get(); // ดึงข้อมูลแผนกตาม CompanyID

        if (departmentsSnapshot.empty) {
            res.status(404).json({ message: 'No departments found for this company' }); // ถ้าไม่พบแผนก
            return;
        }

        const departments = departmentsSnapshot.docs.map(doc => {
            const departmentData = doc.data();
            departmentData.id = doc.id; // เพิ่ม ID ของเอกสาร
            return departmentData;
        });

        res.json(departments); // ส่งข้อมูลแผนกกลับไป
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting departments by companyID: ' + error.message }); // ข้อความข้อผิดพลาด
    }
};

module.exports.updateDepartment = async (req, res) => {
    try {
        const departmentId = req.params.id; // รับ ID ของแผนก
        const departmentRef = db.collection('departments').doc(departmentId); // อ้างอิงไปยังเอกสารแผนก

        const updatedData = {
            name: req.body.name,
            companyID: req.body.companyID,
            phone: req.body.phone,
        };

        await departmentRef.update(updatedData); // อัปเดตข้อมูลแผนก

        res.json({ message: 'Department updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating department: ' + error.message });
    }
};
module.exports.deleteDepartment = async (req, res) => {
    try {
        const departmentId = req.params.id; // รับ ID ของแผนก
        const departmentRef = db.collection('departments').doc(departmentId); // อ้างอิงไปยังเอกสารแผนก

        await departmentRef.delete(); // ลบแผนก

        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting department: ' + error.message });
    }
};


