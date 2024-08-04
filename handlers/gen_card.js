const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const puppeteer = require('puppeteer');
const admin = require('../admin.js');
const db = admin.firestore();
const api = "https://business-api-638w.onrender.com";

// ฟังก์ชันสร้าง Business Card จาก HTML และบันทึกเป็นรูปภาพ
async function createCardImage(data, outputPath) {
    const htmlContent = fs.readFileSync(path.join(__dirname, 'card.html'), 'utf-8')
        .replace('{{PROFILE}}', data.profile)
        .replace('{{FIRSTNAME}}', data.firstname)
        .replace('{{LASTNAME}}', data.lastname)
        .replace('{{POSITION}}', data.position)
        .replace('{{BIRTHDATE}}', data.birthdate)
        .replace('{{GENDER}}', data.gender)
        .replace('{{PHONE}}', data.phone)
        .replace('{{EMAIL}}', data.email)
        .replace('{{ADDRESS}}', data.address);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.setViewport({ width: 600, height: 300 });
    await page.screenshot({ path: outputPath, fullPage: true });
    await browser.close();
}

// ฟังก์ชันอัปโหลดภาพไปยังเซิร์ฟเวอร์
async function uploadImage(filePath, userId) {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('uid', userId);
        form.append('folder', 'business_card');
        form.append('collection', 'users');

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
    await createCardImage(data, imagePath);

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