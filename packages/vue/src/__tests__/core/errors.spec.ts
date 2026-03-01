import { describe, it, expect } from 'vitest';

import { PropertyNotFoundError } from '@core/errors';

describe('PropertyNotFoundError', () => {
  it('extends Error', () => {
    const error = new PropertyNotFoundError('email', 'user');
    expect(error).toBeInstanceOf(Error);
  });

  it('has the correct message format', () => {
    const error = new PropertyNotFoundError('email', 'user');
    expect(error.message).toBe('Property "email" not found in schema "user"');
  });

  it('exposes the property name as a readonly field', () => {
    const error = new PropertyNotFoundError('email', 'user');
    expect(error.property).toBe('email');
  });

  it('exposes the schemaId as a readonly field', () => {
    const error = new PropertyNotFoundError('email', 'user');
    expect(error.schemaId).toBe('user');
  });

  it('works with instanceof checks', () => {
    const error = new PropertyNotFoundError('status', 'order');
    expect(error instanceof PropertyNotFoundError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('formats different property and schema names correctly', () => {
    const error = new PropertyNotFoundError('created_at', 'invoice');
    expect(error.message).toBe('Property "created_at" not found in schema "invoice"');
    expect(error.property).toBe('created_at');
    expect(error.schemaId).toBe('invoice');
  });
});
