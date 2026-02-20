import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import type { Database } from "../model/database.js";

export const database = new Kysely<Database>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
});
