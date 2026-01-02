import { NextResponse } from "next/server";

type ErrorBody = {
  ok: false;
  error: { code: string; message: string; details?: unknown };
};

type OkBody<T> = {
  ok: true;
  data: T;
  meta?: unknown;
};

export function ok<T>(data: T, meta?: unknown, init?: ResponseInit) {
  return NextResponse.json<OkBody<T>>(
    { ok: true, data, meta },
    { status: 200, ...init },
  );
}

export function created<T>(data: T, meta?: unknown) {
  return NextResponse.json<OkBody<T>>(
    { ok: true, data, meta },
    { status: 201 },
  );
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json<ErrorBody>(
    { ok: false, error: { code: "BAD_REQUEST", message, details } },
    { status: 400 },
  );
}

export function unauthorized(message = "Unauthorized access") {
  return NextResponse.json<ErrorBody>(
    { ok: false, error: { code: "UNAUTHORIZED", message } },
    { status: 401 },
  );
}

export function forbidden(
  message = "You do not have permission to perform this action",
) {
  return NextResponse.json<ErrorBody>(
    { ok: false, error: { code: "FORBIDDEN", message } },
    { status: 403 },
  );
}

export function notFound(message = "Resource not found") {
  return NextResponse.json<ErrorBody>(
    { ok: false, error: { code: "NOT_FOUND", message } },
    { status: 404 },
  );
}

export function conflict(message: string, details?: unknown) {
  return NextResponse.json<ErrorBody>(
    { ok: false, error: { code: "CONFLICT", message, details } },
    { status: 409 },
  );
}

export function serverError(err: unknown) {
  console.error(err);
  return NextResponse.json<ErrorBody>(
    {
      ok: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong. Please try again later.",
      },
    },
    { status: 500 },
  );
}

export function readPaginationParams(url: URL) {
  const limitStr = url.searchParams.get("limit");
  const cursor = url.searchParams.get("cursor") || undefined;

  let limit = Number(limitStr ?? 10);
  if (!Number.isFinite(limit)) limit = 10;
  limit = Math.max(1, Math.min(limit, 100));

  return { limit, cursor };
}
