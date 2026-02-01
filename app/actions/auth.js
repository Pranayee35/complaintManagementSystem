"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SALT_ROUNDS = 10;

export async function signup(name, email, password, role = "STUDENT") {
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return { ok: false, error: "Name, email and password are required." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  if (role !== "STUDENT") {
    if (process.env.ALLOW_ADMIN_SIGNUP !== "true") {
      return { ok: false, error: "Admin signup is not allowed." };
    }
  }
  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hash,
      role,
    },
  });
  return { ok: true };
}
