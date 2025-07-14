import express from 'express';
import { ExerciseTypeModel } from '../services/mongoose/services';

const router = express.Router();

// Récupérer toutes les types d'exercices
router.get('/', async (req, res) => {
    try {
        const types = await ExerciseTypeModel.find({}, '_id name description targetedMuscles');
        res.json(types);
    } catch (err) {
        res.status(500).json({ erreur: (err as Error).message });
    }
});

// Créer un nouveau type d'exercice
router.post('/', async (req, res) => {
    try {
        const type = new ExerciseTypeModel({ name: req.body.name, description: req.body.description || '', targetedMuscles: req.body.targetedMuscles || [] });
        await type.save();
        res.status(201).json(type);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Modifier un type d'exercice
router.put('/:id', async (req, res) => {
    try {
        const type = await ExerciseTypeModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!type) return res.status(404).json({ erreur: 'Type non trouvé' });
        res.json(type);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Supprimer un type d'exercice
router.delete('/:id', async (req, res) => {
    try {
        const type = await ExerciseTypeModel.findByIdAndDelete(req.params.id);
        if (!type) return res.status(404).json({ erreur: 'Type non trouvé' });
        res.json({ message: 'Type supprimé' });
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

export default router;
