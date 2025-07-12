import { Schema } from 'mongoose';
import { Gym } from '../../../models';

export function gymSchema(): Schema<Gym> {
    return new Schema<Gym>({
        ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
        name: { type: String },
        address: { type: String },
        contact: { type: String },
        description: { type: String },
        equipments: { type: [String] },
        activities: { type: [String] },
        capacity: { type: Number },
        isApproved: { type: Boolean },
        exerciseTypeId: { type: Schema.Types.ObjectId, ref: 'ExerciseType' },
        difficulty: { type: String, enum: ['facile', 'intermédiaire', 'difficile', ''] },
        createdAt: { type: Date },
        updatedAt: { type: Date }
    }, {
        collection: 'gyms'
    });
}