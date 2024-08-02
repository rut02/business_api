// login.js
const admin = require('../admin.js');
const db = admin.firestore();
const bcrypt = require('bcrypt');

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body)
        //ค้นหาผู้ใช้ในคอลเลกชัน admin
        const adminSnapshot = await db.collection('admin').where('email', '==', email).get();
        
        if (!adminSnapshot.empty) {
            const adminData = adminSnapshot.docs[0].data();
            const isValidPassword = await bcrypt.compare(password, adminData.password);
            
            if (isValidPassword) {
                res.json({ 
                    id: adminSnapshot.docs[0].id, 
                    role: 'admin' 
                });
                return;
            }
        }
        
        // ค้นหาผู้ใช้ในคอลเลกชัน companies
        const companiesSnapshot = await db.collection('companies').where('email', '==', email).get();
        
        if (!companiesSnapshot.empty) {
            const companyData = companiesSnapshot.docs[0].data();
            const isValidPassword = await bcrypt.compare(password, companyData.password);
            
            if (isValidPassword) {
                res.json({ 
                    id: companiesSnapshot.docs[0].id, 
                    role: 'company' 
                });
                return;
            }
        }

        // ค้นหาผู้ใช้ในคอลเลกชัน users
        const usersSnapshot = await db.collection('users').where('email', '==', email).get();
        
        if (!usersSnapshot.empty) {
            const userData = usersSnapshot.docs[0].data();
            const isValidPassword = await bcrypt.compare(password, userData.password);
            
            if (isValidPassword) {
                
                let role = 'user';
                if (userData.companybranch && userData.department) {
                    role = 'employee';
                }
                
                res.json({ 
                    id: usersSnapshot.docs[0].id, 
                    role: role 
                });
                console.log(role)
                return;
            }
        }
        console.log("fail")
        // ถ้าไม่พบอีเมลใน companies หรือ users หรือรหัสผ่านไม่ถูกต้อง
        res.status(401).json({ message: 'Invalid email or password' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in: ' + error.message });
    }
};
