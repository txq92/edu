import { create } from "zustand";

const KEY = "meo-den-token";

type SessionState = {
  token: string | null;
  setToken: (token: string | null) => void;
};

export const useSession = create<SessionState>((set) => ({
  token: null,
  setToken: (token) => {
    if (typeof localStorage !== "undefined") {
      if (token) localStorage.setItem(KEY, token);
      else localStorage.removeItem(KEY);
    }
    set({ token });
  },
}));
