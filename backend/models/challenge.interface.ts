import { Types } from 'mongoose';

export interface ChallengeCreated {
    title: string;
    description: string;
    type: string;
    difficulty: string;
    duration: string; // A supprimer en BDD puis ici
}

export interface ChallengeJoined {
    challengeId: Types.ObjectId;
    joinedAt: Date;
    progress: {
        sessions: number;
        caloriesBurned: number;
        completed: boolean;
    };
}

export interface Challenge {
    title: String;
    description: String;
    createdBy: Types.ObjectId;
    gymIds: [{ type: Types.ObjectId, ref: 'Gym' }];
    exerciseTypeId: Types.ObjectId;
    difficulty: { type: String; enum: ['facile', 'intermédiaire', 'difficile'] };
    startDate: Date;
    endDate: Date;
    duration: String; // A supprimer en BDD puis ici
    objectives: [String];
    createdAt: Date;
}

export interface ChallengeInput {
    title: string;
    description: string;
    gymIds: Types.ObjectId[] | string[];
    exerciseTypeId?: Types.ObjectId | string;
    difficulty?: string;
    startDate: string;
    endDate: string;
    objectives?: string[];
    ownerId: Types.ObjectId | string;
}