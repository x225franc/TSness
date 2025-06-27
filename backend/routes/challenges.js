const express = require('express');
const router = express.Router();
const { Challenge, Gym, ExerciseType } = require('../models/TSness');

// Fonction pour calculer automatiquement la durée entre deux dates
function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMilliseconds = end - start;
    const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));

    if (diffInDays <= 0) return "Durée invalide";
    if (diffInDays === 1) return "1 jour";
    if (diffInDays < 7) return `${diffInDays} jours`;
    if (diffInDays < 30) {
        const weeks = Math.round(diffInDays / 7);
        return weeks === 1 ? "1 semaine" : `${weeks} semaines`;
    }
    if (diffInDays < 365) {
        const months = Math.round(diffInDays / 30);
        return months === 1 ? "1 mois" : `${months} mois`;
    }
    const years = Math.round(diffInDays / 365);
    return years === 1 ? "1 an" : `${years} ans`;
}

// Récupérer tous les défis
router.get('/', async (req, res) => {
    try {
        const challenges = await Challenge.find()
            .populate('gymIds', 'name')
            .populate('exerciseTypeId', 'name')
            .populate('createdBy', 'firstname lastname');
        res.json(challenges);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Récupérer les défis d'un propriétaire spécifique (via ses salles)
router.get('/owner', async (req, res) => {
    try {
        const ownerId = req.query.ownerId;
        if (!ownerId) return res.status(400).json({ erreur: 'ID du propriétaire requis' });

        // Récupérer toutes les salles du propriétaire
        const ownerGyms = await Gym.find({ ownerId }, '_id');
        const gymIds = ownerGyms.map(gym => gym._id);

        // Récupérer tous les défis liés aux salles du propriétaire
        const challenges = await Challenge.find({
            gymIds: { $in: gymIds }
        })
            .populate('gymIds', 'name address')
            .populate('exerciseTypeId', 'name description targetedMuscles')
            .sort({ createdAt: -1 });

        res.json(challenges);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Créer un nouveau défi pour des salles spécifiques
router.post('/owner', async (req, res) => {
    try {
        const {
            title,
            description,
            gymIds,
            exerciseTypeId,
            difficulty,
            startDate,
            endDate,
            objectives,
            ownerId
        } = req.body;

        if (!title || !description || !gymIds || !Array.isArray(gymIds) || gymIds.length === 0 || !ownerId || !startDate || !endDate) {
            return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
        }

        // Vérifier que toutes les salles appartiennent bien au propriétaire
        const gyms = await Gym.find({ _id: { $in: gymIds }, ownerId });
        if (gyms.length !== gymIds.length) {
            return res.status(403).json({ erreur: 'Une ou plusieurs salles ne vous appartiennent pas' });
        }

        // Vérifier que toutes les salles sont approuvées
        const unapprovedGyms = gyms.filter(gym => !gym.isApproved);
        if (unapprovedGyms.length > 0) {
            return res.status(400).json({
                erreur: `Impossible de créer un défi pour des salles non approuvées: ${unapprovedGyms.map(g => g.name).join(', ')}`
            });
        }

        // Calculer automatiquement la durée8
        const calculatedDuration = calculateDuration(startDate, endDate);

        const challenge = new Challenge({
            title,
            description,
            gymIds,
            exerciseTypeId: exerciseTypeId || null,
            difficulty,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            duration: calculatedDuration,
            objectives: objectives || [],
            createdBy: ownerId,
            createdAt: new Date()
        });

        await challenge.save();

        // Retourner le défi avec les informations des salles
        const savedChallenge = await Challenge.findById(challenge._id)
            .populate('gymIds', 'name')
            .populate('exerciseTypeId', 'name description targetedMuscles');

        res.status(201).json(savedChallenge);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Modifier un défi existant (uniquement par le propriétaire de la salle)
router.put('/owner/:challengeId', async (req, res) => {
    try {
        const { challengeId } = req.params;
        const { ownerId } = req.body;

        if (!ownerId) {
            return res.status(400).json({ erreur: 'ID du propriétaire requis' });
        }

        // Récupérer le défi et vérifier les permissions
        const challenge = await Challenge.findById(challengeId).populate('gymIds');
        if (!challenge) {
            return res.status(404).json({ erreur: 'Défi non trouvé' });
        }

        // Vérifier que toutes les salles appartiennent au propriétaire
        const ownerGyms = await Gym.find({ ownerId, _id: { $in: challenge.gymIds } });
        if (ownerGyms.length !== challenge.gymIds.length) {
            return res.status(403).json({ erreur: 'Vous n\'êtes pas autorisé à modifier ce défi' });
        }

        // Préparer les données de mise à jour
        const updateData = {
            title: req.body.title || challenge.title,
            description: req.body.description || challenge.description,
            exerciseTypeId: req.body.exerciseTypeId || challenge.exerciseTypeId,
            difficulty: req.body.difficulty || challenge.difficulty,
            objectives: req.body.objectives || challenge.objectives
        };

        // Si les dates sont fournies, recalculer la durée
        if (req.body.startDate && req.body.endDate) {
            updateData.startDate = new Date(req.body.startDate);
            updateData.endDate = new Date(req.body.endDate);
            updateData.duration = calculateDuration(req.body.startDate, req.body.endDate);
        }

        // Si les salles sont modifiées, vérifier qu'elles appartiennent au propriétaire
        if (req.body.gymIds && Array.isArray(req.body.gymIds)) {
            const newGyms = await Gym.find({ _id: { $in: req.body.gymIds }, ownerId });
            if (newGyms.length !== req.body.gymIds.length) {
                return res.status(403).json({ erreur: 'Une ou plusieurs salles ne vous appartiennent pas' });
            }

            // Vérifier que toutes les salles sont approuvées
            const unapprovedGyms = newGyms.filter(gym => !gym.isApproved);
            if (unapprovedGyms.length > 0) {
                return res.status(400).json({
                    erreur: `Impossible d'associer des salles non approuvées: ${unapprovedGyms.map(g => g.name).join(', ')}`
                });
            }

            updateData.gymIds = req.body.gymIds;
        }

        // Mettre à jour le défi
        const updatedChallenge = await Challenge.findByIdAndUpdate(
            challengeId,
            updateData,
            { new: true }
        )
            .populate('gymIds', 'name')
            .populate('exerciseTypeId', 'name description targetedMuscles');

        res.json(updatedChallenge);
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Supprimer un défi (uniquement par le propriétaire de la salle)
router.delete('/owner/:challengeId', async (req, res) => {
    try {
        const { challengeId } = req.params;
        const { ownerId } = req.body;

        if (!ownerId) {
            return res.status(400).json({ erreur: 'ID du propriétaire requis' });
        }

        // Récupérer le défi et vérifier les permissions
        const challenge = await Challenge.findById(challengeId).populate('gymIds');
        if (!challenge) {
            return res.status(404).json({ erreur: 'Défi non trouvé' });
        }

        // Vérifier que toutes les salles appartiennent au propriétaire
        const ownerGyms = await Gym.find({ ownerId, _id: { $in: challenge.gymIds } });
        if (ownerGyms.length !== challenge.gymIds.length) {
            return res.status(403).json({ erreur: 'Vous n\'êtes pas autorisé à supprimer ce défi' });
        }

        await Challenge.findByIdAndDelete(challengeId);

        res.json({ message: `Défi "${challenge.title}" supprimé avec succès` });
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Récupérer les types d'exercices disponibles (pour le formulaire)
router.get('/exercise-types', async (req, res) => {
    try {
        const exerciseTypes = await ExerciseType.find({}, '_id name description targetedMuscles');
        res.json(exerciseTypes);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

module.exports = router;
