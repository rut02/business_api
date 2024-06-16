// img.js
const admin = require('../admin.js');
const bucket = admin.storage().bucket();
const express = require('express');
const db = admin.firestore();

const getSignedUrl = async (filePath) => {
    try {
        const [url] = await bucket.file(filePath).getSignedUrl({
            action: 'read', // กำหนดการดำเนินการ (เช่น 'read', 'write')
            expires: '01-01-2025' // กำหนดเวลาที่ลิงก์จะหมดอายุ (วันที่/เวลา)
        });
        return url; // คืนค่าลิงก์ที่เซ็นชื่อแล้ว
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw error; // ส่งข้อผิดพลาดกลับไป
    }
};

// img.js

const uploadImage = async (req) => {
    try {
        console.log("uploading...");
        const companyId = req.body.uid;
        const folder = req.body.folder;
        const fileName = `${companyId}_${req.file.originalname}`;
        const filePath = `images/${companyId}/${folder}/${fileName}`;

        const file = bucket.file(filePath);
        console.log("req", req.body);
        const stream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        // ใช้ Promise เพื่อจัดการการทำงานแบบอะซิงโครนัสของ WriteStream
        return new Promise((resolve, reject) => {
            stream.on('error', (error) => {
                console.log("e1");
                console.error('Error uploading image:', error);
                reject({ message: 'Error uploading image', filePath: "errorfilePath", Url: "error" });
            });

            stream.on('finish', async () => {
                console.log('Upload finished');
                try {
                    const signedUrl = await getSignedUrl(filePath);
                    console.log("E2");
                    resolve({
                        message: 'File uploaded successfully',
                        filePath: filePath,
                        Url: signedUrl // ส่งคืน URL
                    });
                } catch (error) {
                    console.log("e3", error);
                    console.error('Error generating download URL:', error);
                    reject({ message: 'Error generating download URL', filePath: "errorfilePath", Url: "error" });
                }
            });

            stream.end(req.file.buffer); // สิ้นสุด WriteStream และอัปโหลดไฟล์
        });

    } catch (error) {
        console.error('Error in uploadImage:', error);
        throw new Error('Error uploading image');
    }
};

module.exports.insert_img = async (req, res) => {
    try {
        console.log("uploading...",req.body);
        const userId = req.body.uid; // ID ของผู้ใช้
        const field = req.body.folder || 'profile'; // โฟลเดอร์ที่จะเก็บรูปภาพโปรไฟล์
        const collection = req.body.collection || 'users';
        const userRef = db.collection(collection).doc(userId); // อ้างอิงไปยังเอกสารผู้ใช้
        console.log(field);
        // ตรวจสอบว่าผู้ใช้มีอยู่จริงหรือไม่
        const userSnapshot = await userRef.get();
        if (!userSnapshot.exists) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // อัปโหลดรูปภาพและรับ URL ที่เซ็นชื่อแล้ว
        const uploadRes = await uploadImage(req, res);
        console.log("uploadRes",uploadRes);
        const imageUrl = uploadRes.Url; // รับ URL ของรูปภาพที่อัปโหลด  

        // อัปเดตโปรไฟล์ผู้ใช้ด้วย URL ของรูปภาพ
        const gg = {
            [field]: imageUrl,}
        await userRef.update(gg);
        console.log('Profile uploaded successfully');
        res.json({ message: 'Profile uploaded successfully', imageUrl: imageUrl });
    } catch (error) {
        console.error('Error uploading profile:', error);
        res.status(500).json({ message: 'Error uploading profile' });
    }
};

