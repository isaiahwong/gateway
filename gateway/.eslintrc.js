module.exports = {

  globals: {
    __DEV__: true,
    __PROD__: true,
    __TEST__: true
  },

  "env": {
    "node": true,
  },
  "extends": "airbnb",
  "rules": {
    "eol-last": 0,
    "no-param-reassign": 0,
    "no-trailing-spaces": 0,
    "no-underscore-dangle": 0,
    "no-return-await": 0,
    "no-restricted-syntax": 0,
    "one-var": 0,
    "no-plusplus": 0,
    "import/prefer-default-export": 0,
    "padded-blocks": 0,
    "function-paren-newline": 0,
    "quote-props": 0,
    "guard-for-in": 0,
    "prefer-rest-params": 0,
    "eqeqeq": 0,
    "import/no-extraneous-dependencies": 0,
    "max-len": 0,
    "no-prototype-builtins": 0,
    "no-return-assign": 0,
    "class-methods-use-this": 0,
    "no-use-before-define": 0,
    "func-names": 0,
    "one-var-declaration-per-line": 0,
    "dot-notation": 0,
    "global-require": 0,
    "object-shorthand": 0,
    "no-confusing-arrow": 0,
    "no-continue": 0,
    "comma-dangle": 0,
    "no-mixed-operators": 0,
    "brace-style": [2, "stroustrup", { "allowSingleLine": true }],
    "prefer-destructuring": ["error", {
      "VariableDeclarator": {
        "array": false,
        "object": true
      },
      "AssignmentExpression": {
        "array": false,
        "object": false
      }
    }, {
        "enforceForRenamedProperties": false
      }]
  }
};