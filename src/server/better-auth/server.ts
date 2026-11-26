import { headers } from "next/headers";
import { cache } from "react";
import { auth } from ".";

export const getSession = cache(async () => {
  const reqHeaders = await headers();
  try {
    return await auth.api.getSession({ headers: reqHeaders });
  } catch (error) {
    console.error("[getSession] Failed to retrieve session:", error);
    return null;
  }
});
