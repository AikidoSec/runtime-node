import * as t from "tap";
import { Agent } from "../agent/Agent";
import { ReportingAPIForTesting } from "../agent/api/ReportingAPIForTesting";
import { runWithContext, type Context } from "../agent/Context";
import { LoggerNoop } from "../agent/logger/LoggerNoop";
import { SQLite3 } from "./SQLite3";
import { promisify } from "util";

const dangerousContext: Context = {
  remoteAddress: "::1",
  method: "POST",
  url: "http://localhost:4000",
  query: {},
  headers: {},
  body: {
    myTitle: `-- should be blocked`,
  },
  cookies: {},
  routeParams: {},
  source: "express",
  route: "/posts/:id",
};

const dangerousPathContext: Context = {
  remoteAddress: "::1",
  method: "POST",
  url: "http://localhost:4000",
  query: {},
  headers: {},
  body: {
    myTitle: `/tmp/insecure`,
  },
  cookies: {},
  routeParams: {},
  source: "express",
  route: "/posts/:id",
};

const safeContext: Context = {
  remoteAddress: "::1",
  method: "POST",
  url: "http://localhost:4000/",
  query: {},
  headers: {},
  body: {},
  cookies: {},
  routeParams: {},
  source: "express",
  route: "/posts/:id",
};

t.test("it detects SQL injections", async () => {
  const agent = new Agent(
    true,
    new LoggerNoop(),
    new ReportingAPIForTesting(),
    undefined,
    "lambda"
  );
  agent.start([new SQLite3()]);

  const sqlite3 = require("sqlite3");

  const db = new sqlite3.Database(":memory:");
  const run = promisify(db.run.bind(db));
  const all = promisify(db.all.bind(db));
  const backup = promisify(db.backup.bind(db));
  const close = promisify(db.close.bind(db));

  try {
    await run("CREATE TABLE IF NOT EXISTS cats (petname varchar(255));");
    await run("DELETE FROM cats;");
    const rows = await all("SELECT petname FROM `cats`;");
    t.same(rows, []);

    const error = await t.rejects(async () => {
      await runWithContext(dangerousContext, () => {
        return run("SELECT 1;-- should be blocked");
      });
    });
    if (error instanceof Error) {
      t.same(
        error.message,
        "Aikido firewall has blocked an SQL injection: sqlite3.run(...) originating from body.myTitle"
      );
    }

    const error2 = await t.rejects(async () => {
      await runWithContext(dangerousContext, () => {
        return run("");
      });
    });
    if (error2 instanceof Error) {
      t.same(error2.message, "SQLITE_MISUSE: not an error");
    }

    await runWithContext(safeContext, () => {
      return run("SELECT 1;-- This is a comment");
    });

    await runWithContext(safeContext, () => {
      return all("SELECT 1");
    });

    const error3 = await t.rejects(async () => {
      await runWithContext(dangerousPathContext, () => {
        return backup("/tmp/insecure");
      });
    });
    if (error3 instanceof Error) {
      t.same(
        error3.message,
        "Aikido firewall has blocked a path traversal attack: sqlite3.backup(...) originating from body.myTitle"
      );
    }
  } catch (error: any) {
    t.fail(error);
  } finally {
    await close();
  }
});
