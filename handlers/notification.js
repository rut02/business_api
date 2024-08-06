// notification.js
const { getUserToken } = require('./user');
const admin = require('../admin.js');

async function sendNotification(req, res) {
  const { userId, messageTitle, messageBody } = req.body;

  const token = await getUserToken(userId);
  console.log("token: ",token);

  if (!token) {
    return res.status(404).send('User token not found');
  }

  const message = {
    notification: {
      title: messageTitle,
      body: messageBody
    },
    token: token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    res.status(200).send('Notification sent successfully',req.body);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('Error sending notification');
  }
}

module.exports = {
  sendNotification
};
