import { Types } from "mongoose";

export interface ExerciseType {
	_id?: Types.ObjectId;
	name: string;
	description: string;
	targetedMuscles: string[];
}
