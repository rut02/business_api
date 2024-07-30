const admin = require('../admin.js');
const db = admin.firestore();
const { formatDate } = require('./function.js');
const { format } = require('date-fns');
const history = require('./history.js');

module.exports.createFriend = async (req, res) => {
    try {
        const friendData = {
            userId: req.body.userId,
            friendId: req.body.friendId,
            status: req.body.status,
            time: new Date(),
        };

        const friendDocRef = await db.collection('friends').add(friendData);
        await history.logAddFriend(req.body.userId, req.body.friendId);
        res.json({ message: 'Friend added successfully', friendId: friendDocRef.id });
    } catch (error) {
        console.error('Error adding friend:', error);
        res.status(500).json({ message: 'Error adding friend: ' + error.message });
    }
};

module.exports.getFriends = async (req, res) => {
    try {
        const friendsSnapshot = await db.collection('friends').get();
        const friends = friendsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // Add document ID to the data
            data.time = format(data.time.toDate(), 'yyyy-MM-dd HH:mm:ss'); // Format timestamp
            return data;
        });

        res.json(friends); // Send all friends data
    } catch (error) {
        console.error('Error getting friends:', error);
        res.status(500).json({ message: 'Error getting friends: ' + error.message });
    }
};

module.exports.getFriendById = async (req, res) => {
    try {
        const friendId = req.params.id; // Get friend ID from URL parameters
        const friendDoc = await db.collection('friends').doc(friendId).get(); // Fetch friend document by ID

        if (!friendDoc.exists) {
            res.status(404).json({ message: 'Friend not found' }); // If friend not found
            return;
        }

        const friendData = friendDoc.data();
        friendData.id = friendDoc.id; // Add document ID to the data
        friendData.time = format(friendData.time.toDate(), 'yyyy-MM-dd HH:mm:ss'); // Format timestamp
        res.json(friendData); // Send friend data
    } catch (error) {
        console.error('Error getting friend by ID:', error);
        res.status(500).json({ message: 'Error getting friend by ID: ' + error.message });
    }
};

module.exports.getFriendsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId; // Get userId
        const friendsSnapshot = await db.collection('friends').where('userId', '==', userId).get();

        if (friendsSnapshot.empty) {
            res.status(404).json({ message: 'No friends found for this user' });
            return;
        }

        const friends = friendsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // Add document ID to the data
            data.time = format(data.time.toDate(), 'yyyy-MM-dd HH:mm:ss'); // Format timestamp
            return data;
        });

        res.json(friends); // Send all friends data for specified user
    } catch (error) {
        console.error('Error getting friends by user ID:', error);
        res.status(500).json({ message: 'Error getting friends by user ID: ' + error.message });
    }
};

module.exports.getFriendsByFriendId = async (req, res) => {
    try {
        const friendId = req.params.friendId; // Get friendId
        const friendsSnapshot = await db.collection('friends').where('friendId', '==', friendId).get();

        if (friendsSnapshot.empty) {
            res.status(404).json({ message: 'No friends found for this friendId' });
            return;
        }

        const friends = friendsSnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id; // Add document ID to the data
            data.time = formatDate(data.time); // Format timestamp
            return data;
        });

        res.json(friends); // Send all friends data for specified friendId
    } catch (error) {
        console.error('Error getting friends by friendId:', error);
        res.status(500).json({ message: 'Error getting friends by friendId: ' + error.message });
    }
};

module.exports.updateStatus = async (req, res) => {
    try {
        const friendId = req.params.friendId; // Get friendId
        const userId = req.params.userId;
        const updatedData = {
            status: req.body.status, // Update status (0=normal, 1=favorite)
        };

        const friendRef = db.collection('friends')
            .where('userId', '==', userId)
            .where('friendId', '==', friendId);

        const snapshot = await friendRef.get();
        if (snapshot.empty) {
            return res.status(404).json({ message: 'Friend not found' });
        }

        // Assuming there's only one document matching the query
        const doc = snapshot.docs[0];
        await doc.ref.update(updatedData);

        res.json({ message: 'Friend updated successfully' });
    } catch (error) {
        console.error('Error updating friend:', error);
        res.status(500).json({ message: 'Error updating friend: ' + error.message });
    }
};

module.exports.updateFriend = async (req, res) => {
    try {
        const friendId = req.params.id; // Get friendId
        const updatedData = {
            status: req.body.status, // Update status (0=normal, 1=favorite)
        };

        const friendRef = db.collection('friends').doc(friendId);
        await friendRef.update(updatedData);

        res.json({ message: 'Friend updated successfully' });
    } catch (error) {
        console.error('Error updating friend:', error);
        res.status(500).json({ message: 'Error updating friend: ' + error.message });
    }
};

module.exports.deleteFriend = async (req, res) => {
    try {
        const friendId = req.params.id; // Get friendId
        const friendRef = db.collection('friends').doc(friendId);

        await friendRef.delete(); // Delete friend

        res.json({ message: 'Friend deleted successfully' });
    } catch (error) {
        console.error('Error deleting friend:', error);
        res.status(500).json({ message: 'Error deleting friend: ' + error.message });
    }
};

module.exports.deleteAllFriend = async (req, res) => {
    try {
        const userId = req.params.userId; // Get userId
        const friendId = req.params.friendId;

        // Batch for deleting documents
        const batch = db.batch();

        // Delete documents from the friends collection
        const friendsSnapshot = await db.collection('friends')
            .where('friendId', '==', friendId)
            .where('userId', '==', userId).get();
        friendsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        const friendsSnapshot2 = await db.collection('friends')
            .where('userId', '==', friendId)
            .where('friendId', '==', userId).get();
        friendsSnapshot2.forEach(doc => {
            batch.delete(doc.ref);
        });

        await history.logDeleteFriend(userId, friendId);

        // Delete documents from the requests collection (requester or responder)
        const requestsSnapshotRequester = await db.collection('requests').where('requesterId', '==', friendId).get();
        requestsSnapshotRequester.forEach(doc => {
            batch.delete(doc.ref);
        });

        const requestsSnapshotResponder = await db.collection('requests').where('responderId', '==', friendId).get();
        requestsSnapshotResponder.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete documents from the joins collection
        const joinsSnapshot = await db.collection('joins').where('userId', '==', friendId).get();
        joinsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Commit the batch
        await batch.commit();

        res.status(200).json({ message: 'ลบข้อมูลเพื่อนทั้งหมดสำเร็จ' });
    } catch (error) {
        console.error("ข้อผิดพลาดในการลบข้อมูลเพื่อน", error);
        res.status(500).json({ message: 'ข้อผิดพลาดในการลบข้อมูลเพื่อน: ' + error.message });
    }
};
