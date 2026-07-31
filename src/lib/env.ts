// Centralized environment access. Only DATABASE_URL and AUTH_SECRET are strictly
// required; everything else has a safe default so the app boots with a bare .env.

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? '',
  authSecret: process.env.AUTH_SECRET ?? 'dev-only-insecure-secret-change-me',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Bootstrap admin created on first seed.
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@cutm.ac.in',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345',
  // Optional AI provider for subject-wise scoring assistance. Absent = disabled.
  aiProvider: process.env.AI_PROVIDER ?? '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
};

export const aiEnabled =
  (env.aiProvider === 'anthropic' && !!env.anthropicApiKey) ||
  (env.aiProvider === 'openai' && !!env.openaiApiKey);
