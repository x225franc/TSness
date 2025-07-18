import express from 'express';
import { GymModel, ChallengeModel, ExerciseTypeModel } from '../services/mongoose/services';
import { ChallengeInput } from '../models';

const router = express.Router();

// Récupérer tous les défis
router.get('/', async (req, res) => {
    try {
        const challenges = await ChallengeModel.find()
            .populate('gymIds', 'name')
            .populate('exerciseTypeId', 'name')
            .populate('createdBy', 'firstname lastname');
        res.json(challenges);
    } catch (err) {
        res.status(500).json({ erreur: (err as Error).message });
    }
});

// Récupérer les défis d'un propriétaire spécifique (via ses salles)
router.get('/owner', async (req, res) => {
    try {
        const ownerId = req.query.ownerId;
        if (!ownerId) return res.status(400).json({ erreur: 'ID du propriétaire requis' });

        // Récupérer toutes les salles du propriétaire
        const ownerGyms = await GymModel.find({ ownerId }, '_id');
        const gymIds = ownerGyms.map(gym => gym._id);

        // Récupérer tous les défis liés aux salles du propriétaire
        const challenges = await ChallengeModel.find({ gymIds: { $in: gymIds } })
            .populate('gymIds', 'name address')
            .populate('exerciseTypeId', 'name description targetedMuscles')
            .sort({ createdAt: -1 });

        res.json(challenges);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
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
            objectives
        } = req.body;
        const ownerId = req.query['owner_id'];

        if (
            !title || !description || !gymIds || !Array.isArray(gymIds) || gymIds.length === 0 || !startDate || !endDate
        ) {
            return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
        }

        // Vérifier que toutes les salles appartiennent bien au propriétaire
        const gyms = await GymModel.find({ _id: { $in: gymIds }, ownerId });
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

        const challenge = new ChallengeModel({
            title,
            description,
            gymIds,
            exerciseTypeId: exerciseTypeId || null,
            difficulty,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            objectives: objectives || [],
            createdBy: ownerId,
            createdAt: new Date()
        });
        await challenge.save();

        // Retourner le défi avec les informations des salles
        const savedChallenge = await ChallengeModel.findById(challenge._id)
            .populate('gymIds', 'name')
            .populate('exerciseTypeId', 'name description targetedMuscles');

        res.status(201).json(savedChallenge);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});


// Récupérer le défi et vérifier les permissions
router.put('/owner/:challengeId', async (req, res) => {
    const { challengeId } = req.params;
    const {
        title,
        description,
        gymIds,
        exerciseTypeId,
        difficulty,
        startDate,
        endDate,
        objectives,
        ownerId // Should be retrieved from query params
    } = req.body;

    try {
        if (
            !title || !description || !gymIds || !Array.isArray(gymIds) || gymIds.length === 0 ||
            !ownerId || !startDate || !endDate
        ) {
            return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
        }

        const challenge = await ChallengeModel.findById(challengeId).populate('gymIds');
        if (!challenge) {
            return res.status(404).json({ erreur: 'Défi non trouvé' });
        }

        const ownerGyms = await GymModel.find({ ownerId, _id: { $in: challenge.gymIds } });
        if (ownerGyms.length !== challenge.gymIds.length) {
            return res.status(403).json({ erreur: 'Vous n\'êtes pas autorisé à modifier ce défi' });
        }

        const newGyms = await GymModel.find({ _id: { $in: gymIds }, ownerId });
        if (newGyms.length !== gymIds.length) {
            return res.status(403).json({ erreur: 'Une ou plusieurs salles ne vous appartiennent pas' });
        }

        const unapprovedGyms = newGyms.filter(gym => !gym.isApproved);
        if (unapprovedGyms.length > 0) {
            return res.status(400).json({
                erreur: `Impossible d'associer des salles non approuvées: ${unapprovedGyms.map(g => g.name).join(', ')}`
            });
        }

        const updateData: ChallengeInput = {
            title,
            description,
            gymIds,
            exerciseTypeId,
            difficulty,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            objectives: objectives || [],
            ownerId
        };

        const updatedChallenge = await ChallengeModel.findByIdAndUpdate(
            challengeId,
            updateData,
            { new: true }
        )
            .populate('gymIds', 'name')
            .populate('exerciseTypeId', 'name description targetedMuscles');

        if (!updatedChallenge) {
            return res.status(404).json({ erreur: 'Défi non trouvé' });
        }

        res.json(updatedChallenge);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Supprimer un défi (uniquement par le propriétaire de la salle)
router.delete('/owner/:challengeId', async (req, res) => {
    try {
        const { challengeId } = req.params;
        const ownerId = req.query['owner_id'];

        if (!ownerId) {
            return res.status(400).json({ erreur: 'ID du propriétaire requis' });
        }

        // Récupérer le défi et vérifier les permissions
        const challenge = await ChallengeModel.findById(challengeId).populate('gymIds');
        if (!challenge) {
            return res.status(404).json({ erreur: 'Défi non trouvé' });
        }

        // Vérifier que toutes les salles appartiennent au propriétaire
        const ownerGyms = await GymModel.find({ ownerId, _id: { $in: challenge.gymIds } });
        if (ownerGyms.length !== challenge.gymIds.length) {
            return res.status(403).json({ erreur: 'Vous n\'êtes pas autorisé à supprimer ce défi' });
        }

        await ChallengeModel.findByIdAndDelete(challengeId);

        res.json({ message: `Défi "${challenge.title}" supprimé avec succès` });
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});


// Récupérer les types d'exercices disponibles (pour le formulaire)
router.get('/exercise-types', async (req, res) => {
    try {
        const exerciseTypes = await ExerciseTypeModel.find({}, '_id name description targetedMuscles');
        res.json(exerciseTypes);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

export default router;
