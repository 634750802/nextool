import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { parseFormData } from '../schema/parseFormData';

export const enum ContentType {
  json = 'application/json',
  multipart = 'multipart/form-data',
  octetStream = 'application/octet-stream',
}

const TYPE_APPLICATION_JSON = 'application/json';

type StructuredContentType = ContentType.json | ContentType.multipart;

interface DecodeRequestBodyOptions {
  cloneStream?: boolean;
  accept?: StructuredContentType | StructuredContentType[]; // Defaults to json
}

export async function decodeRequestBody<Z extends z.ZodType> (
  request: NextRequest,
  schema: Z,
  {
    cloneStream = false,
    accept = ContentType.json,
  }: DecodeRequestBodyOptions = {},
): Promise<z.infer<Z>> {
  const contentType = matchContentType(request, accept);

  if (!contentType) {
    throw new Response(null, { status: 409 });
  }

  switch (contentType) {
    case ContentType.json: {
      const rawJson = await request.json();
      return schema.parse(rawJson);
    }
    case ContentType.multipart: {
      const rawForm = await request.formData();
      return parseFormData(rawForm, schema);
    }
  }
}

export function matchContentType<P extends ContentType> (request: Request, pattern: P | P[]): P | undefined {
  const patterns = pattern instanceof Array ? pattern : [pattern];
  const contentType = request.headers.get('Content-Type')?.trim();

  if (!contentType) {
    return undefined;
  }

  for (const pattern of patterns) {
    if (contentType === pattern || contentType.startsWith(pattern + ';')) {
      return pattern;
    }
  }
  return undefined;
}
