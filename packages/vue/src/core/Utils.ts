export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = a.length; i-- !== 0; ) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    if ((a as object).valueOf !== Object.prototype.valueOf) {
      return (a as object).valueOf() === (b as object).valueOf();
    }

    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    const keys = Object.keys(objA);
    if (keys.length !== Object.keys(objB).length) return false;

    for (let i = keys.length; i-- !== 0; ) {
      if (!Object.prototype.hasOwnProperty.call(objB, keys[i])) return false;
    }
    for (let i = keys.length; i-- !== 0; ) {
      if (!deepEqual(objA[keys[i]], objB[keys[i]])) return false;
    }
    return true;
  }

  // true if both NaN
  return a !== a && b !== b;
}

let uniqueId = 0;

export function getUniqueId(): number {
  return ++uniqueId;
}

export function getNestedValue(object: Record<string, unknown>, property: string): unknown {
  if (property.indexOf('.') === -1) {
    return object[property];
  }

  const split = property.split('.');
  let current: unknown = object;
  for (let index = 0; index < split.length - 1; index++) {
    current = (current as Record<string, unknown>)[split[index]];
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
  }

  return (current as Record<string, unknown>)[split[split.length - 1]];
}
