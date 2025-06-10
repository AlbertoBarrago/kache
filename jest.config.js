// jest.config.js
export default {
    // Use the default test environment (Node.js)
    testEnvironment: 'node',

    // Explicitly tell Jest to treat .js files as ES Modules
    // extensionsToTreatAsEsm: ['.js'],

    // If you have specific transform needs (e.g., using Babel for other syntax),
    // you might need a transform config, but for standard ESM, extensionsToTreatAsEsm
    // is often sufficient.
    // transform: {
    //   '^.+\\.js$': ['babel-jest', { /* babel options */ }],
    // },

    // Ensure node_modules are ignored for transformation (this is the default)
    // transformIgnorePatterns: ['/node_modules/'],

    // You already have setupFilesAfterEnv configured implicitly by Jest-picking -
    // up test/setup.js if it existed.
    // If you add one later,
    // you'd list it here.
    // setupFilesAfterEnv: [],

    // If you need module name mapping (e.g., for CSS imports in component tests),
    // configure it here. Not needed for this specific error.
    // moduleNameMapper: {},
};