import { Types } from "mongoose";

export interface Gym {
	_id?: Types.ObjectId;
	ownerId: Types.ObjectId;
	name: string;
	address: string;
	contact: string;
	description: string;
	equipments: string[];
	activities: string[];
	capacity: number;
	isApproved: boolean;
	exerciseTypeId: Types.ObjectId;
	difficulty: "facile" | "intermédiaire" | "difficile" | "";
	createdAt: Date;
	updatedAt: Date;
}
