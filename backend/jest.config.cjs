module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.cjs'],
  roots: ['<rootDir>/tests'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@programme/contracts$': '<rootDir>/../packages/contracts/src/index.ts',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  transform: { '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: { module: 'ESNext' } }] },
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/seeds/**'],
};
