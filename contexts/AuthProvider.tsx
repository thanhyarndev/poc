"use client";
import { getMe } from "@/hooks/api";
import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  _id: any;
  name: string;
  email: string;
  avatar: string;
  dob?: string;
  gender?: string;
  bio?: string;
  subscription?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  getUser: () => User | null;
  setNewUser: (user: User) => void;
  getNewUserInformation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        logout();
      }
      if (token && storedUser) {
        setIsLoggedIn(true);
        setUser(JSON.parse(storedUser));
        getNewUserInformation();
      }
    } catch {
      logout();
    }
  }, []);

  const login = (token: string, user: User) => {
    document.cookie = `authToken=${token}; path=/;`;
    document.cookie = `userId=${user._id}; path=/;`;
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(user));

    setIsLoggedIn(true);
    setUser(user);
  };
  const getUser = (): User | null => {
    const user = localStorage.getItem("user");
    if (user) {
      return JSON.parse(user);
    }
    return null;
  };
  const setNewUser = (user: User) => {
    if (user.email) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  };
  const getNewUserInformation = async () => {
    try {
      if (!isLoggedIn) {
        return;
      }
      const user = await getMe();

      if (user._id) {
        setNewUser(user);
      }
    } catch (e: any) {
      if (e.message === "UNAUTHORIZED") {
        logout();
      }
    }
  };
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout,
        getUser,
        setNewUser,
        getNewUserInformation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
