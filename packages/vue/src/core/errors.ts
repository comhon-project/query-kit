export class PropertyNotFoundError extends Error {
  constructor(
    public readonly property: string,
    public readonly schemaId: string,
  ) {
    super(`Property "${property}" not found in schema "${schemaId}"`);
  }
}
