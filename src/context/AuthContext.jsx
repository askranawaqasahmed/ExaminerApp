import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const storageKey = "examiner-auth-token";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(storageKey) || "");
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem(`${storageKey}-email`);
    return email ? { email } : null;
  });

  const login = ({ token: newToken, email: userEmail }) => {
    if (!newToken) return;
    setToken(newToken);
    setUser({ email: userEmail });
    localStorage.setItem(storageKey, newToken);
    localStorage.setItem(`${storageKey}-email`, userEmail);
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}-email`);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
