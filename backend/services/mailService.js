const nodemailer = require('nodemailer');

const sendMail = async (pseudo, email, verificationCode) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'nekochat28@gmail.com',
      pass: 'ojgzobqrugnjiwns',
    },
  });

  // const confirmationUrl = `https://b08f-2a04-cec0-1215-ace3-2557-f2fe-766c-3c?token=${verificationCode}`;
  const confirmationUrl = `https://a596-2a02-8428-eb8a-e101-15d-25ec-cfaa-a750.ngrok-free.app/?token=${verificationCode}`;

  const mailOptions = {
    from: `"Neko Chat" <support@nekochat.app>`,
    to: `${email}`,
    subject: 'Vérifiez votre adresse e-mail pour accéder à notre application',
    html: `<p><span style="font-size: 12pt;">Salut ${pseudo},</span></p>
    <p><span style="font-size: 12pt;">Merci de vous être inscrit sur Neko Chat ! Nous sommes ravis de vous avoir à bord.</span></p>
    <p><span style="font-size: 12pt;">Merci de confirmer votre email (${email}) en cliquant sur le boutton ci-dessous.</span></p>
    <p><a href="${confirmationUrl}"><button style="background-color: orange; color: white; padding: 8px 16px 8px 16px; font-size: 20px; border: none; cursor: pointer;">Confirmer</button></a></p>
    <p><span style="font-size: 12pt;">Si vous avez des questions ou des préoccupations, n'hésitez pas à nous contacter.</span></p>
    <p><span style="font-size: 12pt;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez tout simplement ignorer cet e-mail.</span></p>
    <p><br><span style="font-size: 12pt;">Cordialement,</span><br><span style="font-size: 12pt;">L'équipe Neko Chat</span></p>`
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendMail,
};
