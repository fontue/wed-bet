function firstForwardedValue(value: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

export function requestUsesHttps(request: Request): boolean {
  const forwardedProtocol = firstForwardedValue(
    request.headers.get("x-forwarded-proto"),
  );
  if (forwardedProtocol) return forwardedProtocol.toLowerCase() === "https";
  return new URL(request.url).protocol === "https:";
}

export function publicAppOrigin(request: Request): string {
  const configuredOrigin =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configuredOrigin) {
    const url = new URL(configuredOrigin);
    if (url.protocol !== "http:" && url.protocol !== "https:")
      throw new Error("INVALID_APP_URL");
    return url.origin;
  }

  const forwardedHost = firstForwardedValue(
    request.headers.get("x-forwarded-host"),
  );
  const host =
    forwardedHost ?? firstForwardedValue(request.headers.get("host"));
  if (!host) return new URL(request.url).origin;

  const forwardedProtocol = firstForwardedValue(
    request.headers.get("x-forwarded-proto"),
  );
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : new URL(request.url).protocol.replace(":", "");
  return `${protocol}://${host}`;
}
