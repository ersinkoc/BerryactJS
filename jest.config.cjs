module.exports = {
  testEnvironment: 'jsdom',

  // Ignore dist and build directories
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/node_modules/'
  ],

  // Module resolution
  moduleNameMapper: {
    '^@oxog/berryact$': '<rootDir>/src/index.js',
    '^@oxog/berryact/(.*)$': '<rootDir>/src/$1'
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/build/**',
    '!src/devtools/**'
  ],
  
  // Coverage thresholds (reduced for now)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Verbose output
  verbose: true,
  
  // Handle ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ]
};