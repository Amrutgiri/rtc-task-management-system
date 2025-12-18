import { useContext } from "react";
import type { AuthContextType } from "../context/AuthContext";
import { AuthContext } from "../context/AuthContext";

/**
 * Custom hook to access authentication context
 * @returns {AuthContextType} Authentication context with user, login, logout
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  
  return context;
}

export default useAuth;
