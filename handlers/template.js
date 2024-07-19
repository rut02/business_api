//template.js
const admin = require('../admin.js');
const db = admin.firestore();

module.exports.createTemplate = async (req, res) => {
    try {
        
        console.log("createtemplate",req.body);
        const templateData = {
            name: req.body.name,
            companyID: req.body.companyID,
            // background: req.body.background,
            fullname: req.body.fullname,
            companyName: req.body.companyName,
            companyAddress: req.body.companyAddress,
            position: req.body.position,
            email: req.body.email,
            phone: req.body.phone,
            phoneDepartment: req.body.phoneDepartment,
            departmentName: req.body.departmentName,
            logo: req.body.logo,
            status: req.body.status,
        };

        const templateDocRef = await db.collection('templates').add(templateData);
        console.log("Template created with ID:", templateDocRef.id);
        res.json({ message: 'Template created successfully', templateId: templateDocRef.id });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ message: 'Error creating template: ' + error.message });
    }
};
module.exports.getTemplates = async (req, res) => {
    try {
        console.log("gettemplates");
        const templatesSnapshot = await db.collection('templates').get();
        const templates = templatesSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ
            return data;
        });

        res.json(templates);
    } catch (error) {
        console.error('Error getting templates:', error);
        res.status(500).json({ message: 'Error getting templates: ' + error.message });
    }
};

module.exports.getTemplateById = async (req, res) => {
    try {
        const templateId = req.params.id; // รับ ID ของเทมเพลต
        const templateDoc = await db.collection('templates').doc(templateId).get();

        if (!templateDoc.exists) {
            res.status(404).json({ message: 'Template not found' });
            return;
        }

        const templateData = templateDoc.data();
        templateData.id = templateDoc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ

        res.json(templateData);
    } catch (error) {
        console.error('Error getting template by ID:', error);
        res.status(500).json({ message: 'Error getting template by ID: ' + error.message });
    }
};
module.exports.getTemplatesByCompanyID = async (req, res) => {
    try {
        const companyID = req.params.companyID; // รับ CompanyID จาก URL parameters
        const templatesSnapshot = await db.collection('templates').where('companyID', '==', companyID).get();

        if (templatesSnapshot.empty) {
            res.status(404).json({ message: 'No templates found for this company' });
            return;
        }

        const templates = templatesSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // เพิ่ม ID ของเอกสารในข้อมูลที่ส่งกลับ
            return data;
        });

        res.json(templates);
    } catch (error) {
        console.error('Error getting templates by company ID:', error);
        res.status(500).json({ message: 'Error getting templates by company ID: ' + error.message });
    }
};
module.exports.updateTemplate = async (req, res) => {
    try {
        const templateId = req.params.id;
        const templateRef = db.collection('templates').doc(templateId);

        const updatedData = {
            name: req.body.name,
            companyID: req.body.companyID,
            background: req.body.background,
            fullname: req.body.fullname,
            companyName: req.body.companyName,
            companyAddress: req.body.companyAddress,
            position: req.body.position,
            email: req.body.email,
            phone: req.body.phone,
            phoneDepartment: req.body.phoneDepartment,
            departmentName: req.body.departmentName,
            logo: req.body.logo,
            status: req.body.status,
        };

        await templateRef.update(updatedData); // อัปเดตข้อมูล

        res.json({ message: 'Template updated successfully' });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ message: 'Error updating template: ' + error.message });
    }
};
module.exports.updateStatus = async (req, res) => {
    try {
        const templateId = req.params.id;
        const status = req.body.status;
        const companyId = req.body.companyId;

        // Fetch templates by companyId and update their status to "0"
        const templatesRef = db.collection('templates');
        const querySnapshot = await templatesRef.where('companyId', '==', companyId).get();

        const batch = db.batch();

        querySnapshot.forEach(doc => {
            batch.update(doc.ref, { status: "0" });
        });

        // Update the specific template status to the given status
        const templateRef = templatesRef.doc(templateId);
        batch.update(templateRef, { status: status });

        // Commit the batch
        await batch.commit();

        res.json({ message: 'Template statuses updated successfully' });
    } catch (error) {
        console.error('Error updating template statuses:', error);
        res.status(500).json({ message: 'Error updating template statuses: ' + error.message });
    }
};
module.exports.deleteTemplate = async (req, res) => {
    try {
        const templateId = req.params.id; // รับ ID ของเทมเพลตจาก URL parameters
        const templateRef = db.collection('templates').doc(templateId);

        await templateRef.delete(); // ลบเทมเพลต

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ message: 'Error deleting template: ' + error.message });
    }
};
