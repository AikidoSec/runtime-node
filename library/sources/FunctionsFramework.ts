import { runWithContext } from "../agent/Context";
import { Hooks } from "../agent/hooks/Hooks";
import { Wrapper } from "../agent/Wrapper";
import type { HttpFunction } from "@google-cloud/functions-framework";

export function createCloudFunctionWrapper(fn: HttpFunction): HttpFunction {
  return (req, res) => {
    runWithContext(
      {
        method: req.method,
        remoteAddress: req.ip,
        body: req.body ? req.body : undefined,
        url: req.protocol + "://" + req.get("host") + req.originalUrl,
        headers: req.headers,
        query: req.query,
        /* c8 ignore next */
        cookies: req.cookies ? req.cookies : {},
        source: "cloud-function/http",
      },
      () => {
        return fn(req, res);
      }
    );
  };
}

export class FunctionsFramework implements Wrapper {
  wrap(hooks: Hooks) {
    const functions = hooks
      .addPackage("@google-cloud/functions-framework")
      .withVersion("^3.0.0");

    functions
      .addSubject((exports) => exports)
      .modifyArguments("http", (args) => {
        if (args.length === 2 && typeof args[1] === "function") {
          const httpFunction = args[1] as HttpFunction;
          args[1] = createCloudFunctionWrapper(httpFunction);
        }

        return args;
      });
  }
}