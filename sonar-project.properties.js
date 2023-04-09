export default {
  'sonar.projectKey': 'Guessir',

  'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
  'sonar.testExecutionReportPaths': 'coverage/test-report.xml',

  'sonar.sources': ['packages/backend/src', 'packages/shared/src', 'packages/web/src'].join(','),
  // SonarQube supports limited wildcards (https://docs.sonarqube.org/latest/project-administration/narrowing-the-focus).
  // Exclude test files from analysis.
  'sonar.exclusions': ['**/*.test.*', '**/*.spec.*', '**/*.e2e-spec.*'].join(','),

  'sonar.coverage.exclusions': [
    'packages/backend/src/migrations/*',
    'packages/backend/src/dbUtils.ts',
    'packages/backend/src/server.ts',
    'packages/backend/src/MainModule.ts',
    'packages/backend/src/index.ts',
    'packages/web/src/testUtils/*',
    'packages/web/src/index.ts',
  ].join(','),
};
