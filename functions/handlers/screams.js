const { db } = require('../util/admin')

//Fetching all scream
exports.getAllScream = (req,res) => { // pakai fungsi app.get jika menggunakan express
    db
      .collection(`screams`)  // collection adalah tabel nya kalo di database
      .orderBy('createdAt', 'desc')  // orderBy adalah semacam perintah sort
      .get() // get adalah perintah untuk dapetin data
      .then((data) => { // promise nya
        let screams = [];
         data.forEach((doc) => {
           screams.push({ 
             screamId: doc.id,
             body: doc.data().body,
             userHandle: doc.data().userHandle,
             createdAt: doc.data().createdAt,
             commentCount: doc.data().commentCount,
             likeCount: doc.data().likeCount,
             userImage: doc.data().userImage
           })
         })
         return res.json(screams);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: err.code});
      });
  }

  //post a scream or status
  exports.postOneScream = (req,res) => { 

    if(req.body.body.trim() === ''){
      return res.status(400).json({ body: "Body must not be empty"})
    }
    const newScream = {
      body: req.body.body,  // body pertama adalah parameter body createScream, body kedua adalah statement bodynya si req, body ketiga adalah property dari bodynya si req
      userHandle: req.user.name, // maksud nya sama kek yang diatas cuma ini userHandle
      // createdAt: admin.firestore.Timestamp.fromDate(new Date())  gunakan code firestore.Timestamp jika ingin tanggal dari firebase 
      userImage: req.user.imageUrl,
      createdAt: new Date().toISOString(), // pake code ini karena lebih friendly javascript
      likeCount: 0, 
      commentCount: 0
    }
  
    db
      .collection(`screams`)
      .add(newScream)
      .then((doc) => {
          const resScream = newScream;
          resScream.screamId = doc.id;
          res.json(resScream) // message disini properti dari json object
      })
      .catch((err) => {
          res.status(500).json({error: `something went wrong`}); // error disini properti dari json object
          console.error(err);
      })
  }

  // Fetching all commentar on 1 postingan scream
  exports.getScream = (req, res) => {
    let screamData = {};
    db.doc(`/screams/${req.params.screamId}`).get()
      .then((doc) => {
        if(!doc.exists){
          return res.status(404).json({ error: 'Scream not found'})
        }
        screamData = doc.data();
        screamData.screamId = doc.id;
        return db
          .collection('comments')
          .orderBy('createdAt', 'desc')
          .where('screamId', '==', req.params.screamId)
          .get();
      })
      .then((data)=>{
        screamData.comments = [];
        data.forEach((doc) => {
          screamData.comments.push(doc.data())
        });
        return res.json(screamData);
      })
      .catch((err)=>{
        console.error(err);
        res.status(500).json({error: err.code});
      });
  }

  //give or putt commentar on scream
  exports.commentOnScream = (req, res) => {
    if(req.body.body.trim() === '') return res.status(400).json({ comment: 'Must not be empty'});
    const newComment = {
      body: req.body.body, 
      createdAt: new Date().toISOString(),
      screamId: req.params.screamId,
      userHandle: req.user.name,
      userImage: req.user.imageUrl
    };

    db.doc(`/screams/${req.params.screamId}`).get()
      .then(doc => {
        if(!doc.exists){
          return res.status(404).json({ error: 'Scream not found'});
        }
        return doc.ref.update({commentCount: doc.data().commentCount + 1})
        // return db.collection('comments').add(newComment);
      })
      .then(()=>{
        return db.collection('comments').add(newComment);
      })
      .then(()=>{
        res.json(newComment);
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({error: 'Something went wrong'});
      })
  }

  //******************************************************************************************************** */

  //Like a scream

  exports.likeScream = (req, res) => {
    // Langkah 1. buat path collection likes dengan syarat  "db collection likes dimana userHandle = nama user yang login"  dan simpan di const likeDocument
    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.name)
      .where('screamId', '==', req.params.screamId).limit(1);

    //Langkah ke 2. simpan hasil "document di database di path screams dengan id scream yang diminta"
    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    // Langkah ke 3. bikin variable let screamData
    let screamData;

    // Langkah ke 4. baca screamDocument dengan fungsi get dan cek ke validtannya dengan .then
    screamDocument.get()
      // Then ke -1 Jika screamDocument dengan screamId yang diminta ada, maka cek apakah data-data nya(doc)
      // ada didalam screamDocuemnt tersebut ? (cth "body", "likeCount" dll yang ada di field)
      // kalo ada maka buat collection likes dengan fungsi get dari path likeDocument, kalo tidak error: 'Scream not found'
      .then(doc=>{
        if(doc.exists){ //jika doc ada
          screamData = doc.data(); //masukan doc data ke screamData
          screamData.screamId = doc.id;
          return likeDocument.get(); 
        } else {
          return res.status(404).json({ error: 'Scream not found' })
        }
      })
      // Then ke -2. dijalankan jika screamData ada
      // kemudian cek apakah data didalam likes collection ada atau kososng(belum ada)
      .then(data => {
        if(data.empty){ // jika data belum ada
          return db.collection('likes').add({ //tambahkan data ke collection likes
            screamId: req.params.screamId,
            userHandle: req.user.name
          })
          .then(()=>{
            screamData.likeCount++ // ubah likeCount status (cth..like nya 1 jadi 2)
            return screamDocument.update({ likeCount: screamData.likeCount }) //update staus like count di screamDocument
          })
          .then(()=>{
            return res.json(screamData);
          })
        } else { // jika data di dalam likes collection ada maka  error: 'You have already like the scream'
          return res.status(400).json({ error: 'You have already like the scream'})
        }
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code });
      })
  }

  //******************************************************************************************************** */


  //Unlike a scream

  exports.unlikeScream = (req, res) => {
    // Langkah 1. buat path collection likes dengan syarat  "db collection likes dimana userHandle = nama user yang login"  dan simpan di const likeDocument
    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.name)
      .where('screamId', '==', req.params.screamId).limit(1);

    //Langkah ke 2. simpan hasil "document di database di path screams dengan id scream yang diminta"
    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    // Langkah ke 3. bikin variable let screamData
    let screamData;

    // Langkah ke 4. baca screamDocument dengan fungsi get dan cek ke validtannya dengan .then
    screamDocument.get()
      // Then ke -1 Jika screamDocument dengan screamId yang diminta ada, maka cek apakah data-data nya(doc)
      // ada didalam screamDocuemnt tersebut ? (cth "body", "likeCount" dll yang ada di field)
      // kalo ada maka buat collection likes dengan fungsi get dari path likeDocument, kalo tidak error: 'Scream not found'
      .then(doc=>{
        if(doc.exists){ //jika doc ada
          screamData = doc.data(); //masukan doc data ke screamData
          screamData.screamId = doc.id;
          return likeDocument.get(); 
        } else {
          return res.status(404).json({ error: 'Scream not found' })
        }
      })
      // Then ke -2. dijalankan jika screamData ada
      // kemudian cek apakah data didalam likes collection ada atau kososng(belum ada)
      .then(data => {
        if(data.empty){ // jika data belum ada maka tampilkan
          return res.status(400).json({ error: 'You cant unlike because you havent like it before'});
        } else { // jika data di dalam likes collection ada maka  delete
            return db.doc(`/likes/${data.docs[0].id}`).delete()
              .then(()=>{
                screamData.likeCount--;
                return screamDocument.update({likeCount: screamData.likeCount});
              })
              .then(()=>{
                // res.json({screamData});
                res.json(screamData);
              })
          }
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code });
      })
  }

  //********************************************************************************************** */

  //DELETE Scream 

  exports.deleteScream = (req, res) => {
    const document = db.doc(`/screams/${req.params.screamId}`);
    document.get()
      .then(doc=>{
        if(!doc.exists){
          res.status(404).json({error: 'Scream not found'});
        }
        if(doc.data().userHandle !== req.user.name){
          return res.status(403).json({ error: 'Unauthorized'})
        } else {
          return document.delete();
        }
      })
      .then(()=>{
        res.json({message: 'Scream deleted successfuly'});
      })
      .catch((err)=>{
        console.error(err);
        return res.status(500).json({ error: err.code });
      })
  }