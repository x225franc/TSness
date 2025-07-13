import express from 'express';
import { ExerciseType } from '../models/TSness.js';

const router = express.Router();

// Liste
router.get('/', async (req, res) => {
    try {
        const types = await ExerciseType.find({}, '_id name description targetedMuscles');
        res.json(types);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});
// Création
router.post('/', async (req, res) => {
    try {
        const type = new ExerciseType({ name: req.body.name, description: req.body.description || '', targetedMuscles: req.body.targetedMuscles || [] });
        await type.save();
        res.status(201).json(type);
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});
// Modification
router.put('/:id', async (req, res) => {
    try {
        const type = await ExerciseType.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!type) return res.status(404).json({ erreur: 'Type non trouvé' });
        res.json(type);
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});
// Suppression
router.delete('/:id', async (req, res) => {
    try {
        const type = await ExerciseType.findByIdAndDelete(req.params.id);
        if (!type) return res.status(404).json({ erreur: 'Type non trouvé' });
        res.json({ message: 'Type supprimé' });
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

export default router;
