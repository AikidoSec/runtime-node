import type { Callback, Context, Handler } from "aws-lambda";
import { getInstance } from "../agent/AgentSingleton";
import { runWithContext, Context as AgentContext } from "../agent/Context";
import { isPlainObject } from "../helpers/isPlainObject";
import { parse } from "../helpers/parseCookies";

type CallbackHandler<TEvent, TResult> = (
  event: TEvent,
  context: Context,
  callback: Callback<TResult>
) => void;

type AsyncHandler<TEvent, TResult> = (
  event: TEvent,
  context: Context
) => Promise<TResult>;

type AsyncOrCallbackHandler<TEvent, TResult> =
  | AsyncHandler<TEvent, TResult>
  | CallbackHandler<TEvent, TResult>;

function isAsyncHandler<TEvent, TResult>(
  handler: AsyncOrCallbackHandler<TEvent, TResult>
): handler is AsyncHandler<TEvent, TResult> {
  return handler.length <= 2;
}

function convertToAsyncFunction<TEvent, TResult>(
  originalHandler: AsyncOrCallbackHandler<TEvent, TResult>
): AsyncHandler<TEvent, TResult> {
  return async (event: TEvent, context: Context): Promise<TResult> => {
    if (isAsyncHandler(originalHandler)) {
      return originalHandler(event, context);
    }

    return new Promise<TResult>((resolve, reject) => {
      try {
        originalHandler(event, context, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  };
}

function normalizeHeaders(headers: Record<string, string | undefined>) {
  const normalized: Record<string, string | undefined> = {};
  for (const key in headers) {
    normalized[key.toLowerCase()] = headers[key];
  }

  return normalized;
}

function tryParseAsJSON(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

function parseBody(event: APIGatewayProxyEvent) {
  const headers = event.headers ? normalizeHeaders(event.headers) : {};

  if (!event.body || !isJsonContentType(headers["content-type"] || "")) {
    return undefined;
  }

  return tryParseAsJSON(event.body);
}

const jsonContentTypes = [
  "application/json",
  "application/vnd.api+json",
  "application/csp-report",
  "application/x-json",
];

function isJsonContentType(contentType: string) {
  return jsonContentTypes.some((type) => contentType.includes(type));
}

export type APIGatewayProxyEvent = {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string>;
  requestContext?: {
    identity?: {
      sourceIp?: string;
    };
  };
  body?: string;
};

function isProxyEvent(event: unknown): event is APIGatewayProxyEvent {
  return isPlainObject(event) && "httpMethod" in event && "headers" in event;
}

export type SQSEvent = {
  Records: Array<{
    body: string;
  }>;
};

function isSQSEvent(event: unknown): event is SQSEvent {
  return isPlainObject(event) && "Records" in event;
}

export function createLambdaWrapper(handler: Handler): Handler {
  const asyncHandler = convertToAsyncFunction(handler);
  const agent = getInstance();

  return async (event, context) => {
    let agentContext: AgentContext | undefined = undefined;

    if (isSQSEvent(event)) {
      const body: unknown[] = event.Records.map((record) =>
        tryParseAsJSON(record.body)
      ).filter((body) => body);

      agentContext = {
        url: undefined,
        method: undefined,
        remoteAddress: undefined,
        body: body,
        headers: {},
        query: {},
        cookies: {},
        source: "lambda/sqs",
      };
    } else if (isProxyEvent(event)) {
      agentContext = {
        url: undefined,
        method: event.httpMethod,
        remoteAddress: event.requestContext?.identity?.sourceIp,
        body: parseBody(event),
        headers: event.headers,
        query: event.queryStringParameters ? event.queryStringParameters : {},
        cookies: event.headers?.cookie ? parse(event.headers?.cookie) : {},
        source: "lambda/gateway",
      };
    }

    if (!agentContext) {
      return await asyncHandler(event, context);
    }

    const result = await runWithContext(agentContext, async () => {
      return await asyncHandler(event, context);
    });

    await agent?.onInvokedServerless(agentContext);

    return result;
  };
}
