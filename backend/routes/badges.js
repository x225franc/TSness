const express = require('express');
const router = express.Router();
const { Badge } = require('../models/TSness');

// Récupérer tous les badges
router.get('/', async (req, res) => {
    try {
        const badges = await Badge.find();
        res.json(badges);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Créer un nouveau badge
router.post('/', async (req, res) => {
    try {
        const badge = new Badge({
            name: req.body.name,
            description: req.body.description,
            image: req.body.image || '',
            rule: {
                type: req.body.rule.type,
                value: req.body.rule.value,
                details: req.body.rule.details || ''
            }
        });
        await badge.save();
        res.status(201).json(badge);
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Modifier un badge
router.put('/:id', async (req, res) => {
    try {
        const badge = await Badge.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!badge) return res.status(404).json({ erreur: 'Badge non trouvé' });
        res.json(badge);
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Supprimer un badge
router.delete('/:id', async (req, res) => {
    try {
        const badge = await Badge.findByIdAndDelete(req.params.id);
        if (!badge) return res.status(404).json({ erreur: 'Badge non trouvé' });
        res.json({ message: 'Badge supprimé avec succès' });
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

module.exports = router;
