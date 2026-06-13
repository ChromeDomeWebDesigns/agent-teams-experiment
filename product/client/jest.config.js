module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': 'vue-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  moduleFileExtensions: ['js', 'vue', 'json'],
  transformIgnorePatterns: ['/node_modules/(?!(firebase|@firebase)/)'],
  testPathIgnorePatterns: ['/node_modules/', '/.nuxt/'],
  collectCoverageFrom: ['store/**/*.js', 'lib/**/*.js', 'components/**/*.vue'],
  // Tell vue-jest to skip style block compilation — SCSS variables from
  // assets/styles/app.scss are not available in the Jest transform context
  // and would cause "Undefined variable" errors. Styles are irrelevant to tests.
  globals: {
    'vue-jest': {
      style: false,
    },
  },
}
