const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { createCanvas, loadImage, registerFont } = require('canvas');
const admin = require('../admin.js');
const db = admin.firestore();
const api = "https://business-api-638w.onrender.com";

// ตรวจสอบเส้นทางฟอนต์
const fontPath = path.join(__dirname, 'THSarabunNew.ttf');
if (fs.existsSync(fontPath)) {
    registerFont(fontPath, { family: 'THSarabunNew' });
} else {
    console.error('Font file not found:', fontPath);
}

// ฟังก์ชันวาด Business Card
async function drawCard(data, outputPath) {
    const canvasWidth = 650;
    const canvasHeight = 450;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
  
    // วาดพื้นหลัง
    ctx.fillStyle = "#ADD8E6";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
    // วาดภาพโปรไฟล์
    if (data.profile) {
        try {
            const profileImage = await loadImage(data.profile);
            ctx.drawImage(profileImage, 35, 95, 150, 150);
        } catch (err) {
            console.error('Error loading profile image:', err);
        }
    }
  
    // วาดข้อมูลผู้ใช้
    ctx.fillStyle = '#333';
    ctx.font = '42px THSarabunNew';
    ctx.textAlign = 'left';
  
    const userDataX = 230;
    const userDataY = 130;
    ctx.fillText(`${data.firstname} ${data.lastname}`, userDataX, userDataY - 10);
  
    ctx.font = '34px THSarabunNew';
    const userDataSpacing = 38;
    ctx.fillText(`Position: ${data.position}`, userDataX, userDataY + userDataSpacing);
    ctx.fillText(`Birthdate: ${data.birthdate}`, userDataX, userDataY + userDataSpacing * 2);
    ctx.fillText(`Gender: ${data.gender}`, userDataX, userDataY + userDataSpacing * 3);
    ctx.fillText(`Phone: ${data.phone}`, userDataX, userDataY + userDataSpacing * 4);
    ctx.fillText(`Email: ${data.email}`, userDataX, userDataY + userDataSpacing * 5);
    ctx.fillText(`Address: ${data.address}`, userDataX, userDataY + userDataSpacing * 6);
  
    // บันทึกเป็นไฟล์ภาพ PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
}

// ฟังก์ชันอัปโหลดภาพไปยังเซิร์ฟเวอร์
async function uploadImage(filePath, userId) {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('uid', userId);
        form.append('folder', 'business_card');
        form.append('collection', 'users');

        // ใช้ฟังก์ชันแบบอะซิงโครนัสเพื่อคำนวณ Content-Length
        const headers = {
            ...form.getHeaders(),
            'Content-Length': await new Promise((resolve, reject) => {
                form.getLength((err, length) => {
                    if (err) reject(err);
                    else resolve(length);
                });
            })
        };

        const response = await axios.post(api + '/upload-image', form, { headers });

        if (response.data && response.data.imageUrl) {
            return response.data;
        } else {
            throw new Error('Failed to get upload URL');
        }
    } catch (error) {
        console.error('Error uploading image:', error.message);
        return null;
    }
}

// ฟังก์ชันดึงข้อมูลจาก API
async function fetchData(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return null;
    }
}

// ฟังก์ชันสร้าง Business Card จากข้อมูล
async function createBusinessCard(data) {
    if (!data) {
        console.log('No valid data to create the card.');
        return;
    }

    const imagePath = path.join(__dirname, 'business-card.png');
    await drawCard(data, imagePath);

    const uploadResult = await uploadImage(imagePath, data.id);
    console.log('Upload result:', uploadResult);
}

// ฟังก์ชันหลัก
module.exports.genCard = async (req, res) => {
    try {
        const uid = req.body.uid;
        const apiUrl = api + '/users/' + uid;
        const data = await fetchData(apiUrl);

        if (data) {
            await createBusinessCard(data);
            res.status(200).send('Business card created.');
        } else {
            res.status(500).send('Failed to fetch data or create business card.');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

// ฟังก์ชันอัปเดต Business Card ในฐานข้อมูล
const updateBusinessCard = async (imageUrl, userId) => {
    try {
        const userRef = db.collection('users').doc(userId);
        const userSnapshot = await userRef.get();

        if (!userSnapshot.exists) {
            throw new Error('User not found');
        }

        await userRef.update({
            businessCard: imageUrl,
        });

        console.log('Business card updated successfully');
        return true; // ส่งคืนสถานะสำเร็จ
    } catch (error) {
        console.error('Error updating business card:', error.message);
        return false; // ส่งคืนสถานะล้มเหลว
    }
};