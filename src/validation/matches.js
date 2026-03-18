import { z } from 'zod';

/**
 * Constant for match status
 */
export const MATCH_STATUS = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    FINISHED: 'finished'
};

/**
 * Validates list matches query parameters
 */
export const listMatchesQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional()
});

/**
 * Validates match ID param
 */
export const matchIdParamSchema = z.object({
    id: z.coerce.number().int().positive()
});


/**
 * Validates create match payload
 */
export const createMatchSchema = z.object({
    sport: z.string().min(1, "Sport is required"),
    homeTeam: z.string().min(1, "Home team is required"),
    awayTeam: z.string().min(1, "Away team is required"),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional()
}).superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "endTime must be chronologically after startTime",
            path: ["endTime"]
        });
    }
});

/**
 * Validates update score payload
 */
export const updateScoreSchema = z.object({
    homeScore: z.coerce.number().int().nonnegative(),
    awayScore: z.coerce.number().int().nonnegative()
});
