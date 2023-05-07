const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const { body, validationResult } = require('express-validator');
const io = require('../utiles/socketIoClient');

// @desc Recupérer tous les users et envoyer via websocket
// @route GET /api/users
// @access private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find()

    if (!users) {
        res.status(400).json({ error: "Aucun Utilisateurs" });
    }
    else {
        // io.emit("socket_user", users);
        io.emit("socket_user", users);
        console.log("socket user recup", users);
        res.status(200).json(users);
    }
    // .then((user) => {
    //     res.status(200).json(user);
    // })
    // .catch((error) => res.status(400).json({ error: "Aucun Utilisateurs" }));

})


// @desc Recupérer un user
// @route GET /api/users/:id
// @access private
const getUser = asyncHandler(async (req, res) => {
    await User.findById(req.params.id)
        .then((user) => {
            res.status(200).json(user);
        })
        .catch((error) => res.status(400).json({ error: "l'Utilisateur n'existe pas" }));
})



// @desc inscription d'un utilisateur
// @route POST /api/users/
// @access public
const registerUser = asyncHandler(async (req, res) => {

    // Verifs et validation du pseudo
    await body('pseudo').notEmpty().withMessage('Le pseudo est requis').trim().isLength(4)
        .withMessage('Votre pseudo est trop court, il doit faire 4 caractères minimum').run(req);

    // Verification et validation du mail
    await body('mail').notEmpty().withMessage('L\'adresse e-mail est requise').trim().isEmail()
        .withMessage('L\'adresse e-mail doit être valide').matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        .withMessage('L\'adresse e-mail doit être valide').run(req);

    // Verifs et validation du passsword
    await body('password').notEmpty().withMessage('Le mot de passe est requis').trim().isLength({ min: 6 })
        .withMessage('Le mot de passe doit comporter au moins 6 caractères')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
        .withMessage('Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre.')
        .run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array()[0].msg);
    }

    const { pseudo, mail, password } = req.body;

    if (!pseudo || !mail || !password) {

        res.status(400);
        throw new Error('Please add all fields');
    }

    // Utilisateur déjà éxistant
    const userMailExists = await User.findOne({ mail });
    const userPseudoExists = await User.findOne({ pseudo });

    if (userMailExists) {
        res.status(400);
        throw new Error('Adresse mail déja utilisée');
    }
    if (userPseudoExists) {
        res.status(400);
        throw new Error('Pseudo déjà utilisé,veuillez en choisir un autre');
    }


    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        pseudo,
        mail,
        password: hashedPassword,
    })

    if (user) {
        res.status(200);
        res.json({
            _id: user.id,
            pseudo: user.pseudo,
            email: user.mail,
            token: generateToken(user._id),
        })
    } else {
        res.status(400);
        throw new Error('Données utilisateur non valides')
    }

})



// @desc Authentifier un utilisateur
// @route POST /api/users/login
// @access public
const login = asyncHandler(async (req, res) => {

    // Verifs du mail
    await body('mail').notEmpty().withMessage('L\'adresse e-mail est requise').trim().isEmail()
        .withMessage('L\'adresse e-mail doit être valide').matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        .withMessage('L\'adresse e-mail doit être valide').run(req);

    // Verifs du password
    await body('password').notEmpty().withMessage('Le mot de passe est requis').trim().isLength({ min: 6 })
        .withMessage('Le mot de passe doit comporter au moins 6 caractères')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
        .withMessage('Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre.')
        .run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        console.log(errors);
        throw new Error(errors.array()[0].msg);
    }

    const { mail, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ mail });
    if (user == null) {
        res.status(401);
        throw new Error('Utilisateur introuvable.');
    }
    if (user.isBanned === 'true') {
        res.status(404);
        throw new Error('Vous avez été banni vous ne pouvez plus vous connecter');
    }

    if (user != null && (await bcrypt.compare(password, user.password))) {
        await User.findOneAndUpdate(
            { mail: mail },
            {
                $set: {
                    isConnect: 'true',
                },
            }).then(() => {
                res.json({
                    _id: user.id,
                    pseudo: user.pseudo,
                    email: user.mail,
                    isAdmin: user.isAdmin,
                    isConnect: user.isConnect,
                    token: generateToken(user._id),
                    isBanned: user.isBanned,
                    mailVerified: user.mailVerified,
                })
            })
    } else {
        res.status(401);
        throw new Error('Identifiant ou mot de passe incorrect');
    }
})

// @desc Vérifier si l'utilisateur est déconnecté
// @route PUT /api/users/logout
// @access public
const logout = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        User.findOneAndUpdate(
            { _id: req.user._id },
            {
                $set: {
                    isConnect: 'false',
                },
            }).then(() => {
                res.status(200).json({
                    message: 'Vous êtes bien déconnecté'
                })
            })
    } else {
        res.status(400);
        throw new Error('Aucun utilisateur trouvé');
    }
})


// @desc Mettre mailverified à true
// @route PUT /api/users/mailVerified
// @access public
const mailVerified = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        User.findOneAndUpdate(
            { _id: req.user._id },
            {
                $set: {
                    mailVerified: 'true',
                },
            }).then(() => {
                res.status(200).json({
                    message: 'Mail vérifié'
                })
            })
    } else {
        res.status(400);
        throw new Error('Aucun utilisateur trouvé');
    }
})

// Création du token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

// @desc Récupérer les données d'user
// @route GET /api/users/me
// @access private

const getMe = asyncHandler(async (req, res) => {
    const { id, mail, pseudo } = await User.findById(req.user.id);

    res.status(200).json({
        id,
        email: mail,
        pseudo,
    })
})


// @desc Modifier infos user
// @route PUT /api/users/:id
// @access private
const updateUser = asyncHandler(async (req, res) => {

    const { pseudo, mail, password, bio, image } = req.body;
    const mailAlreadyExists = await User.findOne({ mail });
    const pseudoAlreadyExists = await User.findOne({ pseudo });

    if (pseudo) {
        // Verifs et validation du pseudo
        await body('pseudo').notEmpty().withMessage('Le pseudo est requis').trim().isLength(4)
            .withMessage('Votre pseudo est trop court, il doit faire 4 caractères minimum').run(req);
    }

    if (mail) {
        // Verifs du mail
        await body('mail').notEmpty().withMessage('L\'adresse e-mail est requise').trim().isEmail()
            .withMessage('L\'adresse e-mail doit être valide').matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
            .withMessage('L\'adresse e-mail doit être valide').run(req);
    }

    if (password) {
        // Verifs du password
        await body('password').notEmpty().withMessage('Le mot de passe est requis').trim().isLength({ min: 6 })
            .withMessage('Le mot de passe doit comporter au moins 6 caractères')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
            .withMessage('Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre.')
            .run(req);
    }

    if (bio) {
        await body('bio').notEmpty().withMessage('La bio est requise. Veuillez en entrer un')
            .trim().isLength({ min: 1, max: 300 })
            .withMessage("Votre bio doit être comprise entre 1 et 300 caractères").run(req);
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        console.log(errors);
        throw new Error(errors.array()[0].msg);
    }
    // Vérifier si aucun champ est rempli
    if (!pseudo && !mail && !password && !bio && !image) {
        res.status(400);
        throw new Error('Veuillez remplir au moins un champs !');
    } // Vérifier si au moins un champs est rempli
    else {

        const user = await User.findById(req.user.id);

        // Vérifier si l'utilisateur existe
        if (!user) {
            res.status(400);
            throw new Error("Aucun utilisateur trouvé");
        } else {
            if (mailAlreadyExists) {
                res.status(400);
                throw new Error('Adresse mail déjà utilisée');
            }

            if (pseudoAlreadyExists) {
                res.status(400);
                throw new Error('Pseudo déjà utilisé');
            }
            const salt = await bcrypt.genSalt(10);
            const passwordHash = password ? await bcrypt.hash(password, salt) : undefined;

            const updatedUser = await User.findByIdAndUpdate(req.user.id, {
                pseudo,
                mail,
                password: passwordHash,
                bio,
                image
            },
                {
                    new: true
                })

            res.status(200).json(updatedUser)
        }
    }
})


// @desc Supprimer un user
// @route DELETE /api/users/:id
// @access private
const deleteUser = asyncHandler(async (req, res) => {
    User.deleteOne({ _id: req.params.id })
        .then(() => res.json({ message: "l'utilisateur à bien été supprimer" }))
        .catch((error) => res.status(400).json({ error: "Aucun Utilisateur trouvé" }));

})


// @desc Modifier les droit d'un user en etant admin
// @route PUT /api/users/:id
// @access private
const updateUserAdmin = asyncHandler(async (req, res) => {

    const { isAdmin, isBanned } = req.body;

    const user = await User.findById(req.user.id);

    if (user.isAdmin === false) {
        res.status(401);
        throw new Error("Vous n'êtes pas autorisé à modifier le role de cet utilisateur");
    } else {
        // Vérifier si le champs isAdmin est remplir
        if (isAdmin) {
            // Vérifier si l'utilisateur existe puis le modifier
            User.findOneAndUpdate(
                { _id: req.params.id },
                {
                    $set: {
                        isAdmin: isAdmin,
                    },
                }).then(() => {
                    res.status(200).json({
                        message: "Utilisateur bien modifié !"
                    })
                })
        }
        // Vérifier si le champs isBanned est remplir
        if (isBanned) {
            // Vérifier si l'utilisateur existe puis le modifier
            User.findOneAndUpdate(
                { _id: req.params.id },
                {
                    $set: {
                        isBanned: isBanned,
                    },
                }).then(() => {
                    res.status(200).json({
                        message: "Utilisateur bien modifié !"
                    })
                })
        }
    }
})


// @desc Supprimer un user en etant admin
// @route DELETE /api/users/:id
// @access private
const deleteUserAdmin = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user.id);

    if (user.isAdmin === false) {
        res.status(401);
        throw new Error("Vous n'êtes pas autorisé à supprimer un utilisateur");
    } else {
        User.deleteOne({ _id: req.params.id })
            .then(() => res.json({ message: "l'utilisateur à bien été supprimer" }))
            .catch((error) => res.status(400).json({ error: "Aucun Utilisateur trouvé" }));
    }
})

module.exports = {
    getAllUsers,
    getUser,
    registerUser,
    login,
    logout,
    mailVerified,
    getMe,
    updateUser,
    deleteUser,
    updateUserAdmin,
    deleteUserAdmin
};