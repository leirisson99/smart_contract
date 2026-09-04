import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  rpcUrl: required("RPC_URL"),
  chainId: Number(process.env.CHAIN_ID ?? 31337),
  identityRegistryAddress: required("IDENTITY_REGISTRY_ADDRESS") as `0x${string}`,
  marketplaceAddress: required("MARKETPLACE_ADDRESS") as `0x${string}`,
  propertyFactoryAddress: required("PROPERTY_FACTORY_ADDRESS") as `0x${string}`,
  trustedIssuerPrivateKey: required("TRUSTED_ISSUER_PRIVATE_KEY") as `0x${string}`,
  walletEncKey: required("WALLET_ENC_KEY"),
  gasSponsorPrivateKey: required("GAS_SPONSOR_PRIVATE_KEY") as `0x${string}`,
  gestorPrivateKey: required("GESTOR_PRIVATE_KEY") as `0x${string}`,
  adminApiKey: required("ADMIN_API_KEY"),
  kycWebhookSecret: required("KYC_WEBHOOK_SECRET"),
  // SMTP e opcional de proposito (feature 006): sem essas vars, mailer.ts cai
  // num fallback que loga o codigo OTP em vez de enviar e-mail de verdade,
  // para nao bloquear dev/test local (mesmo espirito do MockKycProvider).
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM ?? "no-reply@investx.local",
};
