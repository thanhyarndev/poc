"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { useParams } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ProfileDropdown } from "./user-nav";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslations } from "next-intl";

const aboutMenu = [{ href: "/about", label: "About" }];
const homeMenu = [{ href: "/", label: "Home" }];
const companyMenu = [{ href: "/listing", label: "Listing" }];

export function MainNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isLoggedIn } = useAuth();
  const params = useParams();
  const locale = params?.locale || 'en';
  const t = useTranslations();
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (event: { target: any }) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="w-full flex justify-end md:justify-start">
      {/* Hamburger menu button */}
      {/* Hamburger Menu Button */}
      <button
        ref={buttonRef}
        className="md:hidden p-2 focus:outline-none bg-white z-50 right-3"
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        aria-label="Toggle mobile menu"
      >
        <Menu />
      </button>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 right-0 w-full bg-white shadow-md md:hidden z-40">
          <ul className="flex flex-col space-y-2 p-4">
            {aboutMenu.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block p-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {homeMenu.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block p-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {companyMenu.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block p-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {!isLoggedIn && (
              <li>
                <Link
                  href="/login"
                  className="block p-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  Log In
                </Link>
              </li>
            )}
            {isLoggedIn && (
              <div>
                <li>
                  <Link
                    href="/post-listing/"
                    className="block p-2 text-sm font-medium transition-colors hover:text-primary"
                  > 
                    Post new listing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/me/"
                    className="block p-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    My Listing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile/me"
                    className="block p-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="block p-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    My Settings
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="block p-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    Logout
                  </Link>
                </li>
              </div>
            )}
          </ul>
        </div>
      )}

      {/* Desktop navigation */}
      <NavigationMenu className="hidden md:block">
        <NavigationMenuList className="flex space-x-4">
          <NavigationMenuItem>
            <Link href={`/${locale}/`} legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {t("menu.allApps")}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Link href={`/${locale}/device`} legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {t("menu.device")}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={`/reader/`} legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {t("menu.reader")}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={`/sensor-control/`} legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {t("menu.sensor")}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>

          {/* <NavigationMenuItem>
            <NavigationMenuTrigger>Company</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[200px] gap-3 p-4">
                {companyMenu.map((item) => (
                  <ListItem key={item.href} title={item.label} href={item.href}>
                    {item.label === "Listing"
                      ? "Browse company listings."
                      : "Post a new listing."}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem> */}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

export function Header() {
  const [isSticky, setIsSticky] = React.useState(false);
  const params = useParams();
  const locale = params?.locale || 'en';

  React.useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`border-b bg-white h-15 ${
        isSticky ? "fixed top-0 left-0 w-full z-50 bg-white shadow-md" : ""
      }`}
    >
      <div className="flex h-20 items-center px-10">
        <div className="flex items-center space-x-4 w-full">              
          <Link href={`/${locale}/`} legacyBehavior passHref>
            <Image
              src="/images/logo-nextwaves.png"
              alt="Logo"
              width={70}
              height={70}
              className="mr-3 invert hover:cursor-pointer"
            />
          </Link>
          <MainNav />
        </div>
        
        <div className="mr-[1%] hidden md:flex items-center space-x-4">
          <LanguageSwitcher/>
        </div>

        <div className="ml-auto hidden md:flex items-center space-x-4">
          <ProfileDropdown />
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-white text-gray-600 py-4 px-2 text-center border-t border-gray-200 text-xs flex items-center justify-center gap-1">
      <span>&copy; 2025</span>
      <p className="hover:text-teal-500">
        <a 
          href="https://www.nextwaves.industries/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Nextwaves Industries.
        </a>
      </p>
      <span>
        Proudly made in Vietnam 🇻🇳 & Singapore 🇸🇬
      </span>
    </footer>
  );
}


const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
