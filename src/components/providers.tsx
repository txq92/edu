import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { useRules } from "@/lib/store/rules";
import { useSettings } from "@/lib/store/settings";
import { DEFAULT_WATCH, MAX_WATCH } from "@/lib/binance/constants";

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 4000 },
        },
      }),
  );

  useEffect(() => {
    void (async () => {
      await useSettings.persist.rehydrate();
      await useRules.persist.rehydrate();
      const s = useSettings.getState();
      if (s.watchSeeded) return;
      const missing = DEFAULT_WATCH.filter((id) => !s.watch.includes(id));
      const watch = [...s.watch, ...missing].slice(0, MAX_WATCH);
      useSettings.setState({ watch, watchSeeded: true });
    })();
  }, []);

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}
