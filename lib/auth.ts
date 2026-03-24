import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "@/lib/env";

const SESSION_TTL = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
};

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);

export const verifyPassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signSessionToken = (payload: SessionPayload) =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: SESSION_TTL,
  });

export const verifySessionToken = (token: string) =>
  jwt.verify(token, env.jwtSecret) as SessionPayload;

export const sessionMaxAge = SESSION_TTL;
