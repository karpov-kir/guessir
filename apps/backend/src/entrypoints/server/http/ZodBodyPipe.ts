import { BadRequestException, PipeTransform } from "@nestjs/common";
import type { z } from "zod";

/**
 * Parses a request body with `schema` and hands the route the parsed value.
 * The pipe answers an invalid body with a 400 that lists one message per
 * problem, in the shape Nest gives its own 400 answers.
 */
export class ZodBodyPipe<Schema extends z.ZodType> implements PipeTransform<
  unknown,
  z.output<Schema>
> {
  constructor(private readonly schema: Schema) {}

  transform(body: unknown): z.output<Schema> {
    const result = this.schema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException(
        result.error.issues.map(({ path, message }) =>
          path.length > 0 ? `${path.join(".")}: ${message}` : message,
        ),
      );
    }

    return result.data;
  }
}
