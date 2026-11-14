"use server";

import { generatePassphrase, recover, signIn, signOut, signUp } from "@/lib/auth";
import { redirect } from "next/navigation";

export type FormState = { error?: string; recoveryCode?: string; passphrase?: string } | null;

export async function signUpAction(_: FormState, form: FormData): Promise<FormState> {
  const passphrase = String(form.get("passphrase") ?? "");
  const res = await signUp(passphrase);
  return res.ok ? { recoveryCode: res.recoveryCode, passphrase } : { error: res.error };
}

export async function signInAction(_: FormState, form: FormData): Promise<FormState> {
  const res = await signIn(String(form.get("passphrase") ?? ""));
  if (!res.ok) return { error: res.error };
  redirect("/");
}

export async function recoverAction(_: FormState, form: FormData): Promise<FormState> {
  const passphrase = String(form.get("passphrase") ?? "");
  const res = await recover(String(form.get("code") ?? ""), passphrase);
  return res.ok ? { recoveryCode: res.recoveryCode, passphrase } : { error: res.error };
}

export async function suggestPassphrase(): Promise<string> {
  return generatePassphrase();
}

export async function signOutAction() {
  await signOut();
  redirect("/sign-in");
}
