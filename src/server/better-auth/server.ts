import { headers } from "next/headers";
import { cache } from "react";
import { auth } from ".";

export const getSession = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch (error) {
    console.error("[getSession] Failed to retrieve session:", error);
    return null;
  }
});
