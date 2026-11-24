import * as z from 'zod/v4';
import type {CatalogRoute} from '../../catalog.ts';

export function nativeResult(route: CatalogRoute): CatalogRoute {
  return {
    ...route,
    input: source =>
      source.safeExtend({
        format: z
          .literal('native')
          .describe('Return the complete Kaiten response under result.'),
      }),
    mapArgs: args => {
      const nativeArgs = {...args};
      delete nativeArgs['format'];
      return nativeArgs;
    },
  };
}
