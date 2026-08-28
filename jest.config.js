module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/apps/backend/tsconfig.json' }] },
  roots: ['<rootDir>/apps/backend/test'],
  setupFilesAfterEnv: ['<rootDir>/apps/backend/test/jest.setup.ts'],
  collectCoverageFrom: ['apps/backend/src/shared/validation.ts'],
  coverageThreshold: { global: { lines: 80, statements: 80, functions: 80, branches: 70 } },
  clearMocks: true,
};