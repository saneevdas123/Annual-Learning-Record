export type ActionResult = { error?: string; ok?: boolean } | undefined;

export function fail(message: string): never {
  throw new Error(message);
}

export function ok(): void {
  return undefined;
}

export function safeNextPath(raw: unknown): string {
  const value = typeof raw === 'string' ? raw : '';
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('://')) {
    return '/dashboard';
  }
  return value;
}
