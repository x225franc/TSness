import { Schema } from 'mongoose';
import { Badge } from '../../../models';

export function badgeSchema(): Schema<Badge> {
    return new Schema<Badge>(
        {
            badgeId: { type: Schema.Types.ObjectId },
            earnedAt: { type: Date }
        },
        { _id: false }
    );
}
