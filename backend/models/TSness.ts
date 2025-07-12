import mongoose from 'mongoose';

// --- USER ---
const ChallengeCreatedSchema = new mongoose.Schema({
    title: String,
    description: String,
    type: String,
    difficulty: String,
    duration: String
}, { _id: false });

const ChallengeJoinedSchema = new mongoose.Schema({
    challengeId: mongoose.Schema.Types.ObjectId,
    joinedAt: Date,
    progress: {
        sessions: Number,
        caloriesBurned: Number,
        completed: Boolean
    }
}, { _id: false });

const BadgeSchema = new mongoose.Schema({
    badgeId: mongoose.Schema.Types.ObjectId,
    earnedAt: Date
}, { _id: false });

const UserSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['client', 'owner', 'superadmin'] },
    isActive: Boolean,
    createdAt: Date,
    updatedAt: Date,
    challenges_created: [ChallengeCreatedSchema],
    challenges_joined: [ChallengeJoinedSchema],
    friends: [mongoose.Schema.Types.ObjectId],
    badges: [BadgeSchema],
    score: Number
}, { collection: 'users' });

// --- GYM  ---
const GymSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // responsable de salle
    name: String,
    address: String,
    contact: String,
    description: String,
    equipments: [String],
    activities: [String],
    capacity: Number,
    isApproved: Boolean,
    exerciseTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseType' }, // type d'exercice associé
    difficulty: { type: String, enum: ['facile', 'intermédiaire', 'difficile', ''] }, // niveau de difficulté
    createdAt: Date,
    updatedAt: Date
}, { collection: 'gyms' });

// --- EXERCISE TYPE  ---
const ExerciseTypeSchema = new mongoose.Schema({
    name: String,
    description: String,
    targetedMuscles: [String]
}, { collection: 'exercisetypes' });

// --- CHALLENGE  ---
const ChallengeSchema = new mongoose.Schema({
    title: String,
    description: String,
    createdBy: mongoose.Schema.Types.ObjectId,
    gymIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Gym' }],
    exerciseTypeId: mongoose.Schema.Types.ObjectId,
    difficulty: { type: String, enum: ['facile', 'intermédiaire', 'difficile'] },
    startDate: Date,
    endDate: Date,
    duration: String,
    objectives: [String],
    createdAt: Date
}, { collection: 'challenges' });

// --- BADGE  ---
const BadgeCollectionSchema = new mongoose.Schema({
    name: String,
    description: String,
    image: String,
    rule: {
        type: { type: String },
        value: Number,
        details: String
    }
}, { collection: 'badges' });

// --- REWARD  ---
const RewardSchema = new mongoose.Schema({
    name: String,
    description: String,
    userId: mongoose.Schema.Types.ObjectId,
    awardedAt: Date
}, { collection: 'rewards' });

// --- NOTIFICATION  ---
const NotificationSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    message: String,
    type: String,
    relatedId: mongoose.Schema.Types.ObjectId,
    isRead: Boolean,
    createdAt: Date
}, { collection: 'notifications' });

// --- LEADERBOARD  ---
const LeaderboardSchema = new mongoose.Schema({
    type: String,
    gymId: mongoose.Schema.Types.ObjectId,
    entries: [
        {
            userId: mongoose.Schema.Types.ObjectId,
            score: Number,
            _id: mongoose.Schema.Types.ObjectId
        }
    ],
    updatedAt: Date
}, { collection: 'leaderboards' });

export const User = mongoose.model('User', UserSchema);
// export const Gym = mongoose.model('Gym', GymSchema);
export const ExerciseType = mongoose.model('ExerciseType', ExerciseTypeSchema);
export const Challenge = mongoose.model('Challenge', ChallengeSchema);
export const Badge = mongoose.model('Badge', BadgeCollectionSchema);
export const Reward = mongoose.model('Reward', RewardSchema);
export const Notification = mongoose.model('Notification', NotificationSchema);
export const Leaderboard = mongoose.model('Leaderboard', LeaderboardSchema);
