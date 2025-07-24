import { Schema } from "mongoose";
import { ChallengeCreated, ChallengeJoined, Challenge } from "../../../models";

export function challengeCreatedSchema(): Schema<ChallengeCreated> {
	return new Schema<ChallengeCreated>(
		{
			title: { type: String },
			description: { type: String },
			type: { type: String },
			difficulty: { type: String },
			durationInDays: { type: String },
		},
		{ _id: false }
	);
}

export function challengeJoinedSchema(): Schema<ChallengeJoined> {
	return new Schema<ChallengeJoined>(
		{
			challengeId: { type: Schema.Types.ObjectId },
			joinedAt: { type: Date },
			progress: {
				sessions: { type: Number },
				caloriesBurned: { type: Number },
				completed: { type: Boolean },
			},
		},
		{ _id: false }
	);
}

export function challengeSchema(): Schema<Challenge> {
	return new Schema<Challenge>({
		title: { type: String, required: true },
		description: { type: String, required: true },
		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
		gymIds: [{ type: Schema.Types.ObjectId, ref: "Gym" }],
		exerciseTypeId: { type: Schema.Types.ObjectId, ref: "ExerciseType" },
		difficulty: {
			type: String,
			enum: ["facile", "intermédiaire", "difficile"],
		},
		durationInDays: { type: Number, required: true },
		objectives: [{ type: String }],
		createdAt: { type: Date, default: Date.now },
		sharedWith: [{ type: Schema.Types.ObjectId, ref: "User" }],
		isPublic: { type: Boolean, default: false },
	});
}
