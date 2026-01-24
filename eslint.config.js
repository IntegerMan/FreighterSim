import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    {
        languageOptions: {
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                HTMLCanvasElement: 'readonly',
                HTMLDivElement: 'readonly',
                CanvasRenderingContext2D: 'readonly',
                MouseEvent: 'readonly',
                WheelEvent: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                ResizeObserver: 'readonly',
            },
        },
    },
    {
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
            },
        },
    },
    {
        // Test file specific settings
        files: ['**/*.test.ts', '**/*.spec.ts'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                vi: 'readonly',
            },
        },
        rules: {
            // Allow any in tests for pragmatic mocking
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'build/**', '*.min.js', '*.log', '.env*'],
    },
    {
        rules: {
            // Customize rules as needed
            'vue/multi-word-component-names': 'off', // Allow single-word component names
            // Allow unused vars that start with underscore or are 'props' (Vue pattern)
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^(_|props$)',
            }],
        },
    }
);
