const nodemailer = require('nodemailer');
const User = require('../models/User');

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
  // Dans EmailService.js, ajoutez cette nouvelle méthode
async sendPlanAssignmentEmail(email, name, plan, dashboards) {
  // Construire la liste des dashboards inclus dans le plan
  const dashboardList = dashboards.map(dashboard => {
    return `
      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin: 10px 0;">
        <h4 style="color: #495057; margin: 0 0 10px 0;">${dashboard.name}</h4>
        <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">
          <strong>Accès :</strong> ${plan.billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}
        </p>
       
      </div>
    `;
  }).join('');

  const content = `
    <p>Nous avons le plaisir de vous informer que le plan <strong>${plan.name}</strong> vous a été assigné avec succès.</p>
    
    <div style="background: #e7f5ff; border: 1px solid #d0ebff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1971c2; margin-top: 0;">Détails du plan</h3>
      <p><strong>Nom du plan :</strong> ${plan.name}</p>
      <p><strong>Type d'abonnement :</strong> ${plan.billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}</p>
      <p><strong>Prix :</strong> ${plan.price} ${plan.currency}</p>
      <p><strong>Statut :</strong> Actif</p>
    </div>
    
    <h3 style="color: #495057; border-bottom: 2px solid #6e8efb; padding-bottom: 10px;">
      Tableaux de bord inclus :
    </h3>
    
    ${dashboardList}
    
    <div class="note">
      <p><strong>Fonctionnalités principales du plan :</strong></p>
      <ul>
        ${plan.features.filter(f => f.available).map(f => `<li>${f.text}</li>`).join('')}
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/dashboards" class="button">Accéder à mes tableaux de bord</a>
    </p>
    
    <div style="background: #fff3bf; border: 1px solid #ffec99; border-radius: 6px; padding: 12px; margin: 20px 0;">
      <p style="margin: 0; color: #5f3dc4; font-size: 14px;">
        <strong>💡 Astuce :</strong> Votre nouveau rôle <strong>${plan.name.toLowerCase().includes('pro') ? 'Pro' : 'Entreprise'}</strong> 
        vous donne accès à des fonctionnalités supplémentaires sur la plateforme.
      </p>
    </div>
    
    <p>Si vous avez des questions concernant votre nouveau plan ou si vous rencontrez des difficultés, 
    n'hésitez pas à <a href="${process.env.CLIENT_URL}/contact" style="color: #6e8efb;">contacter notre équipe</a>.</p>
  `;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: `Nouveau plan assigné : ${plan.name} - ${process.env.APP_NAME || 'Notre plateforme'}`,
    html: this.getBaseTemplate(name, content)
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Email d'assignation de plan envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur envoi email d\'assignation de plan:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email d\'assignation de plan');
  }
}
// Ajoutez ces méthodes à EmailService
async sendAdminTrialNotification(adminEmail, adminName, user, plan) {
  const content = `
    <p>Un nouvel essai de plan a été activé par un utilisateur :</p>
    
    <div style="background: #e7f5ff; border: 1px solid #d0ebff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1971c2; margin-top: 0;">Détails de l'utilisateur</h3>
      <p><strong>Nom :</strong> ${user.name}</p>
      <p><strong>Email :</strong> ${user.email}</p>
      <p><strong>Date d'inscription :</strong> ${new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
    </div>
    
    <div style="background: #fff3bf; border: 1px solid #ffec99; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #5f3dc4; margin-top: 0;">Détails du plan d'essai</h3>
      <p><strong>Plan :</strong> ${plan.name}</p>
      <p><strong>Type :</strong> ${plan.billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}</p>
      <p><strong>Prix :</strong> ${plan.price} ${plan.currency}</p>
      <p><strong>Durée de l'essai :</strong> 14 jours</p>
      <p><strong>Date d'expiration :</strong> ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</p>
    </div>
    
    <div class="note">
      <p><strong>Actions possibles :</strong></p>
      <ul>
        <li>Contacter l'utilisateur pour un suivi</li>
        <li>Vérifier le profil de l'utilisateur dans l'administration</li>
        <li>Préparer des informations complémentaires si nécessaire</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.ADMIN_URL || process.env.CLIENT_URL}/admin/users/${user._id}" class="button">
        Voir le profil utilisateur
      </a>
    </p>
  `;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `Nouvel essai activé - ${user.name} - Plan ${plan.name}`,
    html: this.getBaseTemplate(adminName, content)
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Notification d'essai envoyée à l'admin ${adminEmail}`);
  } catch (error) {
    console.error('Erreur envoi email notification admin:', error);
  }
}

async sendTrialStartedEmail(email, name, plan, trialEndDate) {
  const formattedEndDate = trialEndDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
    <div style="background: #ebfbee; border: 1px solid #d3f9d8; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #2b8a3e; margin-top: 0;">🎉 Votre essai gratuit a commencé !</h3>
      <p style="font-size: 18px; color: #2b8a3e;">
        Profitez de toutes les fonctionnalités du plan <strong>${plan.name}</strong> jusqu'au ${formattedEndDate}
      </p>
    </div>
    
    <p>Merci d'avoir choisi ${process.env.APP_NAME || 'notre plateforme'}. Votre période d'essai de 14 jours pour le plan <strong>${plan.name}</strong> est maintenant active.</p>
    
    <div style="background: #fff3bf; border: 1px solid #ffec99; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #5f3dc4; font-size: 14px;">
        <strong>📅 Date de fin d'essai :</strong> ${formattedEndDate}
      </p>
    </div>
    
    <h3 style="color: #495057; border-bottom: 2px solid #6e8efb; padding-bottom: 10px;">
      Ce que vous pouvez faire pendant votre essai :
    </h3>
    
    <ul>
      ${plan.features.filter(f => f.available).map(f => `<li>${f.text}</li>`).join('')}
      <li>Tester toutes les fonctionnalités premium</li>
      <li>Accéder à tous les tableaux de bord inclus</li>
      <li>Créer des rapports avancés</li>
    </ul>
    
    <div class="note">
      <p><strong>💡 Conseil :</strong> Pour tirer le meilleur parti de votre essai :</p>
      <ol>
        <li>Explorez toutes les fonctionnalités</li>
        <li>Configurez vos tableaux de bord</li>
        <li>Importez vos données</li>
        <li>N'hésitez pas à nous contacter pour des questions</li>
      </ol>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/dashboards" class="button">
        Commencer à explorer
      </a>
    </p>
    
    <p>Si vous avez des questions ou besoin d'aide, notre équipe est là pour vous aider. Répondez simplement à cet email ou contactez-nous via <a href="${process.env.CLIENT_URL}/contact" style="color: #6e8efb;">notre page de contact</a>.</p>
  `;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: `🎉 Votre essai gratuit du plan ${plan.name} a commencé !`,
    html: this.getBaseTemplate(name, content)
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Email de confirmation d'essai envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur envoi email confirmation essai:', error);
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
  // Ajoutez cette méthode à votre EmailService (dans le fichier EmailService.js)
