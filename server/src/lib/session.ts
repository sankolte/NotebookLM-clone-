import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import type { IncomingHttpHeaders } from "node:http";

export async function getSession(headers: IncomingHttpHeaders) {
  return await auth.api.getSession({
    headers: fromNodeHeaders(headers),
  });
}

export type SessionResult = Awaited<ReturnType<typeof getSession>>;
export type ActiveSession = NonNullable<SessionResult>;
export type User = ActiveSession["user"];
export type Session = ActiveSession["session"];
