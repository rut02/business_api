const express = require('express');
const fileUpload = require('express-fileupload');
const Jimp = require('jimp');
const qrCode = require('qrcode-reader');

const router = express.Router();
router.use(fileUpload());

router.post('/scan', async (req, res) => {
  if (!req.files || !req.files.image) {
    return res.status(400).send('No file uploaded.');
  }

  const imageBuffer = req.files.image.data;

  try {
    const image = await Jimp.read(imageBuffer);
    const qr = new qrCode();

    qr.callback = (err, value) => {
      if (err) {
        return res.status(500).send('Error reading QR code.');
      }

      res.json({ result: value.result });
    };

    qr.decode(image.bitmap);
  } catch (error) {
    res.status(500).send('Error processing image.');
  }
});

module.exports = router;
