// login.js
const admin = require('../admin.js');
const db = admin.firestore();
const bcrypt = require('bcrypt');
// const { auth } = require('../admin.js');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
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
module.exports.resetPassword = async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        // ค้นหารหัสยืนยันในฐานข้อมูล
        const resetDoc = await db.collection('passwordResets').doc(email).get();

        if (!resetDoc.exists || resetDoc.data().token !== token) {
            res.status(400).json({ message: 'Invalid or expired token' });
            return;
        }

        // ตรวจสอบอายุของรหัสยืนยัน (เช่น ไม่เกิน 1 ชั่วโมง)
        const tokenAge = (new Date() - resetDoc.data().createdAt.toDate()) / 1000 / 60; // minutes
        if (tokenAge > 60) {
            res.status(400).json({ message: 'Token expired' });
            return;
        }

        // เข้ารหัสรหัสผ่านใหม่
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // อัปเดตรหัสผ่านในคอลเลกชันที่เกี่ยวข้อง
        const adminSnapshot = await db.collection('admin').where('email', '==', email).get();
        const companiesSnapshot = await db.collection('companies').where('email', '==', email).get();
        const usersSnapshot = await db.collection('users').where('email', '==', email).get();

        if (!adminSnapshot.empty) {
            await adminSnapshot.docs[0].ref.update({ password: hashedPassword });
        } else if (!companiesSnapshot.empty) {
            await companiesSnapshot.docs[0].ref.update({ password: hashedPassword });
        } else if (!usersSnapshot.empty) {
            await usersSnapshot.docs[0].ref.update({ password: hashedPassword });
        }

        // ลบรหัสยืนยันออกจากฐานข้อมูล
        await db.collection('passwordResets').doc(email).delete();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error resetting password: ' + error.message });
    }
};



const createTransporter = async () => {
    try{
    const oauth2Client = new OAuth2(
        process.env.OAUTH_CLIENTID,
        process.env.OAUTH_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.OAUTH_REFRESH_TOKEN
    });

    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) {
                reject();
            }
            resolve(token);
        });
    });
    console.log('Access token created successfully');
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_USER,
            accessToken,
            clientId: process.env.OAUTH_CLIENTID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
        }
    });
    console.log('Transporter created successfully');
    return transporter;
} catch (error) {
    console.error('Error creating transporter:', error);
}
};

async function sendVerificationEmail(email, token) {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Verification',
            text: `Your verification code is: ${token}`
        };
        console.log('Sending email...');
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

module.exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // ค้นหาอีเมลในคอลเลกชัน admin, companies, และ users
        const adminSnapshot = await db.collection('admin').where('email', '==', email).get();
        const companiesSnapshot = await db.collection('companies').where('email', '==', email).get();
        const usersSnapshot = await db.collection('users').where('email', '==', email).get();

        if (!adminSnapshot.empty || !companiesSnapshot.empty || !usersSnapshot.empty) {
            // สร้างรหัสยืนยัน (verification token)
            const token = uuidv4();

            // เก็บรหัสยืนยันไว้ในฐานข้อมูล
            await db.collection('passwordResets').doc(email).set({
                token: token,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // ส่งอีเมลรหัสยืนยัน
            await sendVerificationEmail(email, token);

            res.json({ message: 'Verification code sent successfully' });
        } else {
            res.status(404).json({ message: 'Email not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing forgot password request: ' + error });
    }
};
