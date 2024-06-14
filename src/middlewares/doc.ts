import type { RouteConfig } from '@asteasolutions/zod-to-openapi/dist/openapi-registry';
import { docGenOnly } from '../defineHandler';
import { mutateOperationDoc } from '../openapi';

export function doc (doc: Pick<RouteConfig, 'description' | 'summary' | 'operationId' | 'tags' | 'externalDocs' | 'deprecated'>) {
  return docGenOnly(() => {
    mutateOperationDoc(operation => {
      Object.assign(operation, doc);
    });
  });
}
