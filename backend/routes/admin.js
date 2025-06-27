const express = require('express');
const router = express.Router();
const { User, Gym, Challenge, Notification, Leaderboard } = require('../models/TSness');

// Récupérer tous les utilisateurs
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'firstname lastname email role isActive createdAt score');
        res.json(users);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Désactiver/Activer un utilisateur
router.patch('/users/:id/toggle-status', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
        
        user.isActive = !user.isActive;
        user.updatedAt = new Date();
        await user.save();
        
        res.json({ 
            message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'} avec succès`,
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Supprimer un utilisateur avec suppression en cascade
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
        
        // Empêcher la suppression d'un superadmin
        if (user.role === 'superadmin') {
            return res.status(403).json({ erreur: 'Impossible de supprimer un super administrateur' });
        }
        
        const userId = user._id;
        
        // === Suppression en cascade selon le rôle ===
        
        if (user.role === 'owner') {
            // Supprimer toutes les salles du propriétaire
            await Gym.deleteMany({ ownerId: userId });
            
            // Supprimer tous les défis créés par ce propriétaire
            await Challenge.deleteMany({ createdBy: userId });
        }
        
        if (user.role === 'client' || user.role === 'owner') {
            // Supprimer tous les défis créés par cet utilisateur
            await Challenge.deleteMany({ createdBy: userId });
            
            // Retirer cet utilisateur des listes d'amis des autres utilisateurs
            // await User.updateMany(
            //     { friends: userId },
            //     { $pull: { friends: userId } }
            // );
            
            // Retirer ses participations aux défis des autres utilisateurs
            // await User.updateMany(
            //     { 'challenges_joined.challengeId': { $exists: true } },
            //     { $pull: { challenges_joined: { challengeId: userId } } }
            // );
            
            // Supprimer toutes les notifications liées à cet utilisateur
            await Notification.deleteMany({ 
                $or: [
                    { userId: userId },
                    { relatedId: userId }
                ]
            });
            
            // Supprimer ses entrées des leaderboards
            await Leaderboard.updateMany(
                { 'entries.userId': userId },
                { $pull: { entries: { userId: userId } } }
            );
        }
        
        // Supprimer l'utilisateur lui-même
        await User.findByIdAndDelete(req.params.id);
        
        res.json({ 
            message: `Utilisateur et toutes ses données associées supprimés avec succès`,
            deletedUser: {
                id: userId,
                name: `${user.firstname} ${user.lastname}`,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ erreur: `Erreur lors de la suppression: ${err.message}` });
    }
});

// Modifier le rôle d'un utilisateur
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['client', 'owner', 'superadmin'].includes(role)) {
            return res.status(400).json({ erreur: 'Rôle invalide' });
        }
        
        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { role, updatedAt: new Date() }, 
            { new: true, select: 'firstname lastname email role isActive' }
        );
        
        if (!user) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
        
        res.json({ 
            message: 'Rôle mis à jour avec succès',
            user 
        });
    } catch (err) {
        res.status(400).json({ erreur: err.message });
    }
});

// Prévisualiser ce qui sera supprimé avec un utilisateur (pour confirmation)
router.get('/users/:id/deletion-preview', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
        
        // Empêcher la suppression d'un superadmin
        if (user.role === 'superadmin') {
            return res.status(403).json({ erreur: 'Impossible de supprimer un super administrateur' });
        }
        
        const userId = user._id;
        const preview = {
            user: {
                id: userId,
                name: `${user.firstname} ${user.lastname}`,
                email: user.email,
                role: user.role
            },
            toDelete: {}
        };
        
        if (user.role === 'owner') {
            // Compter les salles du propriétaire
            const gymsCount = await Gym.countDocuments({ ownerId: userId });
            preview.toDelete.gyms = gymsCount;
        }
        
        // Compter les défis créés par cet utilisateur
        const challengesCount = await Challenge.countDocuments({ createdBy: userId });
        preview.toDelete.challenges = challengesCount;
        
        // Compter les notifications liées
        const notificationsCount = await Notification.countDocuments({
            $or: [
                { userId: userId },
                { relatedId: userId }
            ]
        });
        preview.toDelete.notifications = notificationsCount;
        
        // Compter les entrées dans les leaderboards
        const leaderboardEntries = await Leaderboard.countDocuments({
            'entries.userId': userId
        });
        preview.toDelete.leaderboardEntries = leaderboardEntries;
        
        // Compter les amis qui seront affectés
        const friendsCount = await User.countDocuments({ friends: userId });
        preview.toDelete.friendRelations = friendsCount;
        
        res.json(preview);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

module.exports = router;
