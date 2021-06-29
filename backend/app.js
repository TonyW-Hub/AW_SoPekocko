const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();
const session = require('express-session');
const mongoSanitize = require('express-mongo-sanitize');
const fs = require('fs');
const morgan = require('morgan');
const nocache = require('nocache');

const sauceRoutes = require('./routes/sauce');
const userRoutes = require('./routes/user');

// Connexion sur la base de données MongoDB
mongoose.connect(process.env.MONGO_URI,
{ useNewUrlParser: true,
    useUnifiedTopology: true })
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();

// Configuration CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.ORIGINE);
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

// Parse les requêtes du body en format json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Sécurise les Headers
app.use(helmet());

// Désactive la mise en cache du navigateur
app.use(nocache());

// Sécurise les injections de charactère inapproprié
app.use(mongoSanitize({
    replaceWith: '_',
}));

// Enregistre toutes les demandes faites au serveur au format Apache dans le fichier access.log
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }))

// Sécurise les cookies de la session
app.set('trust proxy', 1)
app.use(session({
    secret: process.env.COOKIE_SESSION,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30000,
        secure: true
    }
}))

// Routes
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/sauces', sauceRoutes);
app.use('/api/auth', userRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send("Something went wrong.")
});

module.exports = app;