const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    userPseudo: {
        type: mongoose.Schema.Types.String,
        required: true,
        ref: 'User',
    },
    text: {
        type: String,
        required: [true, "Please add a text value"]
    },
    isValid: { 
        type: String,
        default: 'true',
    },
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Message', messageSchema)