/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@repo/db$': '<rootDir>/../../packages/db/src',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
