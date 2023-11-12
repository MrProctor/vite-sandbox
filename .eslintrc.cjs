module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    "plugin:react/recommended",
    "plugin:import/recommended",
    "prettier",
    "plugin:import/typescript"
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    "ecmaFeatures": {
      "jsx": true,
      "modules": true
    },
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": "tsconfig.json"
  },
  plugins: ['react-refresh', 'react', "@typescript-eslint", "react-hooks", "import"],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    "indent": [
      "error",
      4,
      {
        "SwitchCase": 1
      }
    ],
    "linebreak-style": "off",
    "no-debugger":"off",
    "quotes": ["error", "single"],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "off",
    "eslint-disable-next-line": "off",
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "react/no-unknown-property": "off",
    "react/jsx-filename-extension": [
      1,
      {
        "extensions": [".tsx"]
      }
    ],
    "import/prefer-default-export": "off",
    "import/named": "off",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "ts": "never",
        "tsx": "never"
      }
    ]
  },
  settings: {
    "import/resolver": {
      "node": {
        "extensions": [".jsx", ".js", ".ts", ".tsx"]
      },
      "typescript": {
        "alwaysTryTypes": true
      }
    }
  }
}
