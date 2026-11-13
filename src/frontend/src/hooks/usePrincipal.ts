import { useInternetIdentity } from "@caffeineai/core-infrastructure";

/**
 * The signed-in user's principal as text, or `undefined` when signed out.
 * Restored sessions are authenticated without a fresh login, so this reads
 * the identity directly rather than any login-success flag.
 */
export function usePrincipal(): string | undefined {
  const { identity } = useInternetIdentity();
  if (!identity || identity.getPrincipal().isAnonymous()) return undefined;
  return identity.getPrincipal().toText();
}

/** Whether the visitor currently has an authenticated identity. */
export function useIsSignedIn(): boolean {
  return usePrincipal() !== undefined;
}
