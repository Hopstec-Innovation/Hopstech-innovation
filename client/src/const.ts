export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const CLIENT_PORTAL_LOGIN_PATH = "/client-portal";

function isOAuthConfigured() {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL?.trim();
  const appId = import.meta.env.VITE_APP_ID?.trim();
  return Boolean(oauthPortalUrl && appId);
}

/**
 * Primary login destination for Hopstec clients.
 * Magic-link auth lives on /client-portal. Legacy Manus OAuth is only used
 * when its env vars are explicitly configured.
 */
export const getLoginUrl = () => {
  if (!isOAuthConfigured()) {
    return CLIENT_PORTAL_LOGIN_PATH;
  }

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as string;
  const appId = import.meta.env.VITE_APP_ID as string;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (error) {
    console.warn(
      "[Auth] Invalid OAuth portal URL; falling back to client portal magic-link login.",
      error
    );
    return CLIENT_PORTAL_LOGIN_PATH;
  }
};

export const getClientPortalLoginPath = () => CLIENT_PORTAL_LOGIN_PATH;
