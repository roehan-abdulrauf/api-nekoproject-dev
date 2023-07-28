const asyncHandler = require('express-async-handler');
const ChatRoom = require('../models/chatRoomModel');
const User = require('../models/userModel');
const { body, validationResult } = require('express-validator');
const io = require('../server');


// @desc Recupérer tous les messages
// @route GET /api/messages
// @access private
const getAllChatRooms = asyncHandler(async (req, res) => {
    const chatRoom = await ChatRoom.find();
    res.status(200).json(chatRoom);
})


// @desc Recupérer un message
// @route GET /api/messages/:id
// @access private 
const getChatRoom = asyncHandler(async (req, res) => {
    if (!req.params.id) {
        res.status(400);
        throw new Error("chatRoom non trouvé");
    } else {
        const chatRoom = await ChatRoom.findById(req.params.id);
        res.status(200).json(chatRoom)
    }
})


// @desc Enregistrer un message et envoyer via websocket
// @route POST /api/messages
// @access private
const setChatRoom = asyncHandler(async (req, res) => {
    const { chatRoomName, type, attendees, description, initiatorPseudo, patnerPseudo } = req.body;

    if (!chatRoomName || !type || !attendees) {
        res.status(400).json({ message: "Des informations sont manquantes dans le corps de la requête." });
        return;
    }

    if (type === "chatRoom") {
        const chatRoomNameExists = await ChatRoom.findOne({ chatRoomName });
        if (chatRoomNameExists) {
            res.status(400).json({ message: "Le nom de la salle de discussion est déjà prise." });
            return;
        }
    }

    const chatRoomData = {
        initiator: req.user.id,
        type: type,
        chatRoomName: chatRoomName,
        attendees: attendees,
    };

    if (description) {
        chatRoomData.description = description;
    }

    if (initiatorPseudo) {
        chatRoomData.initiatorPseudo = initiatorPseudo;
    }

    if (patnerPseudo) {
        chatRoomData.patnerPseudo = patnerPseudo;
    }

    const chatRoom = await ChatRoom.create(chatRoomData);

    io.emit("socket_chatRoom", chatRoom);
    console.log("Socket de la salle de discussion envoyé", chatRoom);

    res.status(200).json(chatRoom);
});
// const setChatRoom = asyncHandler(async (req, res) => {

//     const { chatRoomName, type, attendees } = req.body;

//     if (!chatRoomName && !type && !attendees) {
//         res.status(400).json({ message: "Body de la requête vide" });
//         // throw new Error("Ils manque des informations");
//     } else if (chatRoomName && type && attendees) {
//         // Utilisateur déjà éxistant
//         const chatRoomNameExists = await ChatRoom.findOne({ chatRoomName });

//         if (chatRoomNameExists) {
//             res.status(400).json(chatRoomNameExists);
//         } else {
//             if (req.body.description) {
//                 const chatRoom = await ChatRoom.create({
//                     initiator: req.user.id,
//                     type: type,
//                     chatRoomName: chatRoomName,
//                     description: req.body.description,
//                     attendees: attendees,
//                 })
//                 // Code pour envoyer des données au client
//                 io.emit("socket_chatRoom", (chatRoom));
//                 console.log("socket message envoyé", chatRoom);
//                 res.status(200).json(chatRoom);
//             } else {
//                 const chatRoom = await ChatRoom.create({
//                     initiator: req.user.id,
//                     type: type,
//                     chatRoomName: chatRoomName,
//                     attendees: attendees,
//                 })
//                 // Code pour envoyer des données au client
//                 io.emit("socket_chatRoom", (chatRoom));
//                 console.log("socket message envoyé", chatRoom);
//                 res.status(200).json(chatRoom);
//             }
//         }
//     }
// })


// @desc Modifier un message
// @route POST /api/messages/:id
// @access private
const updateChatRoom = asyncHandler(async (req, res) => {
    const chatRoomVerif = await ChatRoom.findById(req.params.id);
    const { newChatRoomName, newAttendees } = req.body;

    if (!chatRoomVerif) {
        res.status(400);
        throw new Error("Body de la requête vide");
    }

    if (!newChatRoomName || !newAttendees) {
        res.status(400);
        throw new Error("Il manque des informations");
    }

    const newChatRoomNameExists = await ChatRoom.findOne({ chatRoomName: newChatRoomName });

    if (newChatRoomNameExists) {
        res.status(401);
        throw new Error("Le nom de groupe existe déjà");
    }

    const chatRoom = await ChatRoom.findByIdAndUpdate(
        req.params.id,
        {
            chatRoomName: newChatRoomName,
            attendees: newAttendees,
        },
        { new: true }
    );

    res.status(200).json(chatRoom);
});
// const updateChatRoom = asyncHandler(async (req, res) => {

//     const chatRoomVerif = await ChatRoom.findById(req.params.id);

//     const { newChatRoomName, newAttendees } = req.body;

//     if (!chatRoomVerif) {
//         res.status(400);
//         throw new Error("Body de la requête vide");
//     } else {
//         const newChatRoomNameExists = await ChatRoom.findOne({ newChatRoomName });
//         // const newAttendeesExists = await ChatRoom.findOne({ newAttendees });

//         if (!newChatRoomName) {
//             res.status(400);
//             throw new Error("Ils manque des informations");
//         } else {
//             if (newChatRoomNameExists) {
//                 res.status(401);
//                 throw new Error("Le nom de groupe existe déjà");
//             } else {

//                 const chatRoom = await ChatRoom.findByIdAndUpdate(req.user.id, {
//                     chatRoomName: newChatRoomName,
//                 },
//                     {
//                         new: true
//                     })
//                 res.status(200).json(chatRoom)
//             }
//         }

//         if (!newAttendees) {
//             res.status(400);
//             throw new Error("Ils manque des informations");
//         } else {
//             if (newAttendeesExists) {
//                 res.status(401);
//                 throw new Error("Le nom de groupe existe déjà");
//             } else {
//                 const chatRoom = await ChatRoom.findByIdAndUpdate(req.user.id, {
//                     attendees: newAttendees,
//                 },
//                     {
//                         new: true
//                     })
//                 res.status(200).json(chatRoom)

//             }
//         }
//     }
// })


// @desc Supprimer un message
// @route DELETE /api/messages/:id
// @access private
const deleteChatRoom = asyncHandler(async (req, res) => {

    const chatRoom = await ChatRoom.findById(req.params.id);

    if (!chatRoom) {
        res.status(400);
        throw new Error("Aucun groupe n'a été envoyé");
    } else {

        const user = await User.findById(req.user.id);

        // Vérifier si l'utilisateur est connecté 
        if (!user) {
            res.status(401);
            throw new Error("Aucun utilisateur trouvé");
        } else {
            // res.status(600).json({ chatRoom })
            if (chatRoom.attendees.includes(req.user.id)) {
                await chatRoom.remove();
                res.status(200).json({ id: req.params.id, message: "Le groupe à été supprimer avec succès" })
            } else {
                res.status(401);
                throw new Error("Vous n'êtes pas autorisé à supprimer ce groupe");
            }
        }
    }
})


// // @desc Supprimer un message
// // @route DELETE /api/messages/:id
// // @access private
// const deleteMessageAdmin = asyncHandler(async (req, res) => {
//     const message = await Message.findById(req.params.id);

//     if (!message) {
//         res.status(400);
//         throw new Error("Ce message n'existe pas");
//     } else {

//         const user = await User.findById(req.user.id);

//         // Vérifier si l'utilisateur est connecté et est un admin
//         if (user.isAdmin === false) {
//             res.status(401);
//             throw new Error("Opération non autorisé");
//         }
//         await message.remove();
//         res.status(200).json({ id: req.params.id })
//             .then(() => res.json({ message: "Le message à été supprimer avec succès" }))
//             .catch((error) => res.status(400).json({ error: "Action impossible" }));
//     }
// })

// // @desc Supprimer un message
// // @route PUT /api/messages/:id
// // @access private
// const updateMessageAdmin = asyncHandler(async (req, res) => {
//     const message = await Message.findById(req.params.id);

//     if (!message) {
//         res.status(400);
//         throw new Error("Ce message n'existe pas");
//     } else {

//         const user = await User.findById(req.user.id);

//         // Vérifier si l'utilisateur est connecté et est un admin
//         if (user.isAdmin === false) {
//             res.status(401);
//             throw new Error("Opération non autorisé");
//         }
//         await User.findOneAndUpdate(
//             { _id: req.params.id },
//             {
//                 $set: {
//                     isValid: 'false',
//                 },
//             }).then(() => {
//                 res.status(200).json({
//                     message: "Le message est censurée avec succès!"
//                 })
//             })
//     }

// })

module.exports = {
    getAllChatRooms,
    setChatRoom,
    deleteChatRoom,
    getChatRoom,
    updateChatRoom,
    // deleteMessageAdmin,
    // updateMessageAdmin
}