import { Router } from 'express';
import { db } from '../db/db.js';
import { matches } from '../db/schema.js';
import { createMatchSchema, listMatchesQuerySchema } from '../validation/matches.js';
import { getMatchStatus } from '../utils/match-status.js';
import { desc } from 'drizzle-orm';

export const matchRouter= Router();

export default matchRouter;

matchRouter.get('/',async (req,res)=>{  
    const parsed=listMatchesQuerySchema.safeParse(req.query);
    const Max_LIMIT=100;
    if(!parsed.success){
        return res.status(400).json({error:"Invalid Payload",details: JSON.stringify(parsed.error.issues)});
    }
    const limit=Math.min(parsed.data.limit??50,Max_LIMIT);
    try{ 
        const data= await db.select().from(matches).orderBy(desc(matches.createdAt)).limit(limit);
        return res.status(200).json({message:'Matches List',data});
    }catch(e){
        return res.status(500).json({error:"Failed to List matches",details:JSON.stringify(e.message)});
    }
});

matchRouter.post('/',async (req,res)=>{
    const parsed=createMatchSchema.safeParse(req.body);
    if(!parsed.success){
        return res.status(400).json({error:"Invaid Payload",details: JSON.stringify(parsed.error.issues)});
    }
    const {data:{startTime, endTime,homeScore,awayScore}}=parsed;
    try{
        const [event]= await db.insert(matches).values({...parsed.data,startTime:new Date(startTime),endTime:new Date(endTime),homeScore:homeScore??0,awayScore:awayScore??0,status:getMatchStatus(startTime,endTime)}).returning();
        return res.status(201).json({message:'Match created successfully',event});
    }catch(e){
        return res.status(500).json({error:"Internal server error",details:JSON.stringify(e)});
    }
});