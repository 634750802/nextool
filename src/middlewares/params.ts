import { notFound } from 'next/navigation';
import { type AnyZodObject, z, type ZodEffects } from 'zod';
import { type HandlerContextualMiddleware, withDocGen } from '../defineHandler';
import { mutateOperationDoc } from '../openapi';
import { parseParamsDict } from '../schema/parseParamsDict';

export function params<Z extends AnyZodObject | ZodEffects<AnyZodObject, unknown, unknown>> (schema: Z): HandlerContextualMiddleware<'params', z.infer<Z>> {
  const middleware: HandlerContextualMiddleware<'params', z.infer<Z>> = (_, context) => {
    try {
      return parseParamsDict(context.params, schema);
    } catch {
      notFound();
    }
  };
  middleware.field = 'params';

  return withDocGen(middleware, () => {
    mutateOperationDoc(operation => {
      operation.request = { ...operation.request, params: schema };
    });
  });
}