// Dans EmailService.js, ajoutez cette nouvelle méthode
async sendContactEmail(userEmail, userName, subject, message) {
  // Récupérer tous les admins depuis la DB
  const adminUsers = await User.find({ role: 'admin' });
  const adminEmails = adminUsers.map(admin => admin.email);

  // Si aucun admin trouvé, utiliser une adresse de fallback depuis .env
  const recipientEmails = adminEmails.length > 0 ? adminEmails : [process.env.ADMIN_EMAIL || process.env.FROM_EMAIL];

  const content = `
    <p>Vous avez reçu un nouveau message de contact depuis le site ${process.env.APP_NAME || 'votre plateforme'} :</p>
    
    <div style="background: #f8f9fa; border-left: 4px solid #6e8efb; padding: 15px; margin: 20px 0;">
      <p><strong>De :</strong> ${userName} (${userEmail})</p>
      <p><strong>Sujet :</strong> ${subject}</p>
      <p><strong>Message :</strong></p>
      <p style="white-space: pre-line;">${message}</p>
    </div>
    
    <p>Vous pouvez répondre directement à cet email ou contacter l'utilisateur à l'adresse : ${userEmail}</p>
    
    <div class="note">
      <p><strong>Date d'envoi :</strong> ${new Date().toLocaleString('fr-FR')}</p>
    </div>
  `;

  // Email pour les admins
  const adminMailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Contact'} - ${userName}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: recipientEmails,
    subject: `[Contact] ${subject}`,
    html: this.getBaseTemplate('Administrateur', content),
    replyTo: userEmail
  };

  // Email de confirmation pour l'utilisateur
  const userContent = `
    <p>Merci pour votre message. Nous avons bien reçu votre demande et nous vous répondrons dans les plus brefs délais.</p>
    
    <div style="background: #f8f9fa; border-left: 4px solid #6e8efb; padding: 15px; margin: 20px 0;">
      <p><strong>Votre message :</strong></p>
      <p style="white-space: pre-line;">${message}</p>
    </div>
    
    <p>Cordialement,<br>L'équipe ${process.env.APP_NAME || ''}</p>
    
    <div class="note">
      <p><strong>Date d'envoi :</strong> ${new Date().toLocaleString('fr-FR')}</p>
      <p>Ceci est une confirmation automatique - merci de ne pas répondre à cet email.</p>
    </div>
  `;

  const userMailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: userEmail,
    subject: `Confirmation de votre message : ${subject}`,
    html: this.getBaseTemplate(userName, userContent)
  };

  try {
    // Envoyer les deux emails en parallèle
    await Promise.all([
      this.transporter.sendMail(adminMailOptions),
      this.transporter.sendMail(userMailOptions)
    ]);
    
    console.log(`Emails de contact envoyés pour ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Erreur envoi emails de contact:', error);
    throw new Error('Erreur lors de l\'envoi des emails de contact');
  }
}
async sendDashboardAssignmentEmail(email, name, dashboards) {
  // Construire la liste des dashboards assignés
  const dashboardList = dashboards.map(assignment => {
    const dashboard = assignment.dashboard;
    const expirationText = assignment.expiresAt 
      ? `<strong>Expire le :</strong> ${new Date(assignment.expiresAt).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`
      : '<strong>Accès permanent</strong>';
    
    return `
      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin: 10px 0;">
        <h4 style="color: #495057; margin: 0 0 10px 0;">${dashboard.name}</h4>
        <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">
          ${expirationText}
        </p>
      </div>
    `;
  }).join('');

  const content = `
    <p>Nous avons le plaisir de vous informer que ${dashboards.length > 1 ? 'de nouveaux tableaux de bord ont été assignés' : 'un nouveau tableau de bord a été assigné'} à votre compte.</p>
    
    <h3 style="color: #495057; border-bottom: 2px solid #6e8efb; padding-bottom: 10px;">
      ${dashboards.length > 1 ? 'Tableaux de bord assignés' : 'Tableau de bord assigné'} :
    </h3>
    
    ${dashboardList}
    
    <div class="note">
      <p><strong>Comment accéder à vos tableaux de bord :</strong></p>
      <ol>
        <li>Connectez-vous à votre compte sur notre plateforme</li>
        <li>Accédez à la section "Mes Dashboards"</li>
        <li>Cliquez sur le tableau de bord souhaité pour l'ouvrir</li>
      </ol>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/dashboards" class="button">Accéder à mes tableaux de bord</a>
    </p>
    
    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 12px; margin: 20px 0;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        <strong>⚠️ Important :</strong> Certains tableaux de bord peuvent avoir une date d'expiration. 
        Assurez-vous de consulter les informations d'accès ci-dessus.
      </p>
    </div>
    
    <p>Si vous rencontrez des difficultés pour accéder à vos tableaux de bord ou si vous avez des questions, 
    n'hésitez pas à <a href="${process.env.CLIENT_URL}/contact" style="color: #6e8efb;">nous contacter</a>.</p>
  `;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: `${dashboards.length > 1 ? 'Nouveaux tableaux de bord assignés' : 'Nouveau tableau de bord assigné'} - ${process.env.APP_NAME || 'Notre plateforme'}`,
    html: this.getBaseTemplate(name, content)
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Email d'assignation de dashboard envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur envoi email d\'assignation:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email d\'assignation');
  }
}
// Ajoutez ces méthodes à votre EmailService (dans le fichier EmailService.js)
// Email lorsque l'essai est sur le point d'expirer (3 jours avant)
async sendTrialExpiringSoonEmail(email, name, plan, endDate) {
  const formattedDate = endDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
    <div style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #856404; margin-top: 0;">⚠️ Votre essai gratuit se termine bientôt</h3>
      <p style="font-size: 16px; color: #856404;">
        Votre essai du plan <strong>${plan.name}</strong> expirera le ${formattedDate}
      </p>
    </div>
    
    <p>Nous souhaitons vous informer que votre période d'essai gratuit de 14 jours touche à sa fin.</p>
    
    <div style="background: #e7f5ff; border: 1px solid #d0ebff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1971c2; margin-top: 0;">Que se passe-t-il ensuite ?</h3>
      <p><strong>Après le ${formattedDate} :</strong></p>
      <ul>
        <li>Votre accès aux fonctionnalités premium sera suspendu</li>
        <li>Vos données seront conservées pendant 30 jours</li>
        <li>Vous pourrez souscrire à un abonnement à tout moment</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/pricing" class="button" style="background: #fd7e14 !important;">
        Souscrire à un abonnement
      </a>
    </p>
    
    <div class="note">
      <p><strong>Pour continuer à profiter de ${process.env.APP_NAME || 'notre plateforme'} :</strong></p>
      <ol>
        <li>Choisissez le plan qui correspond à vos besoins</li>
        <li>Configurez votre méthode de paiement</li>
        <li>Conservez l'accès à toutes vos données</li>
      </ol>
    </div>
    
    <p>Si vous avez des questions ou besoin d'aide, notre équipe est disponible pour vous conseiller.</p>
  `;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: `⚠️ Votre essai gratuit se termine bientôt - Plan ${plan.name}`,
    html: this.getBaseTemplate(name, content)
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Email d'expiration proche d'essai envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur envoi email expiration essai:', error);
  }
}

// Email lorsque l'essai a expiré
async sendTrialExpiredEmail(email, name, plan) {
  const content = `
    <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #721c24; margin-top: 0;">❌ Votre essai gratuit a expiré</h3>
      <p style="font-size: 16px; color: #721c24;">
        Votre accès au plan <strong>${plan.name}</strong> a été suspendu
      </p>
    </div>
    
    <p>Votre période d'essai gratuit de 14 jours est maintenant terminée. Nous espérons que vous avez pu découvrir toutes les fonctionnalités de notre plateforme.</p>
    
    <div style="background: #e7f5ff; border: 1px solid #d0ebff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1971c2; margin-top: 0;">Que faire maintenant ?</h3>
      <ul>
        <li><strong>Souscrivez à un abonnement</strong> pour retrouver l'accès à toutes les fonctionnalités</li>
        <li><strong>Exportez vos données</strong> si nécessaire (disponible pendant 30 jours)</li>
        <li><strong>Contactez-nous</strong> si vous avez des questions</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/pricing" class="button">
        Choisir un abonnement
      </a>
    </p>
    
    <div class="note">
      <p><strong>Vos données sont en sécurité :</strong></p>
      <p>Nous conservons toutes vos données pendant 30 jours après l'expiration de votre essai. 
      Vous pourrez y accéder immédiatement si vous souscrivez à un abonnement.</p>
    </div>
  `;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: `❌ Votre essai gratuit a expiré - Plan ${plan.name}`,
    html: this.getBaseTemplate(name, content)
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Email d'expiration d'essai envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur envoi email expiration essai:', error);
  }
}

// Email aux admins lorsqu'un essai expire
async sendAdminTrialExpiredNotification(adminEmail, adminName, user, plan) {
  const content = `
    <p>L'essai d'un utilisateur vient d'expirer :</p>
    
    <div style="background: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
      <p><strong>Utilisateur :</strong> ${user.name} (${user.email})</p>
      <p><strong>Plan :</strong> ${plan.name}</p>
      <p><strong>Date d'expiration :</strong> ${new Date().toLocaleString('fr-FR')}</p>
    </div>
    
    <h3 style="color: #495057; border-bottom: 2px solid #6e8efb; padding-bottom: 10px;">
      Actions recommandées :
    </h3>
    
    <ul>
      <li>Vérifier si l'utilisateur a souscrit à un abonnement</li>
      <li>Envoyer un email de suivi si nécessaire</li>
      <li>Consulter l'activité de l'utilisateur pendant l'essai</li>
    </ul>
    
    <p style="text-align: center;">
      <a href="${process.env.ADMIN_URL || process.env.CLIENT_URL}/admin/users/${user._id}" class="button">
        Voir le profil utilisateur
      </a>
    </p>
    
    <div class="note">
      <p><strong>Statistiques :</strong></p>
      <p>Cet utilisateur a utilisé ${plan.name} pendant 14 jours. Vous pouvez consulter son activité pour évaluer son engagement.</p>
    </div>
  `;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `[Expiration essai] ${user.name} - Plan ${plan.name}`,
    html: this.getBaseTemplate(adminName, content)
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Notification d'expiration d'essai envoyée à l'admin ${adminEmail}`);
  } catch (error) {
    console.error('Erreur envoi email notification admin:', error);
  }
}

