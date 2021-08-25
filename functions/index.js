const functions = require("firebase-functions");
const app = require('express')();

const FBAuth =require('./util/fbauth')

const { getAllScream,postOneScream,getScream,commentOnScream} = require('./handlers/screams')
const { signup,signin,uploadImage,addUserDetails,getUserInfo} = require('./handlers/users')


// Scream Routes
app.get('/screams', getAllScream);
app.get('/scream/:screamId', getScream);
app.post('/scream', FBAuth, postOneScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream)
//TODO Delete scream
//TODO Like scream 
//TODO Unlike scream
//TODO Comment on scream




//Sign up Route lll

app.post('/signup', signup)

//Sign In Route

app.post('/signin', signin)

app.post('/user/image', FBAuth, uploadImage)

app.post('/user', FBAuth, addUserDetails)

app.get('/user', FBAuth, getUserInfo)


exports.api = functions.region('asia-southeast1').https.onRequest(app) // gunakan chain .region jika ingin ganti server,..pilihan region ada di doc firbasenya
