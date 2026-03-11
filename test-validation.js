import {
    listMatchesQuerySchema,
    matchIdParamSchema,
    createMatchSchema,
    updateScoreSchema,
    MATCH_STATUS
} from './src/validation/matches.js';

console.log('--- Testing listMatchesQuerySchema ---');
console.log('Valid:', listMatchesQuerySchema.safeParse({ limit: '10' }));
console.log('Invalid (max):', listMatchesQuerySchema.safeParse({ limit: '101' }));
console.log('Invalid (non-pos):', listMatchesQuerySchema.safeParse({ limit: '0' }));

console.log('--- Testing MATCH_STATUS ---');
console.log(MATCH_STATUS);

console.log('--- Testing matchIdParamSchema ---');
console.log('Valid:', matchIdParamSchema.safeParse({ id: '1' }));
console.log('Invalid:', matchIdParamSchema.safeParse({ id: '-1' }));

console.log('--- Testing createMatchSchema ---');
const validMatch = {
    sport: 'soccer',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    startTime: '2023-01-01T10:00:00Z',
    endTime: '2023-01-01T12:00:00Z',
    homeScore: '0',
    awayScore: '0'
};
console.log('Valid:', createMatchSchema.safeParse(validMatch).success);

const invalidMatchTime = {
    ...validMatch,
    startTime: '2023-01-01T12:00:00Z',
    endTime: '2023-01-01T10:00:00Z'
};
console.log('Invalid (time order):', createMatchSchema.safeParse(invalidMatchTime).error?.issues[0]?.message);

const invalidISODate = {
    ...validMatch,
    startTime: 'not-a-date'
};
console.log('Invalid (ISO):', createMatchSchema.safeParse(invalidISODate).error?.issues[0]?.message);

console.log('--- Testing updateScoreSchema ---');
console.log('Valid:', updateScoreSchema.safeParse({ homeScore: '1', awayScore: '2' }));
console.log('Invalid:', updateScoreSchema.safeParse({ homeScore: -1, awayScore: '2' }));
