import { Schema } from "mongoose";
import { Notification } from "../../../models";

export function notificationSchema(): Schema<Notification> {
	return new Schema<Notification>(
		{
			userId: { type: Schema.Types.ObjectId },
			message: { type: String },
			type: { type: String },
			relatedId: { type: Schema.Types.ObjectId },
			isRead: { type: Boolean },
			createdAt: { type: Date },
		},
		{
			collection: "notifications",
		}
	);
}
