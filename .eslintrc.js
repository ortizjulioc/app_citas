module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'plugin:import/recommended', 'prettier'],
  rules: {
    'jsx-a11y/alt-text': 'off',
    'react/display-name': 'off',
    'react/no-children-prop': 'off',
    '@next/next/no-img-element': 'off',
    '@next/next/no-page-custom-font': 'off',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',

    // REGLA ACTUALIZADA PARA NEXT 16: Asegura el uso de await en APIs dinámicas
    '@next/next/no-sync-scripts': 'error',

    'lines-around-comment': [
      'error',
      {
        beforeBlockComment: true,
        beforeLineComment: true,
        allowBlockStart: true,
        allowObjectStart: true,
        allowArrayStart: true
      }
    ],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'any', prev: 'export', next: 'export' },
      { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
      { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
      { blankLine: 'always', prev: '*', next: ['function', 'multiline-const', 'multiline-block-like'] },
      { blankLine: 'always', prev: ['function', 'multiline-const', 'multiline-block-like'], next: '*' }
    ],
    'newline-before-return': 'error',
    'import/newline-after-import': ['error', { count: 1 }],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', ['internal', 'parent', 'sibling', 'index'], ['object', 'unknown']],
        pathGroups: [
          { pattern: 'react', group: 'external', position: 'before' },
          { pattern: 'next/**', group: 'external', position: 'before' },
          { pattern: '~/**', group: 'external', position: 'before' },
          { pattern: '@/**', group: 'internal' }
        ],
        pathGroupsExcludedImportTypes: ['react', 'type'],
        'newlines-between': 'always-and-inside-groups'
      }
    ],

    // CAMBIO IMPORTANTE: @typescript-eslint/ban-types está obsoleta en versiones nuevas.
    // Si usas los plugins más recientes de la v16, usa @typescript-eslint/no-restricted-types
    '@typescript-eslint/no-restricted-types': [
      'error',
      {
        types: {
          Function: 'Use a specific function type instead',
          Object: 'Use object instead',
          Boolean: 'Use boolean instead',
          Number: 'Use number instead',
          String: 'Use string instead',
          Symbol: 'Use symbol instead'
        }
      }
    ]
  },
  settings: {
    react: { version: 'detect' },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    },
    'import/resolver': {
      node: {},
      typescript: { project: './tsconfig.json' }
    }
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', 'src/iconify-bundle/*'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ]
}
