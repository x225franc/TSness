import { Schema } from 'mongoose';
import { Badge } from '../../../models';

const ruleSchema = new Schema(
    {
        type: { type: String, required: true },
        value: { type: Number, required: true },
        details: { type: String, required: true },
    },
    { _id: false }
);

export function badgeSchema(): Schema<Badge> {
    return new Schema<Badge>({
        name: { type: String, required: true },
        description: { type: String, required: true },
        image: { type: String, required: true },
        rule: ruleSchema,
    });
}
