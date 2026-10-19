/**
 * Shared routine form constants.
 *
 * Every week in an exam routine has exactly SUBJECTS_PER_WEEK subjects, each
 * worth MARKS_PER_SUBJECT, so a week's printed total is always
 * TOTAL_MARKS_PER_WEEK. These are enforced by the write endpoints (create,
 * add-weeks, update) and mirrored in the frontend at
 * bright_academy/src/constant/routine.constant.ts
 */
export const MARKS_PER_SUBJECT = 25;

export const SUBJECTS_PER_WEEK = 4;

export const TOTAL_MARKS_PER_WEEK = MARKS_PER_SUBJECT * SUBJECTS_PER_WEEK;