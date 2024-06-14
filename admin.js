
//admin.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://businesscardonline-cf4c2-default-rtdb.asia-southeast1.firebasedatabase.app" , // ระบุ URL ของ Firebase Realtime Database (ถ้าใช้)
//   storageBucket: 'businesscardonline-cf4c2.appspot.com' // ใส่ชื่อ bucket ที่คัดลอกจาก Firebase Console
// });
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket:'business-137ec.appspot.com'

});

module.exports = admin