import express from 'express';
import { GymModel, ChallengeModel, ExerciseTypeModel, UserModel, BadgeModel } from '../services/mongoose/services';
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

// Créer un défi par un utilisateur (partageable)
router.post('/', async (req, res) => {
    try {
        const {
            title,
            description,
            exerciseTypeId,
            difficulty,
            durationInDays,
            objectives,
            sharedWith, // tableau d'IDs d'utilisateurs
            isPublic    // booléen
        } = req.body;

        const userId = req.query['user_id']; // ou récupérez via l'authentification
        if (!userId) {
            return res.status(400).json({ erreur: 'ID utilisateur requis' });
        }

        if (!title || !description || !durationInDays) {
            return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
        }

        // Vérifier que l'utilisateur existe
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
        }

        const challenge = new ChallengeModel({
            title,
            description,
            createdBy: userId,
            exerciseTypeId: exerciseTypeId || null,
            difficulty,
            durationInDays,
            objectives: objectives || [],
            sharedWith: Array.isArray(sharedWith) ? sharedWith : [],
            isPublic: !!isPublic,
            createdAt: new Date()
        });

        await challenge.save();

        // ----------- LOGIQUE BADGE PREMIER DÉFI -----------
        const nbDefis = await ChallengeModel.countDocuments({ createdBy: userId });
        if (nbDefis === 1) {
            const badge = await BadgeModel.findOne({ name: "Créateur de défi" });
            if (badge) {
                const hasBadge = user.badges.some((b: any) => b.name === badge.name);
                if (!hasBadge) {
                    user.badges.push(badge);
                    await user.save();
                }
            }
        }
        // ----------- LOGIQUE BADGE JOUER EN COMMUNAUTÉ -----------
        if (Array.isArray(sharedWith) && sharedWith.length > 0) {
            const badgeCommunity = await BadgeModel.findOne({ name: "Jouez en communauté" });
            if (badgeCommunity) {
                const hasCommunityBadge = user.badges.some((b: any) => b.name === badgeCommunity.name);
                if (!hasCommunityBadge) {
                    user.badges.push(badgeCommunity);
                    await user.save();
                }
            }
        }
        // ----------- FIN LOGIQUE BADGE -----------

        res.status(201).json(challenge);
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

// Récupérer les défis d'un propriétaire spécifique (via ses salles)
router.get('/owner', async (req, res) => {
    try {
        const ownerId = req.query['owner_id'];
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
            durationInDays,
            objectives
        } = req.body;
        const ownerId = req.query['owner_id'];
        if (!ownerId) {
            return res.status(400).json({ erreur: 'ID du propriétaire requis' });
        }

        if (
            !title || !description || !gymIds || !Array.isArray(gymIds) || gymIds.length === 0 || !durationInDays
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
            durationInDays,
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
        durationInDays,
        objectives
    } = req.body;
    const ownerId = req.query['owner_id'];

    try {
        if (
            !title || !description || !gymIds || !Array.isArray(gymIds) || gymIds.length === 0 || !durationInDays
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
            durationInDays,
            objectives: objectives || []
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

// Compléter un défi (par un utilisateur)
router.post('/complete/:challengeId', async (req, res) => {
    try {
        const { challengeId } = req.params;
        const userId = req.query['user_id'];

        if (!challengeId) {
            return res.status(400).json({ erreur: 'ID du défi requis' });
        }
        const challenge = await ChallengeModel.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ erreur: 'Défi non trouvé' });
        }
        if (!userId) {
            return res.status(400).json({ erreur: 'ID de l\'utilisateur requis' });
        }
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
        }
        if (user.challenges_completed && user.challenges_completed.includes(challenge._id)) {
            return res.status(400).json({ erreur: 'Challenge déjà complété' });
        }
        user.challenges_completed = user.challenges_completed || [];
        user.challenges_completed.push(challenge._id);

        // Attribution des points selon la difficulté
        let points = 0;
        if (challenge.difficulty === 'facile') points = 20;
        else if (challenge.difficulty === 'intermédiaire') points = 40;
        else if (challenge.difficulty === 'difficile') points = 70;
        else points = 20; // défaut

        // +10 points si l'utilisateur était invité (sharedWith)
        if (Array.isArray(challenge.sharedWith) && challenge.sharedWith.includes(userId)) {
            points += 10;
        }

        user.score = (user.score || 0) + points;
        await user.save();

        res.json({ message: 'Challenge complété avec succès', score: user.score });
    } catch (err) {
        res.status(400).json({ erreur: (err as Error).message });
    }
});

export default router;
