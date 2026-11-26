import {
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import SuperJSON from "superjson";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Cache queries for 60s and avoid window-focus refetches to reduce Neon compute load
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Skip global toast if the mutation already handles onError locally
        if (mutation.options.onError) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "An unknown error occurred";
        // Use message as toast id to deduplicate identical toasts
        toast.error(message, { id: message });
      },
    }),
  });
