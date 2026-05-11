import { SignJWT, jwtVerify } from "jose";

const SEGREDO = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "padrao-inseguro",
);

const EMISSOR = "fuelfrota";
const AUDIENCIA = "fuelfrota-app";

export type PayloadJWT = {
  sub: string; // usuarioId
  email: string;
  nome: string;
  role: string;
  permissoes: string[];
};

export async function assinarToken(
  payload: PayloadJWT,
  expiraEm: string = "7d",
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(EMISSOR)
    .setAudience(AUDIENCIA)
    .setExpirationTime(expiraEm)
    .sign(SEGREDO);
}

export async function verificarToken(
  token: string,
): Promise<PayloadJWT | null> {
  try {
    const { payload } = await jwtVerify(token, SEGREDO, {
      issuer: EMISSOR,
      audience: AUDIENCIA,
    });

    return payload as unknown as PayloadJWT;
  } catch {
    return null;
  }
}
