// types/next.d.ts o
import "next";

declare module "next" {
  interface NextApiRequest {
    user?: {
      id: string;
      username: string;
      minecraft_username?: string;
      minecraft_uuid?: string;
      role: string;
    };
  }
}
