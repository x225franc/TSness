import express from 'express';
import { GymModel } from '../services/mongoose/services';

const router = express.Router();

// Récupérer toutes les salles
router.get('/', async (req, res) => {
    try {
        const gyms = await GymModel.find();
        res.json(gyms);
    } catch (err) {
        res.status(500).json({ erreur: (err as Error).message });
    }
});

// Créer une nouvelle salle
router.post('/', async (req, res) => {
    try {
        const gym = new GymModel(req.body);
        await gym.save();
        res.status(201).json(gym);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Modifier une salle
router.put('/:id', async (req, res) => {
    try {
        const gym = await GymModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!gym) return res.status(404).json({ erreur: 'Salle non trouvée' });
        res.json(gym);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Supprimer une salle
router.delete('/:id', async (req, res) => {
    try {
        const gym = await GymModel.findByIdAndDelete(req.params.id);
        if (!gym) return res.status(404).json({ erreur: 'Salle non trouvée' });
        res.json({ message: 'Salle supprimée' });
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Approuver une salle
router.patch('/:id/approve', async (req, res) => {
    try {
        const gym = await GymModel.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
        if (!gym) return res.status(404).json({ erreur: 'Salle non trouvée' });
        res.json(gym);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Associer un type d'exercice, une difficulté ou un responsable à une salle
router.patch('/:id/assign', async (req, res) => {
    try {
        const update = req.body.$unset
            // Support $unset pour suppression de champ (si envoyé par le front)
        ? { $unset: req.body.$unset }
        : {
            ...(req.body.hasOwnProperty('exerciseTypeId') && { exerciseTypeId: req.body.exerciseTypeId }),
            ...(req.body.hasOwnProperty('difficulty') && { difficulty: req.body.difficulty }),
            ...(req.body.hasOwnProperty('ownerId') && { ownerId: req.body.ownerId }),
        };
        // Si $unset existe, utiliser la syntaxe MongoDB update operators
        const gym = await GymModel.findByIdAndUpdate(
            req.params.id,
            Object.keys(update).length ? update : { $set: update },
            { new: true }
        );
        if (!gym) return res.status(404).json({ erreur: 'Salle non trouvée' });
        res.json(gym);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Récupérer toutes les salles du propriétaire connecté
router.get('/owner', async (req, res) => {
    try {
        const ownerId = req.query['owner_id'];
        if (!ownerId) return res.status(400).json({ erreur: 'ID propriétaire manquant' });
        const gyms = await GymModel.find({ ownerId });
        res.json(gyms); // Retourne un tableau (vide si aucune salle)
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Modifier une salle spécifique du propriétaire connecté
router.put('/owner/:gymId', async (req, res) => {
    try {
        const ownerId = req.query['owner_id'];
        const gymId = req.params.gymId;
        if (!ownerId) return res.status(400).json({ erreur: 'ID propriétaire manquant' });
        if (!gymId) return res.status(400).json({ erreur: 'ID salle manquant' });

        // Vérifier que la salle appartient bien au propriétaire
        const gym = await GymModel.findOneAndUpdate(
            { _id: gymId, ownerId },
            req.body,
            { new: true }
        );
        if (!gym) return res.status(404).json({ erreur: 'Aucune salle trouvée pour ce propriétaire avec cet ID' });
        res.json(gym);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Créer une nouvelle salle pour le propriétaire connecté
router.post('/owner', async (req, res) => {
    try {
        const ownerId = req.query['owner_id'];
        if (!ownerId) return res.status(400).json({ erreur: 'ID propriétaire manquant' });

        // Vérifier le nombre de salles existantes pour ce propriétaire
        const existingGymsCount = await GymModel.countDocuments({ ownerId });
        if (existingGymsCount >= 4) {
            return res.status(400).json({
                erreur: 'Limite atteinte : un propriétaire ne peut pas avoir plus de 4 salles de sport'
            });
        }

        const gym = new GymModel({
            ...req.body,
            ownerId
        });

        await gym.save();
        res.status(201).json(gym);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Supprimer une salle spécifique du propriétaire connecté
router.delete('/owner/:gymId', async (req, res) => {
    try {
        const ownerId = req.query['owner_id'];
        const gymId = req.params.gymId;
        if (!ownerId) return res.status(400).json({ erreur: 'ID propriétaire manquant' });
        if (!gymId) return res.status(400).json({ erreur: 'ID salle manquant' });

        // Vérifier que la salle appartient bien au propriétaire avant de la supprimer
        const gym = await GymModel.findOneAndDelete({ _id: gymId, ownerId });
        if (!gym) return res.status(404).json({ erreur: 'Aucune salle trouvée pour ce propriétaire avec cet ID' });

        res.json({ message: `Salle '${gym.name}' supprimée avec succès` });
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

export default router;
