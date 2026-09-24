import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { useRules } from "@/lib/store/rules";
import { useSettings } from "@/lib/store/settings";

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
    void useSettings.persist.rehydrate();
    void useRules.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}
