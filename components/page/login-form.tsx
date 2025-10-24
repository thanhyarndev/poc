"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useLogin } from "@/hooks/use-login";
import { useLinkedIn } from "react-linkedin-login-oauth2";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { handleLogin, handleLoginLinkedIn, loading, error } = useLogin();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin({ username, password });
  };

  const { linkedInLogin } = useLinkedIn({
    clientId: "77uw8q4wiha8xg",
    scope: "profile,email,openid",
    redirectUri: `${
      typeof window === "object" && window.location.origin
    }/linkedin`,
    onSuccess: (code) => {
      handleLoginLinkedIn("linkedin", code);
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
          <CardDescription>{t("login.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">{t("login.username")}</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("login.usernamePlaceholder")}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {t("login.forgotPassword")}
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("login.loading") : t("login.submit")}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  linkedInLogin();
                }}
              >
                {t("login.linkedin")}
              </Button>
              {error && <p className="text-sm text-red-500 mt-2">{t(error)}</p>}
            </div>
            <div className="mt-4 text-center text-sm">
              {t("login.noAccount")}{" "}
              <a href="./registration" className="underline underline-offset-4">
                {t("login.signup")}
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
