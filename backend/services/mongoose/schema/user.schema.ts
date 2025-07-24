import { Schema } from "mongoose";
import { User } from "../../../models";
import {
	challengeCreatedSchema,
	challengeJoinedSchema,
} from "./challenge.schema";
import { badgeSchema } from "./badge.schema";

export function userSchema(): Schema<User> {
	return new Schema<User>(
		{
			firstname: { type: String },
			lastname: { type: String },
			email: { type: String, unique: true },
			password: { type: String },
			role: { type: String, enum: ["client", "owner", "superadmin"] },
			isActive: { type: Boolean },
			createdAt: { type: Date },
			updatedAt: { type: Date },
			challenges_created: { type: [challengeCreatedSchema()] },
			challenges_joined: { type: [challengeJoinedSchema()] },
			challenges_completed: [{ type: Schema.Types.ObjectId, ref: "Challenge" }],
			friends: { type: [Schema.Types.ObjectId] },
			badges: { type: [badgeSchema()] },
			score: { type: Number },
		},
		{
			collection: "users",
		}
	);
}
