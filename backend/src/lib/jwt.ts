import { SignJWT, jwtVerify } from "jose";

const DEV_SECRET = "dev-secret-change-in-production";

const secret = () => {
  const s = process.env.LUMO_JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("LUMO_JWT_SECRET not set");
    console.warn("[jwt] LUMO_JWT_SECRET not set — using insecure dev default");
    return new TextEncoder().encode(DEV_SECRET);
  }
  return new TextEncoder().encode(s);
};

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, secret());
  if (!payload.sub) throw new Error("invalid token");
  return payload.sub;
}
