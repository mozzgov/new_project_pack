module.exports = {
  extends: ['stylelint-config-standard-scss'],
  plugins: ['stylelint-order'],
  overrides: [
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss'
    }
  ],
  rules: {
    'selector-class-pattern': null,
    'order/properties-alphabetical-order': true,
    'color-hex-length': 'short',
    'font-family-no-missing-generic-family-keyword': null,
    'length-zero-no-unit': true
  }
};

