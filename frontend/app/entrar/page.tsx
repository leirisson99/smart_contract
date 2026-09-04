import { Suspense } from "react";
import { OtpLoginForm } from "@/components/auth/otp-login-form";

export default function EntrarPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <h1 className="mb-6 text-headline-lg-mobile font-bold tracking-tight sm:text-headline-lg">Entrar</h1>
      <Suspense>
        <OtpLoginForm />
      </Suspense>
    </div>
  );
}
