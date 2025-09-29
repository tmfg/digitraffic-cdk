import * as z from "zod";

export const Datex2UpdateObjectSchema = z.strictObject({
  datexIIVersions: z.array(
    z.strictObject({
      // TODO: remove optional
      type: z.string().optional(),
      version: z.string(),
      message: z.string(),
    }),
  ),
});

export type Datex2UpdateObject = z.infer<typeof Datex2UpdateObjectSchema>;
