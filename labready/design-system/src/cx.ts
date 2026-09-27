/** Joins class names, skipping empty values. */
export const cx = (...parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(' ');
