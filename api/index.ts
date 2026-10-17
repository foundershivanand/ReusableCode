import type { IncomingMessage, ServerResponse } from "node:http";
import { handleTursoRequest } from "../turso-storage/server.ts";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return handleTursoRequest(req, res);
}
