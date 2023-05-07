const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');    

const protect = asyncHandler(async (req,res,next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try {
            // Récupération du token depuis le header
            token = req.headers.authorization.split(' ')[1];
            // Vérification du token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Récupération de l'utilisateur du token sans le password
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Acces interdit, token invalide');
        }
    }
    if(!token){
        res.status(401);
        throw new Error('Acces interdit, manque de token');
    }
})

module.exports = { protect }