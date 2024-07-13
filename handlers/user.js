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
            console.log(existingEmails.size);
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
            // positionTemplate : req.body.positionTemplate,
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

module.exports.getUsers = async (req, res) => {
    try {
      const usersSnapshot = await db.collection('users').get(); // Fetch all users
      const users = [];
  
      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        userData.id = doc.id; // Add user ID
        userData.birthdate = fc.formatDate(userData.birthdate); // Format birthdate
        userData.age = fc.calculateAge(userData.birthdate); // Calculate and add age
        
  
        users.push(userData); // Add user data to array
      }
  
      res.json(users); // Send users data
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting users: ' + error.message });
    }
  };
  module.exports.getGeneralUsers = async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users')
            .where('department', '==', null)
            .where('companybranch', '==', null)
            .get();

        if (usersSnapshot.empty) {
            res.status(404).json({ message: 'No general users found' });
            return;
        }

        const users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            userData.id = doc.id;
            userData.birthdate = fc.formatDate(userData.birthdate);
            userData.age = fc.calculateAge(userData.birthdate);
            users.push(userData);
        });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting general users: ' + error.message });
    }
};
module.exports.getGeneralUserById = async (req, res) => {
  try {
      const userId = req.params.id;
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
          res.status(404).json({ message: 'General user not found' });
          return;
      }

      const userData = userDoc.data();
      userData.id = userDoc.id;
      userData.birthdate = fc.formatDate(userData.birthdate);
      userData.age = fc.calculateAge(userData.birthdate);

      res.json(userData);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving general user: ' + error.message });
  }
};

  module.exports.getUserById = async (req, res) => {
    try {
      console.log("getUserById");
      const userId = req.params.id; // Get user ID from URL parameters
      const userDoc = await db.collection('users').doc(userId).get(); // Fetch user document
  
      if (!userDoc.exists) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
  
      const userData = userDoc.data();
      userData.id = userDoc.id; // Add user ID
      userData.birthdate = fc.formatDate(userData.birthdate); // Format birthdate
      userData.age = fc.calculateAge(userData.birthdate); // Calculate and add age
  
      res.json(userData); // Send user data
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving user: ' + error.message });
    }
  };
  module.exports.getUserById_all = async (req, res) => {
    try {
      console.log("getUserById_v2: Fetching user by ID");
      const userId = req.params.id;
      
      // ดึงข้อมูลผู้ใช้ตาม userId
      const userDoc = await db.collection('users').doc(userId).get();
  
      if (!userDoc.exists) {
        res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        return;
      }
  
      const userData = userDoc.data();
      userData.id = userDoc.id; // เพิ่ม ID ผู้ใช้
  
      // ดึงข้อมูล companybranch
      if (userData.companybranch) {
        const companyBranchDoc = await db.collection('companybranches').doc(userData.companybranch).get();
        if (companyBranchDoc.exists) {
          userData.companybranch = companyBranchDoc.data(); // เพิ่มข้อมูล companybranch
          userData.companybranch.id = companyBranchDoc.id; // เพิ่ม ID ของ companybranch
  
          // ดึงข้อมูล company จาก companyID ใน companybranch
          if (userData.companybranch.companyID) {
            const companyDoc = await db.collection('companies').doc(userData.companybranch.companyID).get();
            if (companyDoc.exists) {
              userData.companybranch.company = companyDoc.data(); // เพิ่มข้อมูล company
              userData.companybranch.company.id = companyDoc.id; // เพิ่ม ID ของ company

              if (userData.companybranch.company.yearFounded) {
                userData.companybranch.company.yearFounded = fc.formatDate(userData.companybranch.company.yearFounded);
              }
            } else {
              userData.companybranch.company = null; // ถ้าไม่พบ company ให้เป็น null
            }
          } else {
            userData.companybranch.company = null; // ถ้าไม่มี companyID ให้เป็น null
          }
        } else {
          userData.companybranch = null; // ถ้าไม่พบ companybranch ให้เป็น null
        }
      } else {
        userData.companybranch = null; // ถ้าไม่มี companyBranchId ให้เป็น null
      }
  
      // ดึงข้อมูล department
      if (userData.department) {
        const departmentDoc = await db.collection('departments').doc(userData.department).get();
        if (departmentDoc.exists) {
          userData.department = departmentDoc.data(); // เพิ่มข้อมูล department
          userData.department.id = departmentDoc.id; // เพิ่ม ID ของ department
        } else {
          userData.department = null; // ถ้าไม่พบ department ให้เป็น null
        }
      } else {
        userData.department = null; // ถ้าไม่มี departmentId ให้เป็น null
      }
  
      // ฟอร์แมตวันเกิดและคำนวณอายุ
      if (userData.birthdate) {
        userData.birthdate = fc.formatDate(userData.birthdate); // ฟอร์แมตวันเกิด
        userData.age = fc.calculateAge(userData.birthdate); // คำนวณอายุ
      }
  
      res.json(userData); // ส่งข้อมูลผู้ใช้
    } catch (error) {
      console.error("ข้อผิดพลาดในการดึงข้อมูลผู้ใช้", error);
      res.status(500).json({ message: 'ข้อผิดพลาดในการดึงข้อมูลผู้ใช้: ' + error.message });
    }
  };
  
  

  module.exports.getUsersByCompany = async (req, res) => {
    try {
        const companyId = req.params.company; // รับ companyId จาก URL parameters
        console.log(companyId)
        // ดึง companybranchid ทั้งหมดที่เกี่ยวข้องกับ companyId นี้
        const companyBranchesSnapshot = await db.collection('companybranches').where('companyID', '==', companyId).get();

        if (companyBranchesSnapshot.empty) {
            res.status(404).json({ message: 'No company branches found for this company ID' });
            return;
        }

        const companyBranchIds = companyBranchesSnapshot.docs.map(doc => doc.id); // เก็บ companybranchid
        console.log(companyBranchIds)
        if (companyBranchIds.length === 0) {
            res.status(404).json({ message: 'No users found for this company' });
            return;
        }

        // ดึงผู้ใช้ทั้งหมดที่มี companybranchid อยู่ใน companyBranchIds
        const usersSnapshot = await db.collection('users').where('companybranch', 'in', companyBranchIds).get();

        if (usersSnapshot.empty) {
            res.status(404).json({ message: 'No users found for this companyy' });
            return;
        }

        const users = usersSnapshot.docs.map(doc => {
            const userData = doc.data();
            userData.id = doc.id; // เพิ่ม user ID
            userData.birthdate = fc.formatDate(userData.birthdate); // จัดรูปแบบ birthdate
            userData.age = fc.calculateAge(userData.birthdate); // คำนวณและเพิ่มอายุ

            return userData;
        });

        res.json(users); // ส่งข้อมูลผู้ใช้
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting users by company: ' + error.message });
    }
};
module.exports.getUsersByCompany_position = async (req, res) => {
  try {
      const companyId = req.params.company; // รับ companyId จาก URL parameters
      const position = req.params.position; // รับตำแหน่งจาก URL parameters
      console.log(`Company ID: ${companyId}, Position: ${position}`);
      
      // ดึง companybranchid ทั้งหมดที่เกี่ยวข้องกับ companyId นี้
      const companyBranchesSnapshot = await db.collection('companybranches')
                                              .where('companyID', '==', companyId)
                                              .get();

      if (companyBranchesSnapshot.empty) {
          res.status(404).json({ message: 'ไม่พบสาขาของบริษัทที่ตรงกับ company ID นี้' });
          return;
      }

      const companyBranchIds = companyBranchesSnapshot.docs.map(doc => doc.id); // เก็บ companybranchid
      console.log(companyBranchIds);
      if (companyBranchIds.length === 0) {
          res.status(404).json({ message: 'ไม่พบผู้ใช้สำหรับบริษัทนี้' });
          return;
      }

      // เริ่มต้น query สำหรับผู้ใช้
      let usersQuery = db.collection('users').where('companybranch', 'in', companyBranchIds);

      // เพิ่มเงื่อนไขการกรองตำแหน่งถ้ามีการระบุตำแหน่ง
      if (position === "HR") {
          usersQuery = usersQuery.where('position', '==', position);
      } else if (position === "user") {
          usersQuery = usersQuery.where('position', '!=', "HR");
      }

      const usersSnapshot = await usersQuery.get();

      if (usersSnapshot.empty) {
          res.status(404).json({ message: 'ไม่พบผู้ใช้สำหรับบริษัทนี้' });
          return;
      }

      const users = usersSnapshot.docs.map(doc => {
          const userData = doc.data();
          userData.id = doc.id; // เพิ่ม user ID
          userData.birthdate = fc.formatDate(userData.birthdate); // จัดรูปแบบ birthdate
          userData.age = fc.calculateAge(userData.birthdate); // คำนวณและเพิ่มอายุ

          return userData;
      });

      res.json(users); // ส่งข้อมูลผู้ใช้
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ตามบริษัท: ' + error.message });
  }
};


  module.exports.getUsersByCompanyBranch = async (req, res) => {
    try {
      const companyBranch = req.params.branch; // Get company branch from URL parameter
      const usersSnapshot = await db.collection('users').where('companybranch', '==', companyBranch).get(); // Fetch users by company branch
  
      if (usersSnapshot.empty) {
        res.status(404).json({ message: 'No users found in this company branch' });
        return;
      }
  
      const users = [];
  
      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        userData.id = doc.id; // Add user ID
        userData.birthdate = fc.formatDate(userData.birthdate); // Format birthdate
        userData.age = fc.calculateAge(userData.birthdate); // Calculate and add age
  
        users.push(userData); // Add user data to array
      }
  
      res.json(users); // Send users data
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting users by company branch: ' + error.message });
    }
  };

  module.exports.getUsersByDepartment = async (req, res) => {
    try {
      const department = req.params.department; // Get department from URL parameter
      const usersSnapshot = await db.collection('users').where('department', '==', department).get(); // Fetch users by department
  
      if (usersSnapshot.empty) {
        res.status(404).json({ message: 'No users found in this department' });
        return;
      }
  
      const users = [];
  
      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        userData.id = doc.id; // Add user ID
        userData.birthdate = fc.formatDate(userData.birthdate); // Format birthdate
        userData.age = fc.calculateAge(userData.birthdate); // Calculate and add age
  
        users.push(userData); // Add user data to array
      }
  
      res.json(users); // Send users data
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting users by department: ' + error.message });
    }
  };
  module.exports.updateUser = async (req, res) => {
      try {
          const userId = req.params.id; 
          const userRef = db.collection('users').doc(userId); 
          const userSnapshot = await userRef.get(); 
  
          if (!userSnapshot.exists) {
             
              res.status(404).json({ message: 'User not found' });
              return;
          }
  
          const currentUserData = userSnapshot.data();
          const email = req.body.email;
  
         
          const companiesEmailSnapshot = await db.collection('companies').where('email', '==', email).get();
          const usersEmailSnapshot = await db.collection('users').where('email', '==', email).get();
  
          if ((!companiesEmailSnapshot.empty && currentUserData.email !== email) || 
              (!usersEmailSnapshot.empty && usersEmailSnapshot.docs.some(doc => doc.id !== userId))) {
              res.status(400).json({ message: 'Email already exists' });
              return;
          }
          const updatedData = {
              firstname: req.body.firstname,
              lastname: req.body.lastname,
              email: email,
              gender: req.body.gender,
              birthdate: new Date(req.body.birthdate),
              companybranch: req.body.companybranch || null,
              department: req.body.department || null,
              // positionTemplate: req.body.positionTemplate,
              phone: req.body.phone,
              position: req.body.position,
              startwork: req.body.startwork || null,
              address: req.body.subdistrict + "," + req.body.district + "," + req.body.province + "," + req.body.country,
          };
  
          if (req.body.password) {
              const isSamePassword = await bcrypt.compare(req.body.password, currentUserData.password);
              if (!isSamePassword) {
                  const hashedPassword = await bcrypt.hash(req.body.password, 10);
                  updatedData.password = hashedPassword;
              }
          }
  
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




