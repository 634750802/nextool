export function isAsyncIterable (value: any): value is AsyncIterable<any> {
  if (typeof value === 'object') {
    return Symbol.asyncIterator in value;
  }
  return false;
}
