"use client";
import GlobalSkeleton from "@/components/block/skeleton";
import { LinkedInCallback } from "react-linkedin-login-oauth2";
export default function LinkedInPage() {
  return (
    <>
      <GlobalSkeleton />
      <LinkedInCallback />
    </>
  );
}
