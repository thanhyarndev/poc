"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/contexts/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import { useLogin } from "@/hooks/use-login";
import { Check } from "lucide-react";

export const Redirect: React.FC = () => {
  const router = useRouter();
  router.push("/");
  return null;
};
export const Success: React.FC = () => {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {t("registration.success")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Check className="w-16 h-16 text-green-500 mx-auto" />
          <p className="text-sm text-center mt-5">
            {t("registration.message.success")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
export default function RegistrationForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations();
  const { handleRegister, success, error } = useLogin();

  const { isLoggedIn, user, logout } = useAuth();

  const [isLoaded, setIsLoaded] = useState(false);
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      gender: "",
      captcha: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required(t("registration.message.required")),
      email: Yup.string()
        .email(t("registration.message.invalidEmail"))
        .required(t("registration.message.required")),
      phone: Yup.string().required(t("registration.message.required")),
      password: Yup.string()
        .min(6, t("registration.message.minPassword"))
        .required(t("registration.message.required")),
      confirmPassword: Yup.string()
        .oneOf(
          [Yup.ref("password"), undefined],
          t("registration.message.passwordMismatch")
        )
        .required(t("registration.message.required")),
      gender: Yup.string().required(t("registration.message.required")),
      captcha: Yup.string().required(t("registration.message.required")),
    }),
    onSubmit: (values) => {
      console.log(values);

      handleRegister({ data: formik.values, captcha: formik.values.captcha });
    },
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <>
      {!isLoggedIn ? (
        isLoaded ? (
          success !== null ? (
            <>
              <Success />
            </>
          ) : (
            <div className={cn("flex flex-col gap-6", className)} {...props}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {t("registration.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={formik.handleSubmit}
                    className="flex flex-col gap-6"
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="name">{t("registration.name")}</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder={t("registration.namePlaceholder")}
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.name && formik.errors.name && (
                        <p className="text-sm text-red-500">
                          {formik.errors.name}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">{t("registration.email")}</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={t("registration.emailPlaceholder")}
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.email && formik.errors.email && (
                        <p className="text-sm text-red-500">
                          {formik.errors.email}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">{t("registration.phone")}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="text"
                        placeholder={t("registration.phonePlaceholder")}
                        value={formik.values.phone}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.phone && formik.errors.phone && (
                        <p className="text-sm text-red-500">
                          {formik.errors.phone}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">
                        {t("registration.password")}
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder={t("registration.passwordPlaceholder")}
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.password && formik.errors.password && (
                        <p className="text-sm text-red-500">
                          {formik.errors.password}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">
                        {t("registration.confirmPassword")}
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder={t(
                          "registration.confirmPasswordPlaceholder"
                        )}
                        value={formik.values.confirmPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.confirmPassword &&
                        formik.errors.confirmPassword && (
                          <p className="text-sm text-red-500">
                            {formik.errors.confirmPassword}
                          </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="gender">{t("registration.gender")}</Label>
                      <select
                        id="gender"
                        name="gender"
                        value={formik.values.gender}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="border rounded-md p-2"
                      >
                        <option
                          value=""
                          label={t("registration.genderSelect")}
                        />
                        <option value="male" label={t("registration.male")} />
                        <option
                          value="female"
                          label={t("registration.female")}
                        />
                        <option value="other" label={t("registration.other")} />
                      </select>
                      {formik.touched.gender && formik.errors.gender && (
                        <p className="text-sm text-red-500">
                          {formik.errors.gender}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2"></div>
                    <Label htmlFor="captcha">{t("registration.captcha")}</Label>
                    <div>
                      <ReCAPTCHA
                        className="g-recaptcha"
                        sitekey="6LcK8KIqAAAAABKBT-wgwDbGuNoU5Wo4C5x5AVWU"
                        onChange={(response: string | null) => {
                          formik.setFieldValue("captcha", response);
                        }}
                        onExpired={() => {
                          formik.setFieldValue("captcha", "");
                          formik.setFieldError(
                            "captcha",
                            t("registration.message.captchaExpired")
                          );
                        }}
                      />
                      {formik.touched.captcha && formik.errors.captcha && (
                        <p className="text-sm text-red-500">
                          {formik.errors.captcha}
                        </p>
                      )}
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 mt-2">{t(error)}</p>
                    )}

                    <Button type="submit" className="w-full">
                      {t("registration.submit")}
                    </Button>
                    <div className="mt-4 text-center text-sm">
                      {t("registration.alreadyAccount")}{" "}
                      <a
                        href="./login"
                        className="underline underline-offset-4"
                      >
                        {t("registration.login")}
                      </a>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )
        ) : null
      ) : (
        <Redirect />
      )}
    </>
  );
}
