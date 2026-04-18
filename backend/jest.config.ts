import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  clearMocks: true,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { rootDir: '.', types: ['jest', 'node'] } }],
  },
};

export default config;
