import * as z from "zod";

export const Datex2UpdateObjectSchema = z.strictObject({
  datexIIVersions: z.array(
    z.strictObject({
      type: z.string(),
      version: z.string(),
      message: z.string(),
    }),
  ),
});

export type Datex2UpdateObject = z.infer<typeof Datex2UpdateObjectSchema>;
