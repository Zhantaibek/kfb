import type { FieldError, FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { ZodType, ZodTypeDef } from 'zod';

/**
 * Резолвер react-hook-form для схем zod 3.
 * Свой, а не из @hookform/resolvers: в монорепозитории тот пакет подхватывает zod 4 бэкенда.
 */
export function zodResolver<Output extends FieldValues, Input extends FieldValues = Output>(
  schema: ZodType<Output, ZodTypeDef, Input>,
): Resolver<Input, unknown, Output> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors: Record<string, unknown> = {};
    for (const issue of result.error.issues) {
      // Как в @hookform/resolvers: на поле — первая ошибка, путь вида a.b.0 раскладываем во вложенные объекты.
      let node = errors;
      issue.path.forEach((key, index) => {
        const name = String(key);
        if (index === issue.path.length - 1) {
          if (!node[name]) node[name] = { type: issue.code, message: issue.message } satisfies FieldError;
          return;
        }
        node[name] = (node[name] as Record<string, unknown> | undefined) ?? {};
        node = node[name] as Record<string, unknown>;
      });
      if (!issue.path.length && !errors.root) errors.root = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors: errors as FieldErrors<Input> };
  };
}
