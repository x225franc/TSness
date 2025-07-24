import { Schema } from "mongoose";
import { ExerciseType } from "../../../models";

export function exerciseTypeSchema(): Schema<ExerciseType> {
	return new Schema<ExerciseType>(
		{
			name: { type: String },
			description: { type: String },
			targetedMuscles: { type: [String] },
		},
		{
			collection: "exercisetypes",
		}
	);
}
