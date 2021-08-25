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
             likeCount: doc.data().likeCount
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
      createdAt: new Date().toISOString() // pake code ini karena lebih friendly javascript
    }
  
    db
      .collection(`screams`)
      .add(newScream)
      .then((doc) => {
          res.json({ message: `document ${doc.id} created successfully`}) // message disini properti dari json object
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
    if(req.body.body.trim() === '') return res.status(400).json({ error: 'Comment must not be empty'});
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