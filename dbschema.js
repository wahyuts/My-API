// dbschema ini tidak ada hubungannya denga code project yang berlangsung
// dbschema ini hanya semacam ref atau note atau coret2 an

//dibawah ini cth db yang ingin dibuat

let db = {
    users: [
        {
            userId: 'sgfgdhgfdhyr',
            email: 'wahyu@gmail.com',
            name: 'user',
            createdAt: 'tanggal isinya dalam bentuk string',
            imageUrl: 'url image',
            bio: 'biograhi',
            //  (property) location: string
            location: 'indonesia'
        }
    ],
    screams: [
        {
            userHandle: "usernya atau yang punya scream",
            body: "ini isi screamnya",
            createdAt: "2021-08-03T08:09:52.064Z",
            likeCount: 5,
            commentCount: 2
        }
    ],
    comments: [
        {
            userHandle: 'user',
            screamId: 'balalalala',
            body: 'nice one mate',
            createdAt: 'tanggalnya'
        }
    ],
    notifications: [
        {
            recipient: 'user', 
            sender: 'John',
            read: 'true|false',
            screamId: 'sfgdsgfgfdg',
            type: 'like|comment', 
            createdAt: '2021-08-26T04:04:20.714Z'
        }
    ]
}