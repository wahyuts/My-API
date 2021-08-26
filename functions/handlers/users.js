const {admin, db} = require ('../util/admin')

const firebaseConfig = require('../util/config')

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const { validateSignupData, validateSigninData, reduceUserDetails } = require('../util/validator')

exports.signup = (req,res) => {
    const newUser = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      name: req.body.name,
    }

    const {valid,errors} = validateSignupData(newUser);

    if(!valid) return res.status(400).json(errors);
  
    const noImg = 'no-img.png'
    
    // TODO validate data
    let token, userId
    db.doc(`/users/${newUser.name}`).get()
      .then(doc => {
        if(doc.exists){
          return res.status(400).json({ name: 'this name is already taken'});
        } else {
          return firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
        }
      })
      .then(data => {
        userId = data.user.uid;
        return data.user.getIdToken();
        
      })
      .then((idToken) => {
        token = idToken;
        const userCredentials = {
          name: newUser.name,
          email: newUser.email, 
          createdAt: new Date().toISOString(),
          imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${noImg}?alt=media`,
          userId
        };
        return db.doc(`/users/${newUser.name}`).set(userCredentials)
        // return res.status(201).json({ token });
      })
      .then(() => {
        return res.status(201).json({token});
      })
      .catch(err => {
        console.error(err);
        if (err.code === "auth/email-already-in-use"){
          return res.status(400).json({email: "Email is already in use"})
        } else {
          return res.status(500).json({error: err.code})
        }
      })
  
  }

  exports.signin = (req,res) => {
    const user = {
      email: req.body.email, 
      password: req.body.password,
    }

    const {valid,errors} = validateSigninData(user);

    if(!valid) return res.status(400).json(errors);
  
    
  
    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
      .then(data => {
        // return res.status(201).json({message: "Sign in success", token: data.user.getIdToken()})
        return data.user.getIdToken();
      })
      .then(token => {
        return res.json({token});
      })
      .catch(err => {
        console.error(err);
        if(err.code === "auth/wrong-password"){
          return res.status(403).json({ general : "wrong email or password"})
        } else if ( err.code === "auth/user-not-found"){
          return res.status(403).json({ general : "wrong email or password"})
        } else
        return res.status(500).json({error: err.code})
      })
  
  }

  //addUserDetails function

  exports.addUserDetails = (req,res) => {
    let userDetails = reduceUserDetails(req.body);

    db.doc(`/users/${req.user.name}`).update(userDetails)
      .then(()=>{
        return res.json({ message: 'Details added successfuly'});
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code});
      })
  }

  //get any user details or profile
  exports.getOtherUserDetails = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.params.name}`).get()
      .then(doc => {
        if(doc.exists){
          userData.user = doc.data();
          return db.collection('screams').where('userHandle', '==', req.params.name)
            .orderBy('createdAt', 'desc')
            .get();
        } else {
          return res.status(404).json({ error: 'User not found' });
        }
      })
      .then((data)=>{
        userData.screams = [];
        data.forEach((doc) => {
          userData.screams.push({
            body: doc.data().body,
            createdAt: doc.data().createdAt,
            userHandle: doc.data().userHandle,
            userImage: doc.data().userImage,
            likeCount: doc.data().likeCount,
            commentCount: doc.data().commentCount,
            screamId: doc.id
          })
        });
        return res.json(userData);
      })
      .catch((err)=>{
        console.error(err);
        return res.status(500).json({ err: err.code });
      })
  }

  //get own user Details (only own)

  exports.getUserInfo = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.user.name}`).get()
      .then(doc => {
        if(doc.exists){
          userData.credentials = doc.data();
          return db.collection('likes').where('userHandle', '==', req.user.name).get()
        }
      })
      .then( data => {
        userData.likes = [];
        data.forEach(doc => {
            userData.likes.push(doc.data());
        });
        return db.collection('notifications').where('recipient', '==', req.user.name)
          .orderBy('createdAt','desc').limit(10).get();
        // return res.json(userData);
      })
      .then((data)=>{
        userData.notifications = [];
        data.forEach(doc => {
          userData.notifications.push({
            recipient: doc.data().recipient,
            sender: doc.data().sender,
            createdAt: doc.data().createdAt,
            screamId: doc.data().screamId,
            type: doc.data().type,
            read: doc.data().read,
            notificationId: doc.id
          })
        })
        return res.json(userData);
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code});
      })
  }

  //Upload Image functions
  exports.uploadImage = (req, res) => {
    const Busboy = require('busboy');
    const path = require ('path');
    const os = require('os');
    const fs =require('fs');

    const busboy = new Busboy({ headers: req.headers});

    let imageFileName;
    let imageToBeUploaded = {};


    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      if(mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
        return res.status(400).json({ error: 'Wrong file type submitted'});
      }
      // my.image.png  ---- kode dibawah buat ambil .png nya doang
      const imageExtension = filename.split('.')[filename.split('.').length -1];
      // 2254564365476.png
      imageFileName = `${Math.round(Math.random()*100000000000)}.${imageExtension}`;
      const filepath = path.join(os.tmpdir(), imageFileName);
      imageToBeUploaded = { filepath, mimetype} ;
      file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on('finish', ()=>{
      admin.storage().bucket().upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata:{
          metadata: {
            contentType: imageToBeUploaded.mimetype
          }
        }
      })
      .then(()=>{
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`
        return db.doc(`/users/${req.user.name}`).update({ imageUrl });
      })
      .then(()=>{
        return res.json({ message: "Image uploaded successfully"});
      })
      .catch (err => {
        console.error(err);
        return res.status(500).json({ error: err.code })
      });
    });
    busboy.end(req.rawBody);
  }

  exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();

    req.body.forEach(notificationId => {
      const notification = db.doc(`/notifications/${notificationId}`);
      batch.update(notification, {read: true});
    });
    batch.commit()
      .then(()=>{
        return res.json({ message: 'Notification mark read'});
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  };

