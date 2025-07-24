// Script TypeScript de recalcul des scores pour tous les utilisateurs
// exécution : npx ts-node backend/scripts/recalculate_scores.ts

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./../.env" });

import { UserModel, ChallengeModel } from "../services/mongoose/services";

export async function recalculateScores(closeConnection = false) {
	if (mongoose.connection.readyState === 0) {
		await mongoose.connect(process.env.MONGODB_URI as string);
	}
	const users = await UserModel.find();
	let updated = 0;
	for (const user of users) {
		let score = 0;
		if (Array.isArray(user.challenges_completed)) {
			for (const challengeId of user.challenges_completed) {
				const challenge = await ChallengeModel.findById(challengeId);
				if (!challenge) continue;
				// Points selon la difficulté
				if (challenge.difficulty === "facile") score += 20;
				else if (challenge.difficulty === "intermédiaire") score += 40;
				else if (challenge.difficulty === "difficile") score += 70;
				else score += 20;
				// +10 si l'utilisateur était invité
				if (
					Array.isArray(challenge.sharedWith) &&
					challenge.sharedWith.map(String).includes(String(user._id))
				) {
					score += 10;
				}
			}
		}
		user.score = score;
		await user.save();
		updated++;
	}
	console.log(`Scores recalculés pour ${updated} utilisateurs.`);
	if (closeConnection) {
		await mongoose.disconnect();
	}
}

if (require.main === module) {
	recalculateScores(true).catch((err) => {
		console.error("Erreur lors du recalcul des scores:", err);
		process.exit(1);
	});
}
