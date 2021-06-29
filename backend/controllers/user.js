const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cryptoJs = require('crypto-js');

const User = require('../models/User');

// Inscription utilisateur (sécurisé)
exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: cryptoJs.HmacSHA256(req.body.email, process.env.EMAIL).toString(),
                password: hash
            })

            user.save()
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }));

        })
        .catch(error => res.status(500).json({ error }));
};

// Connexion au compte de l'utilisateur (sécurisé)
exports.login = (req, res, next) => {
  const findcryptedEmail = cryptoJs.HmacSHA256(req.body.email, process.env.EMAIL).toString();
    User.findOne({ email: findcryptedEmail })
      .then(user => {
        if (!user) {
          return res.status(404).json({ error: 'Utilisateur non trouvé !' });
        }
        bcrypt.compare(req.body.password, user.password)
          .then(valid => {
            if (!valid) {
              return res.status(401).json({ error: 'Mot de passe incorrect !' });
            }
            res.status(200).json({
              userId: user._id,
              token: jwt.sign(
                  { userId: user.id },
                  process.env.TOKEN,
                  { expiresIn: '24h' }
              )
            });
          })
          .catch(error => res.status(500).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
};