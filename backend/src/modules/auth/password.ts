import bcrypt from "bcryptjs";

const rounds = 10;

export function isHashed(password: string) {
  return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, stored: string) {
  if (isHashed(stored)) return bcrypt.compare(password, stored);
  return stored === password;
}
