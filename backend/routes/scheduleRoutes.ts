import express, { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import Schedule from '../models/Schedule';
import authMiddleware from '../middleware/authMiddleware';

// Body properties are unknown because a request can contain any JSON value.
// The POST route checks each value before using it.
interface CreateScheduleBody {
    dayOfWeek: unknown;
    startTime: unknown;
    endTime: unknown;
    activity: unknown;
}

interface UpdateScheduleBody {
    dayOfWeek?: unknown;
    startTime?: unknown;
    endTime?: unknown;
    activity?: unknown;
}

type DayOfWeek =
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday';

const router = express.Router();
const daysOfWeek: readonly DayOfWeek[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
] as const;
const timeRegex = /^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i;

// This type guard confirms the day is one of the model's allowed values.
function isDayOfWeek(day: unknown): day is DayOfWeek {
    return typeof day === 'string' && daysOfWeek.some((validDay) => validDay === day);
}

// All schedule routes require a valid Bearer token.
router.use(authMiddleware);

// GET /api/schedules
// Return every saved workout belonging to the authenticated user.
router.get('/', async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'Token Verification Failed' });
        return;
    }

    try {
        const entries = await Schedule.find({ userId: req.userId });
        res.status(200).json(entries);

    } catch (error: unknown) {

        console.error('Get schedule error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

});

// POST /api/schedules
// Save one workout entry. The user ID comes from the verified token, not the
// request body, so a client cannot create a schedule for someone else.
router.post('/', async (
    req: Request<Record<string, never>, unknown, CreateScheduleBody>,
    res: Response
) => {
    if (!req.userId) {
        res.status(401).json({ message: 'Token Verification Failed' });
        return;
    }

    const { dayOfWeek, startTime, endTime, activity } = req.body;

    // Check that all values are present and use the expected formats.
    if (
        !isDayOfWeek(dayOfWeek) ||
        typeof startTime !== 'string' ||
        !timeRegex.test(startTime.trim()) ||
        typeof endTime !== 'string' ||
        !timeRegex.test(endTime.trim()) ||
        typeof activity !== 'string' ||
        activity.trim().length === 0
    ) {
        res.status(400).json({
            message: 'Provide a valid day, start time, end time, and activity.'
        });
        return;
    }

    try {
        // isCompletedToday is omitted so the model can apply its default (false).
        const entry = await Schedule.create({
            userId: req.userId,
            dayOfWeek,
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            activity: activity.trim()
        });

        res.status(201).json(entry);

    } catch (error: unknown) {

        console.error('Create schedule error:', error);
        res.status(500).json({ message: 'Internal server error' });

    }
});

// PATCH /api/schedules/:id
// Update only the provided fields on one workout owned by the signed-in user.
router.patch('/:id', async (
    req: Request<{ id: string }, unknown, UpdateScheduleBody>,
    res: Response
) => {
    // req.params.id is the workout ID from the URL
    // req.body contains whichever update fields the client sent

    const { dayOfWeek, startTime, endTime, activity } = req.body;

    if (!req.userId) {
        res.status(401).json({ message: 'Token Verification Failed' });
        return;
    }

    const updates: {
        dayOfWeek?: DayOfWeek;
        startTime?: string;
        endTime?: string;
        activity?: string;
    } = {};

    if (dayOfWeek !== undefined) {
        if (!isDayOfWeek(dayOfWeek)) {
            res.status(400).json({ message: 'Invalid day of week' });
            return;
        }

        updates.dayOfWeek = dayOfWeek;
    }

    if (startTime !== undefined) {
        if (typeof startTime !== 'string' || !timeRegex.test(startTime.trim())) {
            res.status(400).json({ message: 'Invalid start time' });
            return;
        }

        updates.startTime = startTime.trim();
    }

    if (endTime !== undefined) {
        if (typeof endTime !== 'string' || !timeRegex.test(endTime.trim())) {
            res.status(400).json({ message: 'Invalid end time' });
            return;
        }

        updates.endTime = endTime.trim();
    }

    if (activity !== undefined) {
        if (typeof activity !== 'string' || activity.trim().length === 0) {
            res.status(400).json({ message: 'Invalid activity' });
            return;
        }

        updates.activity = activity.trim();
    }

    // A PATCH must contain at least one valid field to change.
    if (Object.keys(updates).length === 0) {
        res.status(400).json({ message: 'Provide at least one field to update.' });
        return;
    }

    // Route parameters are strings, so validate the MongoDB ID before querying.
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({ message: 'Invalid schedule ID' });
        return;
    }

    try {
        // Match both the schedule ID and owner so users can only update their own entries.
        const existingSchedule = await Schedule.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!existingSchedule) {
            res.status(404).json({ message: 'Schedule entry not found' });
            return;
        }

        // Apply only the validated fields; all other fields stay unchanged.
        Object.assign(existingSchedule, updates);

        await existingSchedule.save();

        res.status(200).json(existingSchedule);

    } catch (error: unknown) {
        console.error('Update schedule error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/schedules/:id
// Delete one workout only if it belongs to the authenticated user.
router.delete('/:id', async (
    req: Request<{ id: string }>,
    res: Response
) => {
    if (!req.userId) {
        res.status(401).json({ message: 'Token Verification Failed' });
        return;
    }

    // Route parameters arrive as strings; reject invalid MongoDB IDs up front.
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({ message: 'Invalid schedule ID' });
        return;
    }

    try {
        // Include the owner in the query so a user cannot delete another user's entry.
        const deletedSchedule = await Schedule.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!deletedSchedule) {
            res.status(404).json({ message: 'Schedule entry not found' });
            return;
        }

        res.status(200).json({ message: 'Schedule entry deleted successfully' });

    } catch (error: unknown) {
        
        console.error('Delete schedule error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;