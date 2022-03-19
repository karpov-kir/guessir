// The @nestjs/common package uses axios as a dependency and it uses `AbortSignal` from the DOM library. In order to avoid including
// the DOM library we can provide this interface.
// TODO remove it once the @nestjs/common package does not need AbortSignal anymore (check package-lock.json).
interface AbortSignal {
  [key: string | number | symbol]: any;
}
