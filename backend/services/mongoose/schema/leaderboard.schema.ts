import { Schema } from 'mongoose';
import { Leaderboard } from '../../../models';

export function leaderboardSchema(): Schema<Leaderboard> {
    return new Schema<Leaderboard>({
        type: { type: String },
        gymId: { type: Schema.Types.ObjectId },
        entries: [{
            userId: { type: Schema.Types.ObjectId },
            score: { type: Number },
            _id: { type: Schema.Types.ObjectId }
        }],
        updatedAt: { type: Date }
    }, {
        collection: 'leaderboards'
    });
}
