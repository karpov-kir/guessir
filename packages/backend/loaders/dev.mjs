import { register } from 'node:module';
import { setUncaughtExceptionCaptureCallback } from 'node:process';
import { pathToFileURL } from 'node:url';

// https://github.com/TypeStrong/ts-node/issues/2026#issuecomment-1807238303
// TODO: Remove this once the issue is resolved
setUncaughtExceptionCaptureCallback((error) => {
  // eslint-disable-next-line no-undef
  console.log('Uncaught exception in the dev loader');
  // eslint-disable-next-line no-undef
  console.error(error);
});

register('ts-node/esm', pathToFileURL('./'));
register('extensionless', pathToFileURL('./'));
