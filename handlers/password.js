// forgotPassword.js
const admin = require('../admin.js');
const db = admin.firestore();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const bcrypt = require('bcrypt');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  YOUR_CLIENT_ID, // ClientID
  YOUR_CLIENT_SECRET, // Client Secret
  "https://developers.google.com/oauthplayground" // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token: YOUR_REFRESH_TOKEN
});

const accessToken = oauth2Client.getAccessToken();

const smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
       type: "OAuth2",
       user: "YOUR_EMAIL_ADDRESS", 
       clientId: YOUR_CLIENT_ID,
       clientSecret: YOUR_CLIENT_SECRET,
       refreshToken: YOUR_REFRESH_TOKEN,
       accessToken: accessToken
  }
});

module.exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const usersRef = db.collection('users');
        const usersSnapshot = await usersRef.where('email', '==', email).get();

        if (usersSnapshot.empty) {
            return res.status(404).json({ message: 'Email not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = Date.now() + 3600000; // 1 hour

        const userDoc = usersSnapshot.docs[0];
        const userRef = userDoc.ref;

        await userRef.update({
            resetToken: resetToken,
            resetTokenExpires: resetTokenExpires
        });

        const resetLink = `http://your-frontend-url/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: "YOUR_EMAIL_ADDRESS",
            to: email,
            subject: "Password Reset",
            html: `<p>You requested a password reset</p><p>Click this <a href="${resetLink}">link</a> to reset your password</p>`
        };

        smtpTransport.sendMail(mailOptions, (error, response) => {
            if (error) {
                console.log(error);
                res.status(500).json({ message: 'Error sending email: ' + error.message });
            } else {
                console.log(response);
                res.status(200).json({ message: 'Password reset link sent successfully' });
            }
            smtpTransport.close();
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing password reset: ' + error.message });
    }

};
module.exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const usersRef = db.collection('users');
        const usersSnapshot = await usersRef.where('resetToken', '==', token).get();

        if (usersSnapshot.empty) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const userDoc = usersSnapshot.docs[0];
        const userRef = userDoc.ref;
        const userData = userDoc.data();

        if (userData.resetTokenExpires < Date.now()) {
            return res.status(400).json({ message: 'Token expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await userRef.update({
            password: hashedPassword,
            resetToken: admin.firestore.FieldValue.delete(),
            resetTokenExpires: admin.firestore.FieldValue.delete()
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error resetting password: ' + error.message });
    }
};

