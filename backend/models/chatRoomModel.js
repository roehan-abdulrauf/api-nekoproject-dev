const mongoose = require('mongoose');

const chatRoomSchema = mongoose.Schema({
    initiator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    type: {
        type: String,
        default: 'true',
    },
    chatRoomName: {
        type: String,
        default: 'true',
    },
    initiatorPseudo: {
        type: String,
        required: false
    },
    patnerPseudo: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    attendees: [{
        type: String,
        default: 'true',
    }],
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model('chatRoom', chatRoomSchema)