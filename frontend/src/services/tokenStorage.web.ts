// Web authentication uses an HttpOnly cookie; JavaScript never persists or reads the JWT.
export async function getAdminToken(): Promise<string | null> {
  return null;
}

export async function saveAdminToken(_token: string): Promise<void> {}

export async function removeAdminToken(): Promise<void> {}
