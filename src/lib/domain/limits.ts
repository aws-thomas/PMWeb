// Text length limits. Server validation enforces them; forms mirror them in
// maxLength as a convenience; the database CHECK backs the name limit.
export const PROJECT_NAME_MAX = 120;
export const PROJECT_DESCRIPTION_MAX = 2000;
