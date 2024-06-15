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

module.exports.uploadImage = async (req, res) => {
    try {
        console.log("uploading...")
        const companyId = req.body.uid;
        const folder = req.body.folder;
        const fileName = `${companyId}_${req.file.originalname}`;
        const filePath = `images/${companyId}/${folder}/${fileName}`;

        const file = bucket.file(filePath);
        console.log("req",req.body)
        const stream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        stream.on('error', (error) => {
            console.error('Error uploading image:', error);
            res.status(500).json({ message: 'Error uploading image' });
        });

        stream.on('finish', async () => {
            console.log('Upload finished');
            try {
                const signedUrl = await getSignedUrl(filePath);
                res.status(200).json({
                    message: 'File uploaded successfully',
                    filePath: filePath,
                    Url: signedUrl // Ensure this is set
                });
            } catch (error) {
                if (!res.headersSent) { // Check if headers have been sent
                    res.status(500).json({ message: 'Error generating download URL' ,
                        filePath: "errorfilePath",
                        Url: "error" // Ensure this is set
                    });
                }
            }
        });
        

        stream.end(req.file.buffer); // สิ้นสุด WriteStream และอัปโหลดไฟล์

    } catch (error) {
        console.error('Error in uploadImage:', error);
        res.status(500).json({ message: 'Error uploading image' });
    }
};
