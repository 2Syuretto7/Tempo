"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { recoverAction, signInAction, signUpAction, suggestPassphrase, type FormState } from "./actions";

const field =
  "w-full h-10 bg-page border border-hairline rounded-[2px] px-3 text-[16px] text-ink font-mono placeholder:text-meta/60 focus:outline-none focus:border-accent";
const label = "block text-[14px] font-medium text-body mb-2";

export function AuthForms({ mode, suggestion }: { mode: "sign-in" | "sign-up"; suggestion: string }) {
  const [view, setView] = useState<"sign-in" | "sign-up" | "recover">(mode);
  return view === "sign-up" ? <SignUp suggestion={suggestion} /> : view === "recover" ? <Recover back={() => setView("sign-in")} /> : <SignIn recover={() => setView("recover")} />;
}

function Heading({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[32px] leading-[35px] tracking-[-0.8px]">{title}</h1>
      <p className="mt-3 text-[16px] leading-6 text-body">{body}</p>
    </div>
  );
}

function ErrorLine({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p role="alert" className="mt-3 text-[14px] text-danger flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.25" /><path d="M8 4.5v4.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      {text}
    </p>
  );
}

function SignIn({ recover }: { recover: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAction, null);
  return (
    <form action={action}>
      <Heading title="Welcome back" body="Enter your passphrase. Spaces, hyphens and capitals do not matter." />
      <label className={label} htmlFor="passphrase">Passphrase</label>
      <input id="passphrase" name="passphrase" type="password" autoComplete="current-password" autoFocus required className={field} />
      <ErrorLine text={state?.error} />
      <Button type="submit" className="w-full mt-6" disabled={pending} chevron>
        {pending ? "Signing in" : "Sign in"}
      </Button>
      <button type="button" onClick={recover} className="mt-6 text-[14px] text-link hover:text-ink">
        Lost your passphrase? Use your recovery code →
      </button>
    </form>
  );
}

function SignUp({ suggestion }: { suggestion: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signUpAction, null);
  const [value, setValue] = useState(suggestion);
  if (state?.recoveryCode) return <SaveCodes passphrase={state.passphrase!} code={state.recoveryCode} />;
  return (
    <form action={action}>
      <Heading title="Make Tempo yours" body="Tempo has one owner: you. Choose a passphrase you can remember and paste on any device. Here is a strong one, or write your own." />
      <label className={label} htmlFor="passphrase">Passphrase</label>
      <div className="flex gap-2">
        <input id="passphrase" name="passphrase" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="new-password" required className={field} />
        <CopyButton value={value} label="Copy passphrase" />
      </div>
      <p className="mt-2 text-[12px] leading-5 text-meta">At least four words. Save it in your password manager.</p>
      <button type="button" className="mt-2 text-[14px] text-link hover:text-ink" onClick={async () => setValue(await suggestPassphrase())}>
        Suggest another
      </button>
      <ErrorLine text={state?.error} />
      <Button type="submit" className="w-full mt-6" disabled={pending} chevron>
        {pending ? "Creating" : "Create my account"}
      </Button>
    </form>
  );
}

function SaveCodes({ passphrase, code }: { passphrase: string; code: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAction, null);
  return (
    <form action={action}>
      <input type="hidden" name="passphrase" value={passphrase} />
      <Heading title="Save these two things" body="Your passphrase signs you in on every device. The recovery code is shown only once and lets you reset the passphrase if you ever forget it." />
      <div className="border border-hairline rounded-[4px] bg-raised divide-y divide-hairline">
        <Row name="Passphrase" value={passphrase} />
        <Row name="Recovery code" value={code} />
      </div>
      <ErrorLine text={state?.error} />
      <Button type="submit" className="w-full mt-8" disabled={pending} chevron>
        I have saved them
      </Button>
    </form>
  );
}

function Row({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="text-[12px] uppercase tracking-[0.08em] font-medium text-meta">{name}</div>
        <div className="mt-1 font-mono text-[14px] text-ink break-all">{value}</div>
      </div>
      <CopyButton value={value} label={`Copy ${name.toLowerCase()}`} />
    </div>
  );
}

function Recover({ back }: { back: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(recoverAction, null);
  if (state?.recoveryCode) return <SaveCodes passphrase={state.passphrase!} code={state.recoveryCode} />;
  return (
    <form action={action}>
      <Heading title="Reset your passphrase" body="Enter the recovery code you saved at sign-up, then choose a new passphrase. You will get a fresh recovery code." />
      <label className={label} htmlFor="code">Recovery code</label>
      <input id="code" name="code" required autoComplete="one-time-code" className={field} placeholder="XXXX-XXXX-XXXX-XXXX" />
      <label className={`${label} mt-5`} htmlFor="new-passphrase">New passphrase</label>
      <input id="new-passphrase" name="passphrase" required autoComplete="new-password" className={field} />
      <ErrorLine text={state?.error} />
      <Button type="submit" className="w-full mt-6" disabled={pending} chevron>
        {pending ? "Resetting" : "Reset and sign in"}
      </Button>
      <button type="button" onClick={back} className="mt-6 text-[14px] text-link hover:text-ink">
        ← Back to sign in
      </button>
    </form>
  );
}
