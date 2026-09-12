import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getClientPortalLoginPath, getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  const loginPath = getClientPortalLoginPath();
  const { pathname, search } = window.location;

  // Already on the magic-link login screen — avoid a redirect loop.
  if (pathname === loginPath || pathname === "/auth/verify") {
    return;
  }

  // Prefer the client portal magic-link flow so clients never hit broken OAuth.
  const next = getLoginUrl();
  const returnTo = `${pathname}${search}`;
  if (next.startsWith("/")) {
    const target = new URL(next, window.location.origin);
    if (pathname.startsWith("/client-portal")) {
      target.searchParams.set("returnTo", returnTo);
    }
    if (target.pathname === pathname && target.search === search) {
      return;
    }
    window.location.href = `${target.pathname}${target.search}`;
    return;
  }

  window.location.href = next;
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
