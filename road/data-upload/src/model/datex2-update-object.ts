import * as z from "zod";

export const Datex2UpdateObjectSchema = z.object({
  datexIIVersions: z.array(
    z.object({
      type: z.string(),
      version: z.string(),
      message: z.string(),
    }),
  ),
}).strict();

export type Datex2UpdateObject = z.infer<typeof Datex2UpdateObjectSchema>;
