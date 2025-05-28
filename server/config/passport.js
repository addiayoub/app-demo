const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Sérialisation/Désérialisation de l'utilisateur
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Stratégie locale (email/mot de passe)
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    // Chercher l'utilisateur par email
    const user = await User.findOne({ email });
    
    if (!user) {
      return done(null, false, { message: 'Email non trouvé' });
    }

    // Vérifier si l'utilisateur utilise Google OAuth
    if (user.authMethod === 'google') {
      return done(null, false, { 
        message: 'Ce compte utilise Google. Veuillez vous connecter avec Google.' 
      });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return done(null, false, { message: 'Mot de passe incorrect' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Stratégie Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Chercher un utilisateur existant avec cet Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }

    // Chercher un utilisateur avec le même email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Lier le compte Google au compte existant
      user.googleId = profile.id;
      user.authMethod = 'google';
      user.avatar = profile.photos[0].value;
      await user.save();
      return done(null, user);
    }

    // Créer un nouveau utilisateur
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      avatar: profile.photos[0].value,
      authMethod: 'google'
    });

    await user.save();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));