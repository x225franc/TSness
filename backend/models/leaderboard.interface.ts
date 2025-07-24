import { Types } from "mongoose";

export interface LeaderboardEntry {
	userId: Types.ObjectId;
	score: number;
	_id?: Types.ObjectId;
}

export interface Leaderboard {
	_id?: Types.ObjectId;
	type: string;
	gymId: Types.ObjectId;
	entries: LeaderboardEntry[];
	updatedAt: Date;
}
