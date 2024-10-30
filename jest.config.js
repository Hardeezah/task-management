// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js'],
  moduleDirectories: ['node_modules', 'src'],
  testMatch: ['**/tests/**/*.test.ts'],
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
};
