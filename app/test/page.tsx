"use client";

import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation(); // Using the "common" namespace

  return (
    <div>
      <h1>{t("login.heading")}</h1> {/* Heads like "Login" */}
      <p>{t("login.description")}</p> {/* Example key: "Access your account" */}
    </div>
  );
}
