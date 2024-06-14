
//admin.js
const admin = require("firebase-admin");
// const serviceAccount = require("./serviceAccountKey.json");


// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://businesscardonline-cf4c2-default-rtdb.asia-southeast1.firebasedatabase.app" , // ระบุ URL ของ Firebase Realtime Database (ถ้าใช้)
//   storageBucket: 'businesscardonline-cf4c2.appspot.com' // ใส่ชื่อ bucket ที่คัดลอกจาก Firebase Console
// });
require('dotenv').config();

const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.GCP_PROJECT_ID,
    "private_key_id": process.env.GCP_PRIVATE_KEY_ID,
    "private_key": process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.GCP_CLIENT_EMAIL,
    "client_id": process.env.GCP_CLIENT_ID,
    "auth_uri": process.env.GCP_AUTH_URI,
    "token_uri": process.env.GCP_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.GCP_AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.GCP_CLIENT_X509_CERT_URL
};
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket:'business-137ec.appspot.com'

});

module.exports = admin