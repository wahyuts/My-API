const functions = require("firebase-functions");
const app = require('express')();

const FBAuth =require('./util/fbauth')

const { getAllScream,postOneScream,getScream,commentOnScream,likeScream,unlikeScream,deleteScream} = require('./handlers/screams')
const { signup,signin,uploadImage,addUserDetails,getUserInfo} = require('./handlers/users')


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


//TODO Delete scream


//Sign up Route lll

app.post('/signup', signup)

//Sign In Route

app.post('/signin', signin)

app.post('/user/image', FBAuth, uploadImage)

app.post('/user', FBAuth, addUserDetails)

app.get('/user', FBAuth, getUserInfo)


exports.api = functions.region('asia-southeast1').https.onRequest(app) // gunakan chain .region jika ingin ganti server,..pilihan region ada di doc firbasenya
