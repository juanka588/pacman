module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['./tests/helpers/loadGlobals.js'],
  testMatch: ['**/tests/**/*.test.js'],
};
