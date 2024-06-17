// gen_card.js
const fs = require('fs');
const puppeteer = require('puppeteer');
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');

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
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('uid', userId);
        form.append('folder', 'business_cards');
        form.append('collection', 'users');

        const response = await axios.post('https://business-api-638w.onrender.com/upload-image', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error uploading image:', error.message);
        return null;
    }
}

// Create business card from data
async function createBusinessCard(data) {
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

    const browser = await puppeteer.launch({ headless: true });
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
}

// Main function to handle user input and call other functions
module.exports.genCard = async (req, res) => {

    const uid = req.body.uid
    const apiUrl = `https://business-api-638w.onrender.com/users/${uid}`;
    const data = await fetchData(apiUrl);

    if (data) {
        await createBusinessCard(data);
        console.log('Business card created.');
    } else {
        console.log('Failed to fetch data or create business card.');
    }
}