// Email lorsque l'abonnement est annulé
async sendSubscriptionCancelledEmail(email, name, plan, endDate) {
  const formattedDate = endDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
    <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #495057; margin-top: 0;">Votre abonnement a été annulé</h3>
      <p style="font-size: 16px; color: #495057;">
        Votre accès au plan <strong>${plan.name}</strong> sera maintenu jusqu'au ${formattedDate}
      </p>
    </div>
    
    <p>Nous confirmons que votre abonnement a bien été annulé comme demandé.</p>
    
    <div style="background: #e7f5ff; border: 1px solid #d0ebff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1971c2; margin-top: 0;">Ce que cela signifie :</h3>
      <ul>
        <li>Votre accès actuel reste actif jusqu'au ${formattedDate}</li>
        <li>Aucun paiement supplémentaire ne sera prélevé</li>
        <li>Vos données seront conservées pendant 30 jours après l'expiration</li>
      </ul>
    </div>
    
    <div class="note">
      <p><strong>Pour réactiver votre abonnement :</strong></p>
      <p>Vous pouvez souscrire à nouveau à tout moment avant le ${formattedDate} sans perdre vos données ou configurations.</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/pricing" class="button">
        Souscrire à nouveau
      </a>
    </p>
    
    <p>Si vous avez des questions ou si cette annulation est une erreur, veuillez nous contacter immédiatement.</p>
  `;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: `Votre abonnement a été annulé - Plan ${plan.name}`,
    html: this.getBaseTemplate(name, content)
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Email d'annulation envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur envoi email annulation:', error);
  }
}
async sendAdminErrorNotification(adminEmail, adminName, errorType, errorDetails, userId) {
  const adminPortalLink = `${process.env.ADMIN_URL}/users/${userId}`;
  
  const content = `
    <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #721c24; margin-top: 0;">⚠️ ERREUR SYSTÈME: ${errorType}</h3>
    </div>
    
    <p>Une erreur s'est produite dans le système :</p>
    
    <div style="background: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
      <p><strong>Type d'erreur :</strong> ${errorType}</p>
      <p><strong>Détails :</strong></p>
      <pre style="background: #e9ecef; padding: 10px; border-radius: 5px; overflow-x: auto;">${errorDetails}</pre>
    </div>
    
    <div class="note">
      <p><strong>Actions recommandées :</strong></p>
      <ol>
        <li>Vérifier les logs système pour plus de détails</li>
        <li>Contacter l'équipe technique si nécessaire</li>
        <li>Suivre le statut de l'utilisateur concerné</li>
      </ol>
    </div>
    
    <p style="text-align: center;">
      <a href="${adminPortalLink}" class="button">Voir le profil utilisateur</a>
    </p>
    
    <p>Ceci est une notification automatique. Veuillez ne pas répondre à cet email.</p>
  `;
  
  const mailOptions = {
    from: `"${process.env.APP_NAME || 'System'} - Alerte Erreur" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `[ERREUR] ${errorType} - ${process.env.APP_NAME || 'Système'}`,
    html: this.getBaseTemplate(adminName, content),
    priority: 'high'
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Notification d'erreur envoyée à l'admin ${adminEmail}`);
  } catch (error) {
    console.error('Erreur envoi email notification admin:', error);
  }
}
// Email aux admins lorsqu'un abonnement est annulé
async sendAdminSubscriptionCancelledNotification(adminEmail, adminName, user, plan) {
  const content = `
    <p>Un utilisateur a annulé son abonnement :</p>
    
    <div style="background: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
      <p><strong>Utilisateur :</strong> ${user.name} (${user.email})</p>
      <p><strong>Plan :</strong> ${plan.name}</p>
      <p><strong>Date d'annulation :</strong> ${new Date().toLocaleString('fr-FR')}</p>
      <p><strong>Accès valide jusqu'au :</strong> ${new Date(plan.currentPeriodEnd).toLocaleDateString('fr-FR')}</p>
    </div>
    
    <h3 style="color: #495057; border-bottom: 2px solid #6e8efb; padding-bottom: 10px;">
      Informations complémentaires :
    </h3>
    
    <ul>
      <li><strong>Durée de l'abonnement :</strong> ${Math.round((new Date() - new Date(plan.createdAt)) / (1000 * 60 * 60 * 24))} jours</li>
      <li><strong>Dernière activité :</strong> ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Inconnue'}</li>
    </ul>
    
    <p style="text-align: center;">
      <a href="${process.env.ADMIN_URL || process.env.CLIENT_URL}/admin/users/${user._id}" class="button">
        Voir le profil utilisateur
      </a>
    </p>
    
    <div class="note">
      <p><strong>Actions recommandées :</strong></p>
      <ol>
        <li>Analyser les raisons de la désabonnement</li>
        <li>Envoyer un email de suivi si approprié</li>
        <li>Proposer une offre de fidélisation si disponible</li>
      </ol>
    </div>
  `;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `[Annulation] ${user.name} - Plan ${plan.name}`,
    html: this.getBaseTemplate(adminName, content)
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Notification d'annulation envoyée à l'admin ${adminEmail}`);
  } catch (error) {
    console.error('Erreur envoi email notification admin:', error);
  }
}
// Email de rappel avant expiration (7 jours avant)
async sendDashboardExpirationReminderEmail(email, name, dashboards) {
  const dashboardList = dashboards.map(dashboard => {
    const expirationDate = new Date(dashboard.expiresAt);
    const daysLeft = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24));
    
    return `
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 10px 0;">
        <h4 style="color: #856404; margin: 0 0 10px 0;">📊 ${dashboard.name}</h4>
        <p style="margin: 5px 0; color: #856404; font-size: 14px;">
          <strong>Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong> - ${expirationDate.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      
      </div>
    `;
  }).join('');

  const content = `
    <p>Nous souhaitons vous informer que ${dashboards.length > 1 ? 'certains de vos tableaux de bord' : 'l\'un de vos tableaux de bord'} 
    ${dashboards.length > 1 ? 'vont expirer' : 'va expirer'} prochainement.</p>
    
    <h3 style="color: #856404; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">
      ⚠️ ${dashboards.length > 1 ? 'Tableaux de bord à expirer' : 'Tableau de bord à expirer'} :
    </h3>
    
    ${dashboardList}
    
    <div class="note">
      <p><strong>🚀 Actions recommandées :</strong></p>
      <ul>
        <li>Utilisez ${dashboards.length > 1 ? 'ces tableaux de bord' : 'ce tableau de bord'} avant la date d'expiration</li>
        <li>Sauvegardez ou exportez les données importantes si nécessaire</li>
        <li>Contactez votre administrateur si vous avez besoin d'une extension d'accès</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/dashboards" class="button">Accéder à mes tableaux de bord</a>
    </p>
    
    <p>Si vous avez des questions ou si vous souhaitez prolonger l'accès à ${dashboards.length > 1 ? 'ces tableaux de bord' : 'ce tableau de bord'}, 
    n'hésitez pas à <a href="${process.env.CLIENT_URL}/contact" style="color: #6e8efb;">contacter notre équipe</a>.</p>
  `;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: `⚠️ Rappel d'expiration - ${dashboards.length > 1 ? 'Vos tableaux de bord' : 'Votre tableau de bord'} - ${process.env.APP_NAME || 'Plateforme'}`,
    html: this.getBaseTemplate(name, content)
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Email de rappel d'expiration envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur envoi email de rappel:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email de rappel');
  }
}
// Email de dernière alerte (24h avant expiration)
async sendDashboardExpirationUrgentEmail(email, name, dashboards) {
  const dashboardList = dashboards.map(dashboard => {
    const expirationDate = new Date(dashboard.expiresAt);
    const hoursLeft = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60));
    
    return `
      <div style="background: #f8d7da; border: 1px solid #f1aeb5; border-radius: 6px; padding: 15px; margin: 10px 0;">
        <h4 style="color: #721c24; margin: 0 0 10px 0;">🚨 ${dashboard.name}</h4>
        <p style="margin: 5px 0; color: #721c24; font-size: 14px; font-weight: bold;">
          Expire dans ${hoursLeft < 24 ? `${hoursLeft} heure${hoursLeft > 1 ? 's' : ''}` : '24 heures'} !
        </p>
        <p style="margin: 5px 0; color: #721c24; font-size: 14px;">
          Expiration : ${expirationDate.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        <p style="margin: 5px 0;">
          <a href="${dashboard.url}" style="color: #6e8efb; text-decoration: none; font-weight: bold;">🔗 Accéder maintenant</a>
        </p>
      </div>
    `;
  }).join('');

  const content = `
    <div style="background: #f8d7da; border: 1px solid #f1aeb5; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #721c24; margin: 0;">🚨 ALERTE D'EXPIRATION IMMINENTE</h3>
    </div>
    
    <p><strong>Attention !</strong> ${dashboards.length > 1 ? 'Certains de vos tableaux de bord' : 'L\'un de vos tableaux de bord'} 
    ${dashboards.length > 1 ? 'vont expirer' : 'va expirer'} dans les prochaines 24 heures.</p>
    
    <h3 style="color: #721c24; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
      🚨 ${dashboards.length > 1 ? 'Tableaux de bord à expirer' : 'Tableau de bord à expirer'} :
    </h3>
    
    ${dashboardList}
    
    <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0;">⏰ Actions urgentes :</h4>
      <ul style="color: #0c5460; margin: 0;">
        <li><strong>Accédez immédiatement</strong> aux tableaux de bord pour consulter vos données</li>
        <li><strong>Exportez ou sauvegardez</strong> toutes les informations importantes</li>
        <li><strong>Contactez votre administrateur</strong> si vous avez besoin d'une prolongation</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/dashboards" class="button" style="background: #dc3545 !important;">
        🚀 Accéder d'urgence à mes tableaux de bord
      </a>
    </p>
    
    <p style="color: #721c24; font-weight: bold; text-align: center;">
      Après expiration, vous perdrez l'accès à ${dashboards.length > 1 ? 'ces tableaux de bord' : 'ce tableau de bord'}.
    </p>
  `;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: `🚨 URGENT - Expiration imminente - ${dashboards.length > 1 ? 'Vos tableaux de bord' : 'Votre tableau de bord'} - ${process.env.APP_NAME || 'Plateforme'}`,
    html: this.getBaseTemplate(name, content)
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Email d'alerte urgente d'expiration envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur envoi email d\'alerte urgente:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email d\'alerte urgente');
  }
}

