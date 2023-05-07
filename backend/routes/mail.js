const express = require('express');
const mailService = require('../services/mailService');

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, verificationCode} = req.body;

  try {
    await mailService.sendMail(name, email, verificationCode);
    res.status(200).send('Email sent successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
