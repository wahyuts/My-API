const functions = require("firebase-functions");
const app = require('express')();

const FBAuth =require('./util/fbauth');
const {db} = require('./util/admin');


const { getAllScream,postOneScream,getScream,commentOnScream,likeScream,unlikeScream,deleteScream} = require('./handlers/screams')
const { signup,signin,uploadImage,addUserDetails,getUserInfo,getOtherUserDetails,markNotificationsRead} = require('./handlers/users')


// Scream Routes

//Get all scream route
app.get('/screams', getAllScream);

//Get one scream route
app.get('/scream/:screamId', getScream);

//Post One scream route
app.post('/scream', FBAuth, postOneScream);

//Post a commentar on the one scream route
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);

//Like a scream route
app.get('/scream/:screamId/like', FBAuth, likeScream);

//Unlike a scream route
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);

//Delete screamroute
app.delete('/scream/:screamId', FBAuth, deleteScream);

//************************************************************************************************ */

//User route

//Sign up Route lll
app.post('/signup', signup)

//Sign In Route
app.post('/signin', signin)

app.post('/user/image', FBAuth, uploadImage)

app.post('/user', FBAuth, addUserDetails)

app.get('/user', FBAuth, getUserInfo)

app.get('/user/:name', getOtherUserDetails)

app.post('/notifications', FBAuth, markNotificationsRead)


exports.api = functions.region('asia-southeast1').https.onRequest(app) // gunakan chain .region jika ingin ganti server,..pilihan region ada di doc firbasenya

exports.createNotificationOnLike = functions.region('asia-southeast1').firestore.document('likes/{id}')
    .onCreate((snapshot)=>{
       return db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then((doc)=>{
                if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'like', 
                        read: 'false', 
                        screamId: doc.id
                    });
                }
            })
            .catch((err)=>
                console.error(err));
            
    });
exports.deleteNotificationOnUnlike = functions.region('asia-southeast1').firestore.document('likes/{id}')
    .onDelete((snapshot)=>{
        return db.doc(`/notifications/${snapshot.id}`).delete()
            .catch((err)=>{
                console.error(err);
                return;
            })
    })

exports.createNotificationOnComment = functions.region('asia-southeast1').firestore.document('comments/{id}')
    .onCreate((snapshot)=>{
        return db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then((doc)=>{
                if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'comment', 
                        read: 'false', 
                        screamId: doc.id
                    });
                }
            })
            .catch((err)=>{
                console.error(err);
                return;
            });
    })

exports.onUserImageChange = functions.region('asia-southeast1').firestore.document('/users/{userId}')
    .onUpdate((change)=>{
        console.log(change.before.data());
        console.log(change.after.data());

        if(change.before.data().imageUrl !== change.after.data().imageUrl){
            console.log('image has changed');
            const batch = db.batch();
            return db.collection('screams').where('userHandle', '==', change.before.data().name).get()
            .then((data) => {
                data.forEach(doc => {
                    const scream = db.doc(`/screams/${doc.id}`);
                    batch.update(scream, {userImage: change.after.data().imageUrl});
                })
                return batch.commit();
            })
        } else return true;
    });

exports.onScreamDelete = functions.region('asia-southeast1').firestore.document('/screams/{screamId}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();
        return db.collection('comments').where('screamId', '==', screamId).get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                })
                return db.collection('likes').where('screamId', '==', screamId).get();
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                })
                return db.collection('notifications').where('screamId', '==', screamId).get();
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/notifications/${doc.id}`));
                })
                return batch.commit();
            })
            .catch(err => console.error(err));
    })