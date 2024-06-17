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

// ฟังก์ชันอัปโหลดภาพและรับ URL ที่เซ็นชื่อแล้ว
const uploadImage = async (req) => {
    try {
        const { file, uid, folder, collection } = req.body;

        // เส้นทางไฟล์ใน Storage
        const fileName = `${uid}_${Date.now()}.png`;
        const filePath = `images/${uid}/${folder}/${fileName}`;
        const fileRef = bucket.file(filePath);

        // อัปโหลดไฟล์
        const buffer = Buffer.from(file, 'base64');
        await fileRef.save(buffer, {
            metadata: { contentType: 'image/png' },
        });

        // รับ URL ที่เซ็นชื่อแล้ว
        const [signedUrl] = await fileRef.getSignedUrl({
            action: 'read',
            expires: '01-01-2025',
        });

        return { Url: signedUrl, filePath };
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

// ฟังก์ชันลบภาพที่มีอยู่ในโฟลเดอร์
const deleteExistingImages = async (uid, folder) => {
    try {
        const prefix = `images/${uid}/${folder}/`;
        const [files] = await bucket.getFiles({ prefix });

        if (files.length > 0) {
            console.log(`Deleting ${files.length} files in folder: ${prefix}`);
            await Promise.all(files.map(file => file.delete()));
        }
    } catch (error) {
        console.error('Error deleting existing images:', error);
        throw error;
    }
};

module.exports.insert_img = async (req, res) => {
    try {
        console.log("Uploading...", req.body);
        const userId = req.body.uid;
        const field = req.body.folder || 'profile';
        const collection = req.body.collection || 'users';
        const userRef = db.collection(collection).doc(userId);

        // ตรวจสอบว่าผู้ใช้มีอยู่จริงหรือไม่
        const userSnapshot = await userRef.get();
        if (!userSnapshot.exists) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // ลบภาพที่มีอยู่ในโฟลเดอร์
        await deleteExistingImages(userId, field);

        // อัปโหลดภาพใหม่และรับ URL ที่เซ็นชื่อแล้ว
        const uploadRes = await uploadImage(req);
        const imageUrl = uploadRes.Url;
        console.log("UploadRes", uploadRes);

        // อัปเดตโปรไฟล์ผู้ใช้ด้วย URL ของภาพ
        const updateData = { [field]: imageUrl };
        await userRef.update(updateData);

        console.log('Profile uploaded successfully');
        res.json({ message: 'Profile uploaded successfully', imageUrl: imageUrl });
    } catch (error) {
        console.error('Error uploading profile:', error);
        res.status(500).json({ message: 'Error uploading profile' });
    }
};