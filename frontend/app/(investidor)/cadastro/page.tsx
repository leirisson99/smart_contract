import { KycForm } from "@/components/kyc/kyc-form";

export default function CadastroPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-headline-lg-mobile font-bold tracking-tight sm:text-headline-lg">Cadastro</h1>
      <KycForm />
    </div>
  );
}
