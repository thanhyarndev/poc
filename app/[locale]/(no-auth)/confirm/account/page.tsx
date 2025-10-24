import ConfirmBlock from "@/components/page/confirm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirm your email - nextwaves",
  description: "Confirm your email into nextwaves",
};

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const code = searchParams.code;
  const email = searchParams.email;

  if (!code || !email) {
    return (
      <div className="flex min-h-[calc(100dvh-10rem)] w-full items-center justify-center p-6 md:p-10">
        <p>Error: Missing confirmation code or email.</p>
      </div>
    );
  }
  return <ConfirmBlock searchParams={searchParams} />;
}
