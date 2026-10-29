// This hook retries a relative import that Node cannot resolve, first with `.js` and then with `/index.js` appended.
// The compiled backend imports its own modules without a file extension, as its TypeScript sources do.
// Node's ESM resolver requires the extension.
import { registerHooks } from 'node:module';

const suffixes = ['.js', '/index.js'];
const retriedCodes = ['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT'];

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const isRelative = specifier.startsWith('./') || specifier.startsWith('../');

      if (!isRelative || !retriedCodes.includes(error.code)) {
        throw error;
      }

      for (const suffix of suffixes) {
        try {
          return nextResolve(`${specifier}${suffix}`, context);
        } catch {
          // Not this suffix, so the loop tries the next one
        }
      }

      throw error;
    }
  },
});
