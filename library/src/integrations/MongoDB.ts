import { isDeepStrictEqual } from "node:util";
import { Hook } from "require-in-the-middle";
import { wrap } from "shimmer";
import { isPlainObject } from "../isPlainObject";
import { getContext, RequestContext } from "../requestContext";
import { Integration } from "./Integration";

type DetectionResult =
  | { injection: true; source: "query" }
  | { injection: true; source: "body" }
  | { injection: true; source: "headers" }
  | { injection: false };

function friendlyName(source: "query" | "body" | "headers"): string {
  switch (source) {
    case "query":
      return "query parameters";
    case "body":
      return "body";
    case "headers":
      return "headers";
  }
}

const COMPARISON_OPERATORS = [
  "$eq",
  "$gt",
  "$gte",
  "$in",
  "$lt",
  "$lte",
  "$ne",
  "$nin",
];

// TODO: Expand support for $and, $or, $nor, $not
function findInjectionInObject(object: unknown, filter: unknown): boolean {
  if (!isPlainObject(object) || !isPlainObject(filter)) {
    return false;
  }

  const fields = Object.keys(filter);
  for (const field of fields) {
    const value = filter[field];

    if (
      isPlainObject(value) &&
      Object.keys(value).length === 1 &&
      COMPARISON_OPERATORS.includes(Object.keys(value)[0]) &&
      Object.keys(object).find((key) => isDeepStrictEqual(object[key], value))
    ) {
      return true;
    }
  }

  return false;
}

export function detectInjection(
  context: RequestContext,
  filter: unknown
): DetectionResult {
  if (findInjectionInObject(context.request.body, filter)) {
    return { injection: true, source: "body" };
  }

  if (findInjectionInObject(context.request.query, filter)) {
    return { injection: true, source: "query" };
  }

  if (findInjectionInObject(context.request.headers, filter)) {
    return { injection: true, source: "headers" };
  }

  return { injection: false };
}

const OPERATIONS = ["find", "findOne", "findOneAndUpdate", "findOneAndDelete"];

// TODO: Support more methods
export class MongoDB implements Integration {
  setup(): void {
    new Hook(["mongodb"], (exports) => {
      OPERATIONS.forEach((operation) => {
        wrap(exports.Collection.prototype, operation, function (original) {
          return function () {
            const context = getContext();

            if (!context) {
              return original.apply(this, arguments);
            }

            if (arguments.length > 0 && isPlainObject(arguments[0])) {
              const filter = arguments[0];
              const result = detectInjection(context, filter);

              if (result.injection) {
                const message = `Blocked NoSQL injection for MongoDB.Collection.${operation}(...), please check ${friendlyName(result.source)}!`;
                context.aikido.report({
                  source: result.source,
                  message: message,
                  context: context,
                  stack: new Error().stack || "",
                  metadata: {
                    db: this.dbName,
                    collection: this.collectionName,
                    operation: operation,
                    filter: filter,
                  },
                });

                throw new Error(message);
              }
            }

            return original.apply(this, arguments);
          };
        });
      });

      return exports;
    });
  }
}