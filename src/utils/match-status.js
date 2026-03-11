import { MATCH_STATUS } from '../validation/matches.js';

/**
 * Determines the current status of a match based on its start and end times.
 * @param {string|Date} startTime - The start time of the match.
 * @param {string|Date} endTime - The end time of the match.
 * @param {Date} [now=new Date()] - The current time.
 * @returns {string|null} - The match status or null if times are invalid.
 */
export function getMatchStatus(startTime, endTime, now = new Date()) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
    }

    if (now < start) {
        return MATCH_STATUS.SCHEDULED;
    }

    if (now >= end) {
        return MATCH_STATUS.FINISHED;
    }

    return MATCH_STATUS.LIVE;
}

/**
 * Syncs the match status if it has changed.
 * @param {Object} match - The match object containing status, startTime, and endTime.
 * @param {Function} updateStatus - Async function to update the status in the database.
 * @returns {Promise<string>} - The current or updated status.
 */
export async function syncMatchStatus(match, updateStatus) {
    const nextStatus = getMatchStatus(match.startTime, match.endTime);
    if (!nextStatus) {
        return match.status;
    }
    if (match.status !== nextStatus) {
        await updateStatus(nextStatus);
        match.status = nextStatus;
    }
    return match.status;
}
