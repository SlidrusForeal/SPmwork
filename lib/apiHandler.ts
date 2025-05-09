// lib/apiHandler.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

export function apiHandler(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      console.error(err);
      const status = err.statusCode || 500;
      res
        .status(status)
        .json({ error: err.message || "Internal Server Error" });
    }
  };
}
