import express from 'express';
import { BadgeModel } from '../services/mongoose/services';

const router = express.Router();

// Récupérer tous les badges
router.get('/', async (req, res) => {
    try {
        const badges = await BadgeModel.find();
        res.json(badges);
    } catch (err) {
        res.status(500).json({ erreur: (err as Error).message });
    }
});

// Créer un nouveau badge
router.post('/', async (req, res) => {
    try {
        const badge = new BadgeModel({
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
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Modifier un badge
router.put('/:id', async (req, res) => {
    try {
        const badge = await BadgeModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!badge) return res.status(404).json({ erreur: 'BadgeModel non trouvé' });
        res.json(badge);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Supprimer un badge
router.delete('/:id', async (req, res) => {
    try {
        const badge = await BadgeModel.findByIdAndDelete(req.params.id);
        if (!badge) return res.status(404).json({ erreur: 'BadgeModel non trouvé' });
        res.json({ message: 'BadgeModel supprimé avec succès' });
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

export default router;
