import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import mysql from "mysql";

const mysqlOpts = {
  host: getEnvVariable("MYSQL_ENDPOINT"),
  user: getEnvVariable("MYSQL_USERNAME"),
  password: getEnvVariable("MYSQL_PASSWORD"),
  database: getEnvVariable("MYSQL_DATABASE"),
};

const connection = mysql.createConnection(mysqlOpts);

export const query = (sql: string, values?: string[]) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, values, (error, rows) => {
      if (error) {
        reject(error);
      } else {
        resolve(rows);
      }
    });
  });
};
