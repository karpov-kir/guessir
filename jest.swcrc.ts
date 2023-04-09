export function getSwcConfig(evn: Record<string, string> = {}) {
  return {
    $schema: 'https://json.schemastore.org/swcrc',
    jsc: {
      parser: {
        syntax: 'typescript',
        decorators: true,
      },
      transform: {
        decoratorMetadata: true,
        optimizer: {
          globals: {
            // TODO: remove it once Jest is migrated to ESM: https://jestjs.io/docs/ecmascript-modules
            vars: Object.keys(evn).reduce((accumulator, key) => {
              return {
                ...accumulator,
                [`import.meta.env.${key}`]: `"${evn[key]}"`,
              };
            }, {}),
          },
        },
      },
    },
    // Migrate to ESM once Jest supports it properly: https://jestjs.io/docs/ecmascript-modules
    module: {
      type: 'commonjs',
    },
  };
}
