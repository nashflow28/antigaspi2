module.exports = {
  root: true,
  plugins: ['jest'],
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      env: {
        'jest/globals': true,
      },
      rules: {
        'jest/no-identical-title': 'error',
        'jest/expect-expect': 'warn',
      },
    },
  ],
}
