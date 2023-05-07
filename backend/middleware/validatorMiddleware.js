const { body, validationResult } = require('express-validator');

const validatorRegister = () =>{

    body('mail').isEmail(),
    body('password').isLength({ min: 8 }),
    (req, res) => {
      // Vérifier s'il y a des erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      // Logique de connexion ici
    };
}


module.exports = { validatorRegister };