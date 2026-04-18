import { prisma } from '../src/config/database';

beforeAll(async () => {
  try {
    await prisma.$connect();
  } catch {
    // DB not available — unit tests with mocks don't need it
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch {
    // Already disconnected or never connected
  }
});
