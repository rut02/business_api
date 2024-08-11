// login.js
const admin = require('../admin.js');
const db = admin.firestore();
const bcrypt = require('bcrypt');
// const { auth } = require('../admin.js');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const auth = admin.auth();

// module.exports.createAccount = async (req, res) => {
//     try {
//         const { email, password, role } = req.body;

//         // Create user in Firebase Authentication
//         const userRecord = await auth.createUser({
//             email: email,
//             password: password
//         });

//         // Hash the password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Store additional user information in Firestore
//         let collectionName = '';
//         switch (role) {
//             case 'admin':
//                 collectionName = 'admin';
//                 break;
//             case 'company':
//                 collectionName = 'companies';
//                 break;
//             case 'user':
//                 collectionName = 'users';
//                 break;
//             default:
//                 throw new Error('Invalid role');
//         }

//         await db.collection(collectionName).doc(userRecord.uid).set({
//             email: email,
//             password: hashedPassword,
//             role: role
//         });

//         res.json({ message: 'Account created successfully', userId: userRecord.uid });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error creating account: ' + error.message });
//     }
// };
// module.exports.sendPasswordResetEmail = async (req, res) => {
//     try {
//         const { email } = req.body;

//         const link = await admin.auth().generatePasswordResetLink(email);
        
//         // You can send the link using your own email service or log it for testing
//         console.log('Password reset link:', link);

//         res.json({ message: 'Password reset email sent' });
//     } catch (error) {
//         console.error('Error sending password reset email:', error);
//         res.status(500).json({ message: 'Error sending password reset email: ' + error.message });
//     }
// };

// module.exports.loginfirebase = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Sign in user with Firebase Authentication
//         const userCredential = await auth().signInWithEmailAndPassword(email, password);
//         const user = userCredential.user;

//         // Retrieve additional user information from Firestore
//         const userSnapshot = await db.collection('users').doc(user.uid).get();
//         if (!userSnapshot.exists) {
//             res.status(401).json({ message: 'Invalid email or password' });
//             return;
//         }

//         const userData = userSnapshot.data();

//         // Determine role
//         let role = 'user';
//         if (userData.companybranch && userData.department) {
//             role = 'employee';
//         }

//         res.json({
//             id: user.uid,
//             role: role
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error logging in: ' + error.message });
//     }
// };

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
// module.exports.resetPassword = async (req, res) => {
//     try {
//         const { email, token, newPassword } = req.body;

//         // ค้นหารหัสยืนยันในฐานข้อมูล
//         const resetDoc = await db.collection('passwordResets').doc(email).get();

//         if (!resetDoc.exists || resetDoc.data().token !== token) {
//             res.status(400).json({ message: 'Invalid or expired token' });
//             return;
//         }

//         // ตรวจสอบอายุของรหัสยืนยัน (เช่น ไม่เกิน 1 ชั่วโมง)
//         const tokenAge = (new Date() - resetDoc.data().createdAt.toDate()) / 1000 / 60; // minutes
//         if (tokenAge > 60) {
//             res.status(400).json({ message: 'Token expired' });
//             return;
//         }

//         // เข้ารหัสรหัสผ่านใหม่
//         const hashedPassword = await bcrypt.hash(newPassword, 10);

//         // อัปเดตรหัสผ่านในคอลเลกชันที่เกี่ยวข้อง
//         const adminSnapshot = await db.collection('admin').where('email', '==', email).get();
//         const companiesSnapshot = await db.collection('companies').where('email', '==', email).get();
//         const usersSnapshot = await db.collection('users').where('email', '==', email).get();

//         if (!adminSnapshot.empty) {
//             await adminSnapshot.docs[0].ref.update({ password: hashedPassword });
//         } else if (!companiesSnapshot.empty) {
//             await companiesSnapshot.docs[0].ref.update({ password: hashedPassword });
//         } else if (!usersSnapshot.empty) {
//             await usersSnapshot.docs[0].ref.update({ password: hashedPassword });
//         }

//         // ลบรหัสยืนยันออกจากฐานข้อมูล
//         await db.collection('passwordResets').doc(email).delete();

//         res.json({ message: 'Password reset successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error resetting password: ' + error.message });
//     }
// };

// async function sendVerificationEmail(email, token) {
//     try {
//         const transporter = nodemailer.createTransport({
//             host: 'mxslurp.click',
//             port: 2525,
//             secure: false,
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS
//             },
//             logger: true, // เพิ่มการ log ข้อมูล
//             debug: true // แสดงรายละเอียดของการดีบัก
//         });
        
//         console.log(email)
//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: 'Password Reset Verification',
//             text: `Your verification code is: ${token}`
//         };
//         // const subject = 'Password Reset Verification';
//         // const text = `Your verification code is: ${token}`;
//         // const from= process.env.EMAIL_USER
//         // const to= email
//         console.log('Sending email...');
//         await transporter.sendMail(mailOptions);
//         console.log('Email sent successfully');
//     } catch (error) {
//         console.error('Error sending email:', error);
//         throw error;
//     }
// }

// module.exports.forgotPassword = async (req, res) => {
//     try {
//         const { email } = req.body;

//         // ค้นหาอีเมลในคอลเลกชัน admin, companies, และ users
//         const adminSnapshot = await db.collection('admin').where('email', '==', email).get();
//         const companiesSnapshot = await db.collection('companies').where('email', '==', email).get();
//         const usersSnapshot = await db.collection('users').where('email', '==', email).get();

//         if (!adminSnapshot.empty || !companiesSnapshot.empty || !usersSnapshot.empty) {
//             // สร้างรหัสยืนยัน (verification token)
//             const token = uuidv4();

//             // เก็บรหัสยืนยันไว้ในฐานข้อมูล
//             await db.collection('passwordResets').doc(email).set({
//                 token: token,
//                 createdAt: admin.firestore.FieldValue.serverTimestamp()
//             });

//             // ส่งอีเมลรหัสยืนยัน
//             await sendVerificationEmail(email, token);

//             res.json({ message: 'Verification code sent successfully' });
//         } else {
//             res.status(404).json({ message: 'Email not found' });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error processing forgot password request: ' + error });
//     }
// };
