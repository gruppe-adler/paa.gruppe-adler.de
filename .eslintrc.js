module.exports = {
    root: true,
    extends: [
        'standard',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript'
    ],
    plugins: ['@typescript-eslint', 'import'],
    rules: {
        indent: ['error', 4],
        semi: 'off',
        '@typescript-eslint/semi': ['error'],
        'no-extra-semi': 'off',
        'space-before-function-paren': 'off',
        'no-dupe-class-members': 'off',
        'no-console': 'error',
        'no-debugger': 'off',
        'linebreak-style': 'off',
        'comma-dangle': ['warn', 'never'],
        'arrow-parens': ['warn', 'as-needed'],
        'lines-between-class-members': [
            'warn',
            'always',
            { exceptAfterSingleLine: true }
        ],
        'object-curly-newline': 'off',
        'no-continue': 'off',
        'import/extensions': 'off',
        'import/no-cycle': 'off',
        'func-names': ['warn', 'as-needed'],
        'no-loop-func': 'off',
        'no-new': 'off'
    },
    settings: {
        'import/resolver': 'webpack'
    },
    parser: '@typescript-eslint/parser'
};
