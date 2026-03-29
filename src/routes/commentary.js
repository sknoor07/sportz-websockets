import { Router } from 'express';
import { db } from '../db/db.js';
import { commentary } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { matchIdParamSchema } from '../validation/matches.js';
import { createCommentarySchema, listCommentaryQuerySchema } from '../validation/commentary.js';

export const commentaryRouter = Router({ mergeParams: true });
commentaryRouter.get('/', async (req, res) => {
    try {
        const paramValidation = matchIdParamSchema.safeParse(req.params);
        if (!paramValidation.success) {
            return res.status(400).json({ 
                error: "Invalid match ID", 
                details: paramValidation.error.errors 
            });
        }

        const queryValidation = listCommentaryQuerySchema.safeParse(req.query);
        if (!queryValidation.success) {
            return res.status(400).json({ 
                error: "Invalid query parameters", 
                details: queryValidation.error.errors 
            });
        }

        const matchId = paramValidation.data.id;
        const limitCount = queryValidation.data.limit ?? 100;
        const MAX_LIMIT = 100;
        const finalLimit = Math.min(limitCount, MAX_LIMIT);

        const results = await db.select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(finalLimit);

        return res.status(200).json({
            message: "Commentary List",
            data: results
        });
    } catch (error) {
        console.error("Error fetching commentary list:", error);
        return res.status(500).json({ 
            error: "Internal server error", 
            details: error.message 
        });
    }
});

commentaryRouter.post('/', async (req, res) => {
    try {
        const paramValidation = matchIdParamSchema.safeParse(req.params);
        if (!paramValidation.success) {
            return res.status(400).json({ 
                error: "Invalid match ID", 
                details: paramValidation.error.errors 
            });
        }

        const bodyValidation = createCommentarySchema.safeParse(req.body);
        if (!bodyValidation.success) {
            return res.status(400).json({ 
                error: "Invalid payload", 
                details: bodyValidation.error.errors 
            });
        }

        const matchId = Number(paramValidation.data.id);
        const commentaryData = bodyValidation.data;

        const [newCommentary] = await db.insert(commentary).values({
            matchId,
            ...commentaryData
        }).returning();

        if(res.app.locals.broadcastCommentary){
            res.app.locals.broadcastCommentary(matchId,newCommentary);
        }

        return res.status(201).json({ 
            message: "Commentary created successfully", 
            commentary: newCommentary 
        });
    } catch (error) {
        console.error("Error creating commentary:", error);
        return res.status(500).json({ 
            error: "Internal server error", 
            details: error.message 
        });
    }
});

export default commentaryRouter;
