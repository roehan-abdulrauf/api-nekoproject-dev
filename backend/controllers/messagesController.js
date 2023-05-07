const asyncHandler = require('express-async-handler');
const Message = require('../models/messageModel');
const User = require('../models/userModel');
const { body, validationResult } = require('express-validator');
const io = require('../server');


// @desc Recupérer tous les messages
// @route GET /api/messages
// @access private
const getAllMessages = asyncHandler(async (req, res) => {
    const messages = await Message.find();
    // const messages = await Message.find({ user: req.user.id });
    res.status(200).json(messages);
})


// @desc Recupérer un message
// @route GET /api/messages/:id
// @access private 
const getMessage = asyncHandler(async (req, res) => {
    if (!req.params.id) {
        res.status(400);
        throw new Error("Message non trouvé");
    } else {
        const message = await Message.findById(req.params.id);

        res.status(200).json(message)
    }
})


// @desc Enregistrer un message et envoyer via websocket
// @route POST /api/messages
// @access private
const setMessage = asyncHandler(async (req, res) => {

    // Verifs et validation du pseudo
    await body('text').notEmpty().withMessage('Le message est requis. Veuillez en entrer un').trim().isLength({ min: 1, max: 300 }).withMessage("Votre message doit être compris entre 1 et 300 caractères").run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array()[0].msg);
    }

    if (!req.body.text) {
        res.status(400);
        throw new Error("Aucun message n'a été envoyé");
    } else {
        const message = await Message.create({
            user: req.user.id,
            userPseudo: req.user.pseudo,
            text: req.body.text,
        })

        let socketMessage = await Message.findById(message._id).populate('user');

        const msg = {
            _id:socketMessage._id,
            user:message.user,
            userPseudo:message.userPseudo,
            text:message.text,
            isValid:message.isValid,
            createdAt:message.createdAt,
            updatedAt:message.updatedAt
        }
        // Code pour envoyer des données au client
        io.emit("socket_message",(msg));
        console.log("socket message envoyé", msg);
        res.status(200).json(message);
    }
})


// @desc Modifier un message
// @route POST /api/messages/:id
// @access private
const updateMessage = asyncHandler(async (req, res) => {

    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(400);
        throw new Error("Aucun message trouvé");
    } else {
        if (!req.body.text) {

            res.status(400);
            throw new Error("Body de la requête vide");
        } else {

            const user = await User.findById(req.user.id);

            // Vérifier si l'utilisateur est connecté 
            if (!user) {
                res.status(401);
                throw new Error("Aucun utilisateur trouvé");
            }
            // Vérifier si l'utilisateur connectée est le propriétaire du message (éviter qu'un utilisateur ne modifie les données d'un autre)
            if (message.user.toString() !== user.id) {
                res.status(401);
                throw new Error("Vous n'êtes pas autorisé à modifier ce message");
            }

            const updatedMessage = await Message.findByIdAndUpdate(req.params.id, req.body,
                {
                    new: true
                })

            res.status(200).json(updatedMessage);
        }
    }
})


// @desc Supprimer un message
// @route DELETE /api/messages/:id
// @access private
const deleteMessage = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(400);
        throw new Error("Aucun message n'a été envoyé");
    } else {

        const user = await User.findById(req.params.id);

        // Vérifier si l'utilisateur est connecté 
        if (!user) {
            res.status(401);
            throw new Error("Aucun utilisateur trouvé");
        }
        // Vérifier si l'utilisateur connectée est le propriétaire du message (éviter qu'un utilisateur ne modifie les données d'un autre)
        if (global.user.toString() !== user.id) {
            res.status(401);
            throw new Error("Vous n'êtes pas autorisé à modifier ce message");
        }

        await message.remove();
        res.status(200).json({ id: req.params.id })
    }
})


// @desc Supprimer un message
// @route DELETE /api/messages/:id
// @access private
const deleteMessageAdmin = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(400);
        throw new Error("Ce message n'existe pas");
    } else {

        const user = await User.findById(req.user.id);

        // Vérifier si l'utilisateur est connecté et est un admin
        if (user.isAdmin === false) {
            res.status(401);
            throw new Error("Opération non autorisé");
        }
        await message.remove();
        res.status(200).json({ id: req.params.id })
            .then(() => res.json({ message: "Le message à été supprimer avec succès" }))
            .catch((error) => res.status(400).json({ error: "Action impossible" }));
    }
})

// @desc Supprimer un message
// @route PUT /api/messages/:id
// @access private
const updateMessageAdmin = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(400);
        throw new Error("Ce message n'existe pas");
    } else {

        const user = await User.findById(req.user.id);

        // Vérifier si l'utilisateur est connecté et est un admin
        if (user.isAdmin === false) {
            res.status(401);
            throw new Error("Opération non autorisé");
        }
        await User.findOneAndUpdate(
            { _id: req.params.id },
            {
                $set: {
                    isValid: 'false',
                },
            }).then(() => {
                res.status(200).json({
                    message: "Le message est censurée avec succès!"
                })
            })
    }

})

module.exports = {
    getAllMessages,
    setMessage,
    deleteMessage,
    getMessage,
    updateMessage,
    deleteMessageAdmin,
    updateMessageAdmin
}