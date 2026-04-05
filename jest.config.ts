import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const customConfig: Config = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^server-only$': '<rootDir>/__mocks__/server-only.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
};

// next/jest sets its own transformIgnorePatterns – we extend it afterwards to
// allow Jest's SWC transformer to process the ESM-only `jose` package.
const baseConfig = createJestConfig(customConfig);

export default async (): Promise<Config> => {
  const config = await (baseConfig as unknown as () => Promise<Config>)();
  return {
    ...config,
    transformIgnorePatterns: ['/node_modules/(?!(jose)/)'],
  };
};
