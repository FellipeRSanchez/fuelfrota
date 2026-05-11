// Configure Prisma to use a temporary SQLite DB for tests
process.env.DATABASE_URL = 'file:./test-db.sqlite';

import '@testing-library/jest-dom/vitest'
