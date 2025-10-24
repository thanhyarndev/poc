import RegistrationForm from "@/components/page/registration-form";
import { Metadata } from "next";
import { useTranslations } from "next-intl";
import React from "react";
export const metadata: Metadata = {
  title: "Registration - Nextwaves",
  description: "Registration into nextwaves",
};
export default function Page() {
  return (
    <div className="flex min-h-[calc(100dvh-10rem)] w-full items-center justify-center p-6 md:p-10 bg-gray-100">
      <div className="w-full max-w-sm">
        <RegistrationForm />
      </div>
    </div>
  );
}