// Email post-expiration (notification que l'accès a expiré)
async sendDashboardExpiredEmail(email, name, dashboards) {
  const dashboardList = dashboards.map(dashboard => {
    const expirationDate = new Date(dashboard.expiresAt);
    
    return `
      <div style="background: #f5f5f5; border: 1px solid #dee2e6; border-radius: 6px; padding: 15px; margin: 10px 0;">
        <h4 style="color: #6c757d; margin: 0 0 10px 0;">📊 ${dashboard.name}</h4>
        <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">
          <strong>Expiré le :</strong> ${expirationDate.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    `;
  }).join('');

  const content = `
    <div style="background: #f5f5f5; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #6c757d; margin: 0;">📋 Accès expiré</h3>
    </div>
    
    <p>Nous vous informons que l'accès à ${dashboards.length > 1 ? 'certains de vos tableaux de bord a' : 'l\'un de vos tableaux de bord a'} expiré.</p>
    
    <h3 style="color: #6c757d; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">
      📊 ${dashboards.length > 1 ? 'Tableaux de bord expirés' : 'Tableau de bord expiré'} :
    </h3>
    
    ${dashboardList}
    
    <div class="note">
      <p><strong>💡 Pour retrouver l'accès :</strong></p>
      <ul>
        <li>Contactez votre administrateur pour demander une prolongation</li>
        <li>Vérifiez si de nouveaux accès vous ont été accordés</li>
        <li>Consultez vos autres tableaux de bord disponibles</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/dashboards" class="button">Voir mes tableaux de bord actifs</a>
    </p>
    
    <p>Si vous avez besoin de récupérer l'accès à ${dashboards.length > 1 ? 'ces tableaux de bord' : 'ce tableau de bord'}, 
    veuillez <a href="${process.env.CLIENT_URL}/contact" style="color: #6e8efb;">contacter votre administrateur</a>.</p>
  `;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Équipe'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: `📋 Accès expiré - ${dashboards.length > 1 ? 'Vos tableaux de bord' : 'Votre tableau de bord'} - ${process.env.APP_NAME || 'Plateforme'}`,
    html: this.getBaseTemplate(name, content)
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Email de notification d'expiration envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur envoi email de notification d\'expiration:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email de notification d\'expiration');
  }
}
}

module.exports = new EmailService();