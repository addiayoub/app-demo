const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  getBaseTemplate(name, content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Template</title>
        <style>
          /* Base styles */
          body { 
            font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333333;
            background-color: #f7f7f7;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .header {
            padding: 30px 20px;
            text-align: center;
            color: white;
          }
          .logo {
            max-height: 60px;
            margin-bottom: 15px;
          }
          .content {
            padding: 30px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            background: #f5f5f5;
            color: #666666;
            font-size: 12px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #6e8efb, #a777e3);
            color: white !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 30px;
            margin: 20px 0;
            font-weight: 500;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .link {
            word-break: break-all;
            background: #f0f0f0;
            padding: 12px;
            border-radius: 4px;
            margin: 15px 0;
            font-size: 14px;
          }
          .divider {
            height: 1px;
            background: #eeeeee;
            margin: 25px 0;
          }
          .social-icons {
            margin: 20px 0;
          }
          .social-icons a {
            margin: 0 10px;
            text-decoration: none;
          }
          .note {
            background: #f8f9fa;
            border-left: 4px solid #6e8efb;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            ${process.env.EMAIL_LOGO_URL ? 
              `<img src="${process.env.EMAIL_LOGO_URL}" alt="Company Logo" class="logo">` : 
              `<h1>${process.env.APP_NAME || 'Notre Application'}</h1>`
            }
          </div>
          
          <div class="content">
            <h2 style="color: #444444; margin-top: 0;">Bonjour ${name},</h2>
            
            ${content}
            
            <div class="divider"></div>
            
            <p style="margin-bottom: 0;">Cordialement,<br>L'équipe ${process.env.APP_NAME || ''}</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'Notre Application'}. Tous droits réservés.</p>
            <div class="social-icons">
              ${process.env.FACEBOOK_URL ? `<a href="${process.env.FACEBOOK_URL}"><img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" width="24" alt="Facebook"></a>` : ''}
              ${process.env.TWITTER_URL ? `<a href="${process.env.TWITTER_URL}"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" width="24" alt="Twitter"></a>` : ''}
              ${process.env.INSTAGRAM_URL ? `<a href="${process.env.INSTAGRAM_URL}"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="24" alt="Instagram"></a>` : ''}
              ${process.env.LINKEDIN_URL ? `<a href="${process.env.LINKEDIN_URL}"><img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" width="24" alt="LinkedIn"></a>` : ''}
            </div>
            <p>
              <a href="${process.env.SITE_URL}" style="color: #666666; text-decoration: none;">Visitez notre site</a> | 
              <a href="${process.env.SITE_URL}/#Contactez-nous" style="color: #666666; text-decoration: none;">Contact</a> | 
              <a href="${process.env.SITE_URL}" style="color: #666666; text-decoration: none;">Confidentialité</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendVerificationEmail(email, name, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    const content = `
      <p>Merci de vous être inscrit sur notre plateforme. Pour compléter votre inscription, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
      
      <p style="text-align: center;">
        <a href="${verificationUrl}" class="button">Vérifier mon email</a>
      </p>
      
      <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
      <div class="link">${verificationUrl}</div>
      
      <div class="note">
        <p><strong>Note :</strong> Ce lien expirera dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email en toute sécurité.</p>
      </div>
    `;
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Vérification de votre adresse email',
      html: this.getBaseTemplate(name, content)
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
    const content = `
      <p>Bienvenue sur ${process.env.APP_NAME || 'notre plateforme'} ! Nous sommes ravis de vous compter parmi nos membres.</p>
      
      <p>Votre compte a été activé avec succès et vous pouvez maintenant accéder à toutes les fonctionnalités.</p>
      
      <p style="text-align: center;">
        <a href="${process.env.CLIENT_URL}" class="button">Commencer l'exploration</a>
      </p>
      
      <p>Si vous avez des questions ou besoin d'aide, n'hésitez pas à répondre à cet email ou à consulter notre centre d'aide.</p>
    `;
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: `Bienvenue sur ${process.env.APP_NAME || 'notre plateforme'} !`,
      html: this.getBaseTemplate(name, content)
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
    
    const content = `
      <p>Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour procéder :</p>
      
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
      </p>
      
      <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email. Sinon, copiez et collez ce lien dans votre navigateur :</p>
      <div class="link">${resetUrl}</div>
      
      <div class="note">
        <p><strong>Sécurité :</strong></p>
        <ul>
          <li>Ce lien expirera dans 1 heure</li>
          <li>Ne partagez jamais ce lien avec qui que ce soit</li>
          <li>Notre équipe ne vous demandera jamais votre mot de passe</li>
        </ul>
      </div>
    `;
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: this.getBaseTemplate(name, content)
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
    const content = `
      <p>Nous vous confirmons que le mot de passe associé à votre compte a été modifié avec succès.</p>
      
      <p>Date de modification : <strong>${new Date().toLocaleString('fr-FR')}</strong></p>
      
      <div class="note">
        <p><strong>Si vous n'êtes pas à l'origine de cette modification :</strong></p>
        <p>Veuillez <a href="${process.env.CLIENT_URL}/contact" style="color: #6e8efb;">nous contacter immédiatement</a> pour sécuriser votre compte.</p>
      </div>
      
      <p>Pour des raisons de sécurité, nous vous recommandons de :</p>
      <ul>
        <li>Ne jamais partager votre mot de passe</li>
        <li>Utiliser un mot de passe unique</li>
        <li>Activer l'authentification à deux facteurs si disponible</li>
      </ul>
    `;
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Votre mot de passe a été modifié',
      html: this.getBaseTemplate(name, content)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email de confirmation de modification envoyé à ${email}`);
    } catch (error) {
      console.error('Erreur envoi email de confirmation:', error);
    }
  }
}

module.exports = new EmailService();