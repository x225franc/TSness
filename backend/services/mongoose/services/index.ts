import mongoose from 'mongoose';
import { badgeSchema, challengeSchema, exerciseTypeSchema, gymSchema, leaderboardSchema, notificationSchema, userSchema } from '../schema';

export const BadgeModel = mongoose.models.Badge || mongoose.model('Badge', badgeSchema());
export const ChallengeModel = mongoose.models.Challenge || mongoose.model('Challenge', challengeSchema());
export const ExerciseTypeModel = mongoose.models.ExerciseType || mongoose.model('ExerciseType', exerciseTypeSchema());
export const GymModel = mongoose.models.Gym || mongoose.model('Gym', gymSchema());
export const LeaderboardModel = mongoose.models.Leaderboard || mongoose.model('Leaderboard', leaderboardSchema());
export const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', notificationSchema());
export const UserModel = mongoose.models.User || mongoose.model('User', userSchema());