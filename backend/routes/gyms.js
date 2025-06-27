const express = require('express');
const router = express.Router();
const { Gym } = require('../models/TSness');

// Récupérer toutes les salles
router.get('/', async (req, res) => {
    try {
        const gyms = await Gym.find();
        res.json(gyms);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Créer une nouvelle salle
router.post('/', async (req, res) => {
    try {
        const gym = new Gym(req.body);
        await gym.save();
        res.status(201).json(gym);
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Modifier une salle
router.put('/:id', async (req, res) => {
    try {
        const gym = await Gym.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!gym) return res.status(404).json({ erreur: 'Salle non trouvée' });
        res.json(gym);
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Supprimer une salle
router.delete('/:id', async (req, res) => {
    try {
        const gym = await Gym.findByIdAndDelete(req.params.id);
        if (!gym) return res.status(404).json({ erreur: 'Salle non trouvée' });
        res.json({ message: 'Salle supprimée' });
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Approuver une salle
router.patch('/:id/approve', async (req, res) => {
    try {
        const gym = await Gym.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
        if (!gym) return res.status(404).json({ erreur: 'Salle non trouvée' });
        res.json(gym);
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Associer un type d'exercice, une difficulté ou un responsable à une salle
router.patch('/:id/assign', async (req, res) => {
    try {
        let update = {};
        // Support $unset pour suppression de champ (si envoyé par le front)
        if (req.body.$unset) {
            update.$unset = req.body.$unset;
        }
        if (req.body.exerciseTypeId) update.exerciseTypeId = req.body.exerciseTypeId;
        if (req.body.difficulty) update.difficulty = req.body.difficulty;
        if (req.body.ownerId) update.ownerId = req.body.ownerId;
        // Si $unset existe, utiliser la syntaxe MongoDB update operators
        const gym = await Gym.findByIdAndUpdate(
            req.params.id,
            Object.keys(update).length ? update : { $set: update },
            { new: true }
        );
        if (!gym) return res.status(404).json({ erreur: 'Salle non trouvée' });
        res.json(gym);
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Récupérer toutes les salles du propriétaire connecté
router.get('/owner', async (req, res) => {
    try {
        const ownerId = req.query.id;
        if (!ownerId) return res.status(400).json({ erreur: 'ID propriétaire manquant' });
        const gyms = await Gym.find({ ownerId });
        res.json(gyms); // Retourne un tableau (vide si aucune salle)
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Modifier une salle spécifique du propriétaire connecté
router.put('/owner/:gymId', async (req, res) => {
    try {
        const ownerId = req.body.ownerId;
        const gymId = req.params.gymId;
        if (!ownerId) return res.status(400).json({ erreur: 'ID propriétaire manquant' });
        if (!gymId) return res.status(400).json({ erreur: 'ID salle manquant' });
        
        // Vérifier que la salle appartient bien au propriétaire
        const gym = await Gym.findOneAndUpdate(
            { _id: gymId, ownerId },
            req.body,
            { new: true }
        );
        if (!gym) return res.status(404).json({ erreur: 'Aucune salle trouvée pour ce propriétaire avec cet ID' });
        res.json(gym);
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Créer une nouvelle salle pour le propriétaire connecté
router.post('/owner', async (req, res) => {
    try {
        const ownerId = req.body.ownerId;
        if (!ownerId) return res.status(400).json({ erreur: 'ID propriétaire manquant' });
        
        // Vérifier le nombre de salles existantes pour ce propriétaire
        const existingGymsCount = await Gym.countDocuments({ ownerId });
        if (existingGymsCount >= 4) {
            return res.status(400).json({ 
                erreur: 'Limite atteinte : un propriétaire ne peut pas avoir plus de 4 salles de sport' 
            });
        }
        
        const gym = new Gym(req.body);
        await gym.save();
        res.status(201).json(gym);
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Supprimer une salle spécifique du propriétaire connecté
router.delete('/owner/:gymId', async (req, res) => {
    try {
        const ownerId = req.body.ownerId;
        const gymId = req.params.gymId;
        if (!ownerId) return res.status(400).json({ erreur: 'ID propriétaire manquant' });
        if (!gymId) return res.status(400).json({ erreur: 'ID salle manquant' });
        
        // Vérifier que la salle appartient bien au propriétaire avant de la supprimer
        const gym = await Gym.findOneAndDelete({ _id: gymId, ownerId });
        if (!gym) return res.status(404).json({ erreur: 'Aucune salle trouvée pour ce propriétaire avec cet ID' });
        
        res.json({ message: `Salle "${gym.name}" supprimée avec succès` });
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

module.exports = router;
