const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    pseudo: {
        type: String,
        required: [true, 'Pseudo requis']
    },
    mail: {
        type: String,
        required: [true, 'Mail requis'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password requis']
    },
    bio: {
        type: String,
        required: false
    },
    image: {
        type: String,
        required: false
    },
    isAdmin: {
        type: String,
        default: 'false',
    },
    isConnect: {
        type: String,
        default: 'false',
    },
    isBanned: {
        type: String,
        default: 'false',
    },
    mailVerified: {
        type: String,
        default: 'false',
    },
    mailVerificationCode: {
        type: String,
        required: true
    },
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model('User', userSchema)