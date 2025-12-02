// AuthContext.tsx — SOFT DISABLED, SAFE, NO ERRORS

import { createContext, useContext } from "react";

export const AuthContext = createContext<any>(null);

// No-op provider
export const AuthProvider = ({ children }: any) => {
  return children;
};

// Safe fallback. Does NOT throw.
export const useAuth = () => {
  console.warn("⚠ useAuth is deprecated. Use useUserSession instead.");
  return { user: null, login: () => {}, logout: () => {} };
};
