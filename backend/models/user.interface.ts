import { Types } from 'mongoose';
import { ChallengeCreated, ChallengeJoined, Badge } from './';

export interface User {
    _id?: Types.ObjectId;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    role: 'client' | 'owner' | 'superadmin';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    challenges_created: ChallengeCreated[];
    challenges_joined: ChallengeJoined[];
    challenges_completed: Types.ObjectId[];
    friends: Types.ObjectId[];
    badges: Badge[];
    score: number;
}
