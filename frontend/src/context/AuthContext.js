import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { login as loginRequest } from "../api/auth";

import { clearAuth, getToken, getUser, saveAuth } from "../utils/storage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(null);

  const [loading, setLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          getToken(),
          getUser(),
        ]);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          await clearAuth();
        }
      } catch (error) {
        console.error("Failed to restore authentication:", error);

        await clearAuth();
      } finally {
        setLoading(false);
      }
    };

    restoreAuth();
  }, []);

  const login = async (email, password) => {
    const result = await loginRequest(email, password);

    if (result.error) {
      throw new Error(result.error.message);
    }

    const { token: newToken, user: newUser } = result.data;

    await saveAuth(newToken, newUser);

    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);

    return {
      token: newToken,
      user: newUser,
    };
  };

  const logout = async () => {
    await clearAuth();

    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated,
      login,
      logout,
    }),
    [user, token, loading, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
};
