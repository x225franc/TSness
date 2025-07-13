import { Schema } from 'mongoose';
import { ChallengeCreated, ChallengeJoined, Challenge } from '../../../models';

export function challengeCreatedSchema(): Schema<ChallengeCreated> {
    return new Schema<ChallengeCreated>(
        {
            title: { type: String },
            description: { type: String },
            type: { type: String },
            difficulty: { type: String },
            duration: { type: String } // A supprimer en BDD puis ici
        },
        { _id: false }
    );
}

export function challengeJoinedSchema(): Schema<ChallengeJoined> {
    return new Schema<ChallengeJoined>(
        {
            challengeId: { type: Schema.Types.ObjectId },
            joinedAt: { type: Date },
            progress: {
                sessions: { type: Number },
                caloriesBurned: { type: Number },
                completed: { type: Boolean }
            }
        },
        { _id: false }
    );
}

export function challengeSchema(): Schema<Challenge> {
    return new Schema<Challenge>(
        {
            title: { type: String, required: true },
            description: { type: String, required: true },
            createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            gymIds: [{ type: Schema.Types.ObjectId, ref: 'Gym' }],
            exerciseTypeId: { type: Schema.Types.ObjectId, ref: 'ExerciseType' },
            difficulty: { type: String, enum: ['facile', 'intermédiaire', 'difficile'] },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            duration: { type: String }, // A supprimer en BDD puis ici
            objectives: [{ type: String }],
            createdAt: { type: Date, default: Date.now }
        }
    );
}
