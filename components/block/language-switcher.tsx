"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { GlobeIcon } from "lucide-react";

export function LanguageSwitcher() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);
  
  const languages = [
    { code: "en", name: "English" },
    { code: "vi", name: "Tiếng Việt" }
  ];
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const switchLanguage = (newLocale: any) => {
    if (newLocale === locale) return;
    
    // Store the preference in both localStorage and cookie
    localStorage.setItem('preferredLanguage', newLocale);
    document.cookie = `preferredLanguage=${newLocale}; path=/; max-age=31536000`; // 1 year expiry
    
    // Get the path without the locale prefix
    const pathWithoutLocale = pathname.replace(new RegExp(`^/(${languages.map(l => l.code).join('|')})`), '') || '/';
    
    // Create the new path with the new locale
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    
    // Navigate to the new path
    router.push(newPath);
    
    // Optional: Reload the page to ensure all translations are updated
    // This depends on your next-intl setup
    router.refresh();
  };

  if (!isLoaded) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
          <GlobeIcon className="h-4 w-4" />
          <span>{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            className={locale === language.code ? "bg-muted" : ""}
          >
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}