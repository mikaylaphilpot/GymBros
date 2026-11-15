module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": ["@swc/jest"],
  },
};