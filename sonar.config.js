module.exports = {
  'sonar.typescript.lcov.reportPaths': '/github/workspace/coverage/lcov.info',
  'sonar.language': 'ts',

  'sonar.sources': ['**/packages/**/src'].join(','),

  'sonar.test.inclusions': ['**/*.(test|spec|e2e-spec).*'].join(','),
  'sonar.exclusions': [].join(','),
  'sonar.coverage.exclusions': [].join(','),
};
