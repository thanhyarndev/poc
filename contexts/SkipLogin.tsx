"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export const LoginGroup = () => {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  if (isLoggedIn) {
    try {
      router.push("../");
    } catch (err: any) {
      console.log("Push Skip Failed", err);
      window.location.href = "../"; // Fallback to windo
    }
  }
  return null;
};
