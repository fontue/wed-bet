import { cookies } from "next/headers";
import { getSessionUser } from "@/infrastructure/mock/store";

export const SESSION_COOKIE = "wedbet_session";

export async function currentUser() {
  const cookieStore = await cookies();
  return getSessionUser(cookieStore.get(SESSION_COOKIE)?.value);
}
