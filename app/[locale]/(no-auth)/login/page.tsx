import { LoginForm } from "@/components/page/login-form";
import { LoginGroup } from "@/contexts/SkipLogin";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Login - nextwaves",
  description: "Login into nextwaves",
};
export default function Page() {
  return (
    <div className="flex min-h-full w-full items-center justify-center p-6 md:p-10 bg-gray-100">
      <div className="w-full max-w-sm">
        <LoginGroup />
        <LoginForm />
      </div>
    </div>
  );
}
