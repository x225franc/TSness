const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User } = require('../models/TSness');

// Inscription d'un nouvel utilisateur
router.post('/register', async (req, res) => {
    try {
        const { firstname, lastname, email, password, role } = req.body;
        if (!firstname || !lastname || !email || !password) {
            return res.status(400).json({ erreur: 'Tous les champs sont obligatoires.' });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ erreur: 'Cet email est déjà utilisé.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            role: role || 'client',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            challenges_created: [],
            challenges_joined: [],
            friends: [],
            badges: [],
            score: 0
        });
        await user.save();
        res.status(201).json({ message: 'Inscription réussie.' });
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Connexion utilisateur
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ erreur: 'Email et mot de passe requis.' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ erreur: 'Utilisateur introuvable.' });
        }
        
        // Vérifier si le compte est actif
        if (!user.isActive) {
            return res.status(403).json({ erreur: 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.' });
        }
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ erreur: 'Mot de passe incorrect.' });
        }
        // Générer un token JWT
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
        res.json({ token, user: { id: user._id, firstname: user.firstname, lastname: user.lastname, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// route pour recuperer tout les propriétaires (owners)
router.get('/owners', async (req, res) => {
    try {
        const owners = await User.find({ role: 'owner' }, '_id firstname lastname email');
        res.json(owners);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

module.exports = router;
