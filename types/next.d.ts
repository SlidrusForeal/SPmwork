// types/next.d.ts
import "next";

declare module "next" {
  interface NextApiRequest {
    user?: {
      id: string;
      username: string;
    };
  }
}
