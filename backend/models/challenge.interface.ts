import { Types } from "mongoose";

export interface ChallengeCreated {
	title: string;
	description: string;
	type: string;
	difficulty: string;
	durationInDays: string;
}

export interface ChallengeJoined {
	challengeId: Types.ObjectId;
	joinedAt: Date;
	progress: {
		sessions: number;
		caloriesBurned: number;
		completed: boolean;
	};
}

export interface Challenge {
	title: String;
	description: String;
	createdBy: Types.ObjectId;
	gymIds: [{ type: Types.ObjectId; ref: "Gym" }];
	exerciseTypeId: Types.ObjectId;
	difficulty: { type: String; enum: ["facile", "intermédiaire", "difficile"] };
	durationInDays: number;
	objectives: [String];
	createdAt: Date;
	sharedWith: Types.ObjectId[];
	isPublic: boolean;
}

export interface ChallengeInput {
	title: string;
	description: string;
	gymIds: Types.ObjectId[] | string[];
	exerciseTypeId?: Types.ObjectId | string;
	difficulty?: string;
	durationInDays: number;
	objectives?: string[];
}
