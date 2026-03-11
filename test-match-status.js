import { getMatchStatus } from './src/utils/match-status.js';
import { MATCH_STATUS } from './src/validation/matches.js';

const now = new Date();
const past = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
const future = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now

console.log('--- Testing getMatchStatus ---');

console.log('Scheduled (start in future):', 
    getMatchStatus(future, new Date(future.getTime() + 10000), now) === MATCH_STATUS.SCHEDULED);

console.log('Live (start in past, end in future):', 
    getMatchStatus(past, future, now) === MATCH_STATUS.LIVE);

console.log('Finished (end in past):', 
    getMatchStatus(new Date(past.getTime() - 10000), past, now) === MATCH_STATUS.FINISHED);

console.log('Invalid (NaN):', 
    getMatchStatus('invalid', 'invalid', now) === null);
