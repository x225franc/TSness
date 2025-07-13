import { Types } from 'mongoose';

export interface Badge {
    badgeId: Types.ObjectId;
    earnedAt: Date;
}
