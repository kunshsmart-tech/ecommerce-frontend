
const API_URL = "http://127.0.0.1:8000";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem("admin_token");
}

export function logoutAdmin() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("admin_token");
    window.location.replace("/admin/login");
  }
}

export async function adminFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAdminToken();

  if (!token) {
    logoutAdmin();
    throw new Error("Please sign in as admin.");
  }

  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
      cache: "no-store",
    }
  );

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    logoutAdmin();

    throw new Error(
      "Your admin session has expired. Please log in again."
    );
  }

  return response;
}