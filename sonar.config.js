module.exports = {
  'sonar.typescript.lcov.reportPaths': 'coverage/lcov.info',
  'sonar.language': 'ts',
  'sonar.sources': ['packages/src/backend', 'packages/src/web'].join(','),
  'sonar.tests': ['packages/src/backend', 'packages/src/web'].join(','),
  'sonar.exclusions': [].join(','),
  'sonar.coverage.exclusions': [].join(','),
};
