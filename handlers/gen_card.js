const fs = require('fs');
const puppeteer = require('puppeteer-core');
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');
const admin = require('../admin.js');
const db = admin.firestore();
const api ="https://business-api-638w.onrender.com";
// const puppeteer = require('puppeteer-core'); // ใช้ puppeteer-core แทน puppeteer ถ้าใช้ Chrome ที่ติดตั้งเอง

// Fetch data from API
async function fetchData(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return null;
    }
}

// Upload image to server
async function uploadImage(filePath, userId) {
    try {console.log('test');
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('uid', userId);
        form.append('folder', 'business_cards');
        form.append('collection', 'users');
        
        const response = await axios.post(api+'/upload-image', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log("response.data",response.data);
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

// const puppeteer = require('puppeteer-core'); // ใช้ puppeteer-core แทน puppeteer ถ้าใช้ Chrome ที่ติดตั้งเอง

const createBusinessCard = async (data) => {
    if (!data) {
        console.log('No valid data to create the card.');
        return;
    }

    const templatePath = path.join(__dirname, 'card.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    template = template.replace('{{PROFILE}}', data.profile || '');
    template = template.replace('{{FIRSTNAME}}', data.firstname || 'Unknown');
    template = template.replace('{{LASTNAME}}', data.lastname || 'Name');
    template = template.replace('{{POSITION}}', data.position || 'Unknown Position');
    template = template.replace('{{BIRTHDATE}}', data.birthdate || 'Unknown Birthdate');
    template = template.replace('{{GENDER}}', data.gender || 'Unknown Gender');
    template = template.replace('{{PHONE}}', data.phone || 'Unknown Phone');
    template = template.replace('{{EMAIL}}', data.email || 'unknown@example.com');
    template = template.replace('{{ADDRESS}}', data.address || 'Unknown Address');

    const tempHtmlPath = path.join(__dirname, 'temp-card.html');
    fs.writeFileSync(tempHtmlPath, template, 'utf8');

    const browser = await puppeteer.launch({
        executablePath: '/path/to/your/chrome', // ระบุเส้นทางไปยัง Chrome ที่ติดตั้ง
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // สำหรับการรันในสภาพแวดล้อมที่จำกัด
    });

    const page = await browser.newPage();
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 600, height: 300 });

    const buffer = await page.screenshot({ type: 'png' });
    const imagePath = './business-card.png';
    fs.writeFileSync(imagePath, buffer);

    await browser.close();
    fs.unlinkSync(tempHtmlPath);

    const uploadResult = await uploadImage(imagePath, data.uid);
    console.log('Upload result:', uploadResult);
};


// Main function to handle user input and call other functions
module.exports.genCard = async (req, res) => {
    try {
        const uid = req.body.uid;
        const apiUrl = api+'/users/'+uid;
        const data = await fetchData(apiUrl);

        if (data) {
            await createBusinessCard(data);
            console.log('Business card created.');
            // const updateResult = await updateBusinessCard(data.businessCard, data.id);
            // console.log('Update result:', updateResult);
            // if (!updateResult) {
            //     throw new Error('Failed to update business card');
            // }
            res.status(200).send('Business card created.');
        } else {
            console.log('Failed to fetch data or create business card.');
            res.status(500).send('Failed to fetch data or create business card.');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};
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



