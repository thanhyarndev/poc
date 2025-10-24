"use client";

import { useAuth } from "@/contexts/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function ProfileDropdown() {
  const { isLoggedIn, user, logout } = useAuth();
  const t = useTranslations();
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  if (!isLoggedIn || !user) {
    return isLoaded ? (
      <Button variant="default" className="h-8 px-4 text-sm">
        <a href="/login">{t("userNav.login")}</a>
      </Button>
    ) : null;
  }

  return (
    <div className="flex gap-4">
      {/* <Button variant="default" className="h-8 px-4 text-sm">
        <a href="/post-listing">{t("userNav.newListing")}</a>
      </Button> */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => (window.location.href = "/me")}>
              {t("userNav.myListing")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => (window.location.href = "/profile/me")}
            >
              {t("userNav.profile")}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => (window.location.href = "/settings")}
            >
              {t("userNav.settings")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <a>{t("userNav.logout")}</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
