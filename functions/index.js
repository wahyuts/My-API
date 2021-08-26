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
        db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then((doc)=>{
                if(doc.exists){
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
            .then(()=>{
                return;
            })
            .catch((err)=>{
                console.error(err);
                return;
            });
    });
exports.deleteNotificationOnUnlike = functions.region('asia-southeast1').firestore.document('likes/{id}')
    .onDelete((snapshot)=>{
        db.doc(`/notifications/${snapshot.id}`).delete()
            .then(()=>{
                return;
            })
            .catch((err)=>{
                console.error(err);
                return;
            })
    })

exports.createNotificationOnComment = functions.region('asia-southeast1').firestore.document('comments/{id}')
    .onCreate((snapshot)=>{
        db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then((doc)=>{
                if(doc.exists){
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
            .then(()=>{
                return;
            })
            .catch((err)=>{
                console.error(err);
                return;
            });
    })