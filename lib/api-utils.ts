export function toRouteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const detail =
    error instanceof Error && error.cause instanceof Error
      ? error.cause.message
      : "";
  const combined = `${message}\n${detail}`;

  if (
    combined.includes("no such table") ||
    combined.includes("DATABASE_URL")
  ) {
    return "The database is not ready. Check the DATABASE_URL (and DATABASE_AUTH_TOKEN, if using a remote database) environment variables.";
  }

  return message;
}

export function getCurrentUserFromHeaders(request: Request) {
  const email =
    request.headers.get("oai-authenticated-user-email") ??
    "manager@example.com";
  const encodedFullName = request.headers.get("oai-authenticated-user-full-name");
  const encoding = request.headers.get("oai-authenticated-user-full-name-encoding");
  const name =
    encodedFullName && encoding === "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : "Deal Manager";

  return {
    name,
    email,
    role: "manager",
  };
}
