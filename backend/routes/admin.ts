import express from "express";
import {
	UserModel,
	GymModel,
	ChallengeModel,
	NotificationModel,
	LeaderboardModel,
} from "../services/mongoose/services";
import { recalculateScores } from "../scripts/recalculate_scores";

const router = express.Router();

// Récupérer tous les utilisateurs
router.get("/users", async (req, res) => {
	try {
		const users = await UserModel.find(
			{},
			"firstname lastname email role isActive createdAt score"
		);
		res.json(users);
	} catch (err) {
		res.status(500).json({ erreur: (err as Error).message });
	}
});

// Désactiver/Activer un utilisateur
router.patch("/users/:id/toggle-status", async (req, res) => {
	try {
		const user = await UserModel.findById(req.params.id);
		if (!user)
			return res.status(404).json({ erreur: "Utilisateur non trouvé" });

		user.isActive = !user.isActive;
		user.updatedAt = new Date();
		await user.save();

		res.json({
			message: `Utilisateur ${
				user.isActive ? "activé" : "désactivé"
			} avec succès`,
			user: {
				id: user._id,
				firstname: user.firstname,
				lastname: user.lastname,
				email: user.email,
				role: user.role,
				isActive: user.isActive,
			},
		});
	} catch (err) {
		res.status(400).json({ erreur: (err as Error).message });
	}
});

// Supprimer un utilisateur avec suppression en cascade
router.delete("/users/:id", async (req, res) => {
	try {
		const user = await UserModel.findById(req.params.id);
		if (!user)
			return res.status(404).json({ erreur: "Utilisateur non trouvé" });

		if (user.role === "superadmin") {
			return res
				.status(403)
				.json({ erreur: "Impossible de supprimer un super administrateur" });
		}

		const userId = user._id;

		if (user.role === "owner") {
			await GymModel.deleteMany({ ownerId: userId });

			await ChallengeModel.deleteMany({ createdBy: userId });
		}

		if (user.role === "client" || user.role === "owner") {
			await ChallengeModel.deleteMany({ createdBy: userId });

			await NotificationModel.deleteMany({
				$or: [{ userId: userId }, { relatedId: userId }],
			});

			await LeaderboardModel.updateMany(
				{ "entries.userId": userId },
				{ $pull: { entries: { userId: userId } } }
			);
		}

		await UserModel.findByIdAndDelete(req.params.id);

		res.json({
			message: `Utilisateur et toutes ses données associées supprimés avec succès`,
			deletedUser: {
				id: userId,
				name: `${user.firstname} ${user.lastname}`,
				role: user.role,
			},
		});
	} catch (err) {
		res.status(500).json({
			erreur: `Erreur lors de la suppression: ${(err as Error).message}`,
		});
	}
});

// Modifier le rôle d'un utilisateur
router.patch("/users/:id/role", async (req, res) => {
	try {
		const { role } = req.body;

		if (!["client", "owner", "superadmin"].includes(role)) {
			return res.status(400).json({ erreur: "Rôle invalide" });
		}

		const user = await UserModel.findByIdAndUpdate(
			req.params.id,
			{ role, updatedAt: new Date() },
			{ new: true, select: "firstname lastname email role isActive" }
		);

		if (!user)
			return res.status(404).json({ erreur: "Utilisateur non trouvé" });

		res.json({
			message: "Rôle mis à jour avec succès",
			user,
		});
	} catch (err) {
		res.status(400).json({ erreur: (err as Error).message });
	}
});

// Prévisualiser ce qui sera supprimé avec un utilisateur (pour confirmation)
router.get("/users/:id/deletion-preview", async (req, res) => {
	try {
		const user = await UserModel.findById(req.params.id);
		if (!user)
			return res.status(404).json({ erreur: "Utilisateur non trouvé" });

		if (user.role === "superadmin") {
			return res
				.status(403)
				.json({ erreur: "Impossible de supprimer un super administrateur" });
		}

		const userId = user._id;
		const preview = {
			user: {
				id: userId,
				name: `${user.firstname} ${user.lastname}`,
				email: user.email,
				role: user.role,
			},
			toDelete: {
				gyms: 0,
				challenges: 0,
				notifications: 0,
				leaderboardEntries: 0,
				friendRelations: 0,
			},
		};

		if (user.role === "owner") {
			const gymsCount = await GymModel.countDocuments({ ownerId: userId });
			preview.toDelete.gyms = gymsCount;
		}

		const challengesCount = await ChallengeModel.countDocuments({
			createdBy: userId,
		});
		preview.toDelete.challenges = challengesCount;

		const notificationsCount = await NotificationModel.countDocuments({
			$or: [{ userId: userId }, { relatedId: userId }],
		});
		preview.toDelete.notifications = notificationsCount;

		const leaderboardEntries = await LeaderboardModel.countDocuments({
			"entries.userId": userId,
		});
		preview.toDelete.leaderboardEntries = leaderboardEntries;

		const friendsCount = await UserModel.countDocuments({ friends: userId });
		preview.toDelete.friendRelations = friendsCount;

		res.json(preview);
	} catch (err) {
		res.status(500).json({ erreur: (err as Error).message });
	}
});

// Lancer le recalcul des scores (admin)
router.post("/recalculate-scores", async (_req, res) => {
	try {
		await recalculateScores();
		res.json({ message: "Scores recalculés avec succès." });
	} catch (err) {
		res.status(500).json({ erreur: (err as Error).message });
	}
});

export default router;
