import * as t from "tap";
import { detectSQLInjection } from "./detectSQLInjection";
import { SQLDialectPostgres } from "./dialects/SQLDialectPostgres";

t.test("It flags postgres bitwise operator as SQL injection", async () => {
  isSqlInjection("SELECT 10 # 12", "10 # 12");
});

t.test("It flags postgres type cast operator as SQL injection", async () => {
  isSqlInjection("SELECT abc::date", "abc::date");
});

t.test("It flags double dollar sign as SQL injection", async () => {
  isSqlInjection("SELECT $$", "$$");
  isSqlInjection("SELECT $$text$$", "$$text$$");
  isSqlInjection("SELECT $tag$text$tag$", "$tag$text$tag$");

  isNotSQLInjection("SELECT '$$text$$'", "$$text$$");
});

function isSqlInjection(sql: string, input: string) {
  t.same(detectSQLInjection(sql, input, new SQLDialectPostgres()), true, sql);
}

function isNotSQLInjection(sql: string, input: string) {
  t.same(detectSQLInjection(sql, input, new SQLDialectPostgres()), false, sql);
}