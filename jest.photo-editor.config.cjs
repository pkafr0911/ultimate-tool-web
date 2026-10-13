module.exports = {
  testEnvironment: '<rootDir>/tests/photo-editor/environment.cjs',
  testMatch: ['<rootDir>/src/pages/PhotoEditor/__tests__/**/*.test.ts?(x)'],
  transform: { '^.+\\.tsx?$': '<rootDir>/tests/photo-editor/transform.cjs' },
};
