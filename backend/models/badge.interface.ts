import { Types } from "mongoose";

export interface Badge {
	name: string;
	description: string;
	image: string;
	rule: {
		type: string;
		value: number;
		details: string;
	};
}
