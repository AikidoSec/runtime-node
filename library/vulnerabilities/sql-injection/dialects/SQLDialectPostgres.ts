/* eslint-disable max-lines-per-function */
import { SQLDialect } from "./SQLDialect";

export class SQLDialectPostgres implements SQLDialect {
  getDangerousStrings(): string[] {
    return [
      // https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-DOLLAR-QUOTING
      "$",
    ];
  }

  getKeywords(): { keyword: string; ignoreExact: boolean }[] {
    return [
      // https://www.postgresql.org/docs/current/sql-set.html
      { keyword: "CLIENT_ENCODING", ignoreExact: false },
    ];
  }
}
