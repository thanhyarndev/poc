"use client";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useTranslations } from "next-intl";
import { confirmEmail } from "@/hooks/api";
import { Button } from "../ui/button";

const Success = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">Email Confirmed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 items-center">
          <Check size={48} className="text-green-500" />
          <p className="text-lg text-center">
            Your email has been confirmed successfully!
          </p>
          <p>
            Click here to{" "}
            <Button onClick={() => (window.location.href = "/login")}>
              {" "}
              login
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const Failed = ({ msg }: { msg: string }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Email Confirmation Failed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 items-center">
          <X size={48} className="text-red-500" />
          <p className="text-lg text-center">{msg}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default async function ConfirmBlock({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const t = useTranslations();
  const code = searchParams.code;
  const email = searchParams.email;
  let isSuccessful = true;
  let msg = "Failed to confirm email";

  if (!code || !email) {
    return (
      <div className="flex min-h-[calc(100dvh-10rem)] w-full items-center justify-center p-6 md:p-10">
        <p>Error: Missing confirmation code or email.</p>
      </div>
    );
  }

  try {
    const result = await confirmEmail(code, email);

    if (result.statusCode === 200) {
      isSuccessful = true;
    } else {
      isSuccessful = false;
      msg = t(result.message);
    }
  } catch (error) {
    console.error("Error during confirmation:", error);
    isSuccessful = false;
    msg = "An unexpected error occurred. Please try again.";
  }

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] w-full items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {isSuccessful ? <Success /> : <Failed msg={msg} />}
      </div>
    </div>
  );
}
