const DEFAULT_SECRET = 'dev-only-insecure-secret-change-me';

function resolveAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEFAULT_SECRET) {
      throw new Error('AUTH_SECRET must be set to a strong value in production.');
    }
  }
  return secret ?? DEFAULT_SECRET;
}

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? '',
  authSecret: resolveAuthSecret(),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@cutm.ac.in',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345',
  aiProvider: process.env.AI_PROVIDER ?? '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
};

export const aiEnabled =
  (env.aiProvider === 'anthropic' && !!env.anthropicApiKey) ||
  (env.aiProvider === 'openai' && !!env.openaiApiKey);
