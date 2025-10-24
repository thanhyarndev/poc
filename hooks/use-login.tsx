"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { loginApi, loginSSO, NewAccount, registerNewAccount } from "./api";

interface LoginCredentials {
  username: string;
  password: string;
}

export function useLogin(
  { redirectTo }: { redirectTo: string } = { redirectTo: "/" }
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async ({ username, password }: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginApi(username, password);

      login(response.data.accessToken, response.data.user);
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleRegister = async ({
    data,
    captcha,
  }: {
    data: NewAccount;
    captcha: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await registerNewAccount(data, captcha);

      if (response.statusCode === 200) {
        setSuccess(
          typeof response.messages === "object"
            ? response.messages[0]
            : response.message
        );

        return true;
      }
      if (response.statusCode === 400) {
        console.log("yes", response.statusCode);

        setSuccess(null);
        setError(
          typeof response.messages === "object"
            ? response.messages[0]
            : response.message
        );
        return false;
      }
      return false;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleLoginLinkedIn = async (type: string, code: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginSSO(type, code);

      login(response.data.accessToken, response.data.user);
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    handleLogin,
    handleLoginLinkedIn,
    handleRegister,
    loading,
    error,
    success,
  };
}
