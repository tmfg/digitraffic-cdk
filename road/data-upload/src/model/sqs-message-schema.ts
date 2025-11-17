import z from "zod/v4";

const messageVersionSchema = z.object({
  messageContent: z.string(),
  messageType: z.enum(["datex2"]),
  typeVersion: z.string(),
}).strict();

const messageSchema = z.object({
  messageId: z.string(),
  date: z.coerce.date(),
  messageVersions: z.array(messageVersionSchema),
}).strict();

export type UpdateObject = z.infer<typeof messageSchema>;
