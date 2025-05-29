const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true pour 465, false pour autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendVerificationEmail(email, name, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: 'Vérifiez votre adresse email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vérification Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Vérification de votre compte</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Merci de vous être inscrit ! Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
              <p style="text-align: center; color:white;">
                <a href="${verificationUrl}" class="button">Vérifier mon email</a>
              </p>
              <p>Ou copiez et collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">
                ${verificationUrl}
              </p>
              <p><strong>Ce lien expire dans 24 heures.</strong></p>
              <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email de vérification envoyé à ${email}`);
    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email de vérification');
    }
  }

  async sendWelcomeEmail(email, name) {
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: 'Bienvenue !',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bienvenue !</h1>
            </div>
            <div class="content">
              <h2>Félicitations ${name} !</h2>
              <p>Votre email a été vérifié avec succès. Votre compte est maintenant actif !</p>
              <p>Vous pouvez maintenant profiter de toutes les fonctionnalités de notre plateforme.</p>
              <p>Merci de nous faire confiance !</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email de bienvenue envoyé à ${email}`);
    } catch (error) {
      console.error('Erreur envoi email de bienvenue:', error);
    }
  }

  async sendResetPasswordEmail(email, name, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisation mot de passe</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Réinitialisation de mot de passe</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              </p>
              <p>Ou copiez et collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">
                ${resetUrl}
              </p>
              <div class="warning">
                <p><strong>⚠️ Important :</strong></p>
                <ul>
                  <li>Ce lien expire dans <strong>1 heure</strong></li>
                  <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                  <li>Pour votre sécurité, ne partagez jamais ce lien</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email de réinitialisation envoyé à ${email}`);
    } catch (error) {
      console.error('Erreur envoi email de réinitialisation:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation');
    }
  }

  async sendPasswordChangedEmail(email, name) {
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: 'Votre mot de passe a été modifié',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mot de passe modifié</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .alert { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Mot de passe modifié</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Votre mot de passe a été modifié avec succès.</p>
              <div class="alert">
                <p><strong>ℹ️ Information :</strong></p>
                <p>Si vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement pour sécuriser votre compte.</p>
              </div>
              <p>Date de modification : ${new Date().toLocaleString('fr-FR')}</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email de confirmation de modification envoyé à ${email}`);
    } catch (error) {
      console.error('Erreur envoi email de confirmation:', error);
      // Ne pas faire échouer le processus si l'email de confirmation échoue
    }
  }
}

module.exports = new EmailService();