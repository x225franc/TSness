import { Types } from "mongoose";

export interface Notification {
	_id?: Types.ObjectId;
	userId: Types.ObjectId;
	message: string;
	type: string;
	relatedId: Types.ObjectId;
	isRead: boolean;
	createdAt: Date;
}
