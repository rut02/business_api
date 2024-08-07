const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { createCanvas, loadImage, registerFont } = require('canvas');
const admin = require('../admin.js');
const db = admin.firestore();
const api = "https://business-api-638w.onrender.com";

// Load custom font
// registerFont(path.join(__dirname, './static/NotoSans_Condensed-Bold.ttf'), { family: 'NotoSans' });

// ฟังก์ชันวาด Business Card
async function drawCard(data, outputPath) {
    const width = 950;
    const height = 550;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
  
    // Draw the background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
  
    // Draw profile image
    if (data.profile) {
      try {
        const profileImage = await loadImage(data.profile);
        ctx.drawImage(profileImage, (width - 150) / 2, 50, 150, 150); // วางภาพโปรไฟล์ตรงกลาง
      } catch (err) {
        console.error('Error loading profile image:', err);
      }
    }
  
    // Draw user data
    ctx.fillStyle = '#333';
    ctx.font = '32px tahoma'; 
    ctx.textAlign = 'center'; // ปรับตำแหน่งข้อความให้ตรงกลาง
    ctx.fillText(`${data.firstname} ${data.lastname}`, width / 2, 250);
  
    ctx.font = '24px tahoma'; 
    ctx.textAlign = 'center'; 
    ctx.fillText(`Position: ${data.position}`, width / 2, 300);
    ctx.fillText(`Birthdate: ${data.birthdate}`, width / 2, 340);
    ctx.fillText(`Gender: ${data.gender}`, width / 2, 380);
    ctx.fillText(`Phone: ${data.phone}`, width / 2, 420);
    ctx.fillText(`Email: ${data.email}`, width / 2, 460);
    ctx.fillText(`Address: ${data.address}`, width / 2, 500);
  
    // Save the canvas as a PNG image
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