import { type AnyZodObject, z, type ZodEffects } from 'zod';
import { type HandlerContextualMiddleware, withDocGen } from '../defineHandler';
import { mutateOperationDoc } from '../openapi';
import { parseParamsDict } from '../schema/parseParamsDict';

export function searchParams<Z extends AnyZodObject | ZodEffects<AnyZodObject, unknown, unknown>> (schema: Z): HandlerContextualMiddleware<'searchParams', z.infer<Z>> {
  const middleware: HandlerContextualMiddleware<'searchParams', z.infer<Z>> = (_, context) => parseParamsDict(context.searchParams ?? {}, schema);
  middleware.field = 'searchParams';

  return withDocGen(middleware, () => {
    mutateOperationDoc(operation => {
      operation.request = { ...operation.request, query: schema };
    });
  });
}