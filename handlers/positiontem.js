const admin = require('./admin.js');
const db = admin.firestore();

// Create Position
module.exports.createPosition = async (req, res) => {
    try {
        const positionData = {
            fullname: req.body.fullname,
            companyName: req.body.companyName,
            companyAddress: req.body.companyAddress,
            position: req.body.position,
            email: req.body.email,
            phone: req.body.phone,
            phoneDepartment: req.body.phoneDepartment,
            departmentName: req.body.departmentName,
            logo: req.body.logo
        };

        const positionDocRef = await db.collection('positiontemplates').add(positionData);
        res.json({ message: 'Position created successfully', positionId: positionDocRef.id });
    } catch (error) {
        console.error('Error creating position:', error);
        res.status(500).json({ message: 'Error creating position: ' + error.message });
    }
};

// Read Position by ID
module.exports.getPositionById = async (req, res) => {
    try {
        const positionId = req.params.id;
        const positionDoc = await db.collection('positiontemplates').doc(positionId).get();
        
        if (!positionDoc.exists) {
            res.status(404).json({ message: 'Position not found' });
            return;
        }

        res.json(positionDoc.data());
    } catch (error) {
        console.error('Error fetching position:', error);
        res.status(500).json({ message: 'Error fetching position: ' + error.message });
    }
};

// Update Position by ID
module.exports.updatePosition = async (req, res) => {
    try {
        const positionId = req.params.id;
        const updatedData = {
            fullname: req.body.fullname,
            companyName: req.body.companyName,
            companyAddress: req.body.companyAddress,
            position: req.body.position,
            email: req.body.email,
            phone: req.body.phone,
            phoneDepartment: req.body.phoneDepartment,
            departmentName: req.body.departmentName,
            logo: req.body.logo
        };

        await db.collection('positiontemplates').doc(positionId).update(updatedData);
        res.json({ message: 'Position updated successfully' });
    } catch (error) {
        console.error('Error updating position:', error);
        res.status(500).json({ message: 'Error updating position: ' + error.message });
    }
};

// Delete Position by ID
module.exports.deletePosition = async (req, res) => {
    try {
        const positionId = req.params.id;
        await db.collection('positiontemplates').doc(positionId).delete();
        res.json({ message: 'Position deleted successfully' });
    } catch (error) {
        console.error('Error deleting position:', error);
        res.status(500).json({ message: 'Error deleting position: ' + error.message });
    }
};

// List All Positions
module.exports.getPositions = async (req, res) => {
    try {
        const positionsSnapshot = await db.collection('positiontemplates').get();
        const positions = [];
        
        positionsSnapshot.forEach(doc => {
            positions.push({ id: doc.id, ...doc.data() });
        });

        res.json(positions);
    } catch (error) {
        console.error('Error listing positions:', error);
        res.status(500).json({ message: 'Error listing positions: ' + error.message });
    }
};
