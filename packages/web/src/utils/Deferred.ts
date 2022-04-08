// https://gist.github.com/GFoley83/5877f6c09fbcfd62569c51dc91444cf0
export class Deferred<T> implements Promise<T> {
  [Symbol.toStringTag]: 'Promise';

  private _promise: Promise<T>;
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (reason: unknown) => void;
  private _state: 'pending' | 'fulfilled' | 'rejected' = 'pending';

  public get state(): 'pending' | 'fulfilled' | 'rejected' {
    return this._state;
  }

  public get promise() {
    return this._promise;
  }

  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  public then<TResult1, TResult2>(
    onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected);
  }

  public catch<TResult>(onrejected?: (reason: unknown) => TResult | PromiseLike<TResult>): Promise<T | TResult> {
    return this._promise.catch(onrejected);
  }

  public finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this._promise.finally(onfinally);
  }

  public resolve(value: T | PromiseLike<T>): void {
    this._resolve(value);
    this._state = 'fulfilled';
  }

  public reject(reason: unknown): void {
    this._reject(reason);
    this._state = 'rejected';
  }
}
