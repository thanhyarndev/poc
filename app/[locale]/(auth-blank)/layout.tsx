"use client";
import { Header, Footer } from "@/components/block/menu";
import GlobalSkeleton from "@/components/block/skeleton";
import { useAuth } from "@/contexts/AuthProvider"; // Adjust the import path as necessary
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaceFrownIcon } from '@heroicons/react/24/outline';


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, user, logout } = useAuth();
  const t = useTranslations();
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-100">
        <GlobalSkeleton />
        {isLoggedIn ? (
          children
        ) : isLoaded ? (
          <div className="flex min-h-[83dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-md text-center">
              <h1 className=" text-6xl font-bold tracking-tight text-foreground sm:text-7xl ">
                403
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("auth.required")}
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  prefetch={false}
                >
                  {t("registration.login")}
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
