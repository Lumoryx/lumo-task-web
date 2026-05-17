import { SignJWT, jwtVerify } from "jose";

const secret = () => {
  const s = process.env.LUMO_JWT_SECRET;
  if (!s) throw new Error("LUMO_JWT_SECRET not set");
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
