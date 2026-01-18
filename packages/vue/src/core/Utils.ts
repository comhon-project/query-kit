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
