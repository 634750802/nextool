import { describe } from 'node:test';
import { ZodError } from 'zod';
import { ZodErrorParser } from './clientErrorParsers/zodErrorParser';
import { createClientHandleErrors } from './createClientHandleErrors';

describe('createClientHandleErrors', () => {
  const expectError = (promise: Promise<any>) => promise
    .then(() => Promise.reject('should not resolve'))
    .catch(e => e);

  const handleErrors = createClientHandleErrors([
    ZodErrorParser,
  ]);

  it('handle parser', async () => {
    const error = await expectError(handleErrors(Response.json({
      name: 'ZodError',
      detail: {
        issues: [{ code: 'custom', path: [], message: 'any' }],
      },
    }, { status: 422 })));
    expect(error).toBeInstanceOf(ZodError);
  });

  it('handle plain json', async () => {
    const error = await expectError(handleErrors(Response.json({
      message: 'some message',
    }, { status: 400 })));

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('some message');
  });

  it('handle plain text', async () => {
    const error = await expectError(handleErrors(new Response('some message', { status: 400 })));

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('400 some message');
  });

  it('handle unknown json', async () => {
    const error = await expectError(handleErrors(Response.json({ unknown: 'some message' }, { status: 400 })));

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('400 {"unknown":"some message"}');
  });

  it('handle empty', async () => {
    const error = await expectError(handleErrors(new Response(null, { status: 400, statusText: 'Bad Request' })));

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('400 Bad Request');
  });

  it('does not affect good request', async () => {
    const response = Response.json({});
    const result = await handleErrors(response);

    expect(result).toStrictEqual(response);
  });
});
