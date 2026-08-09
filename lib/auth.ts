import { SignJWT, jwtVerify } from 'jose';

// In production, this MUST come from process.env.JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_development_only_1234567890';
const encodedKey = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: { id: string; email: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h') // Spec requirement: Auto logout 2 hours
    .sign(encodedKey);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    return payload;
  } catch (error) {
    console.error('JWT Verification failed:', error);
    return null;
  }
}