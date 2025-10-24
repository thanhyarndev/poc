const getDefaultLocale = () => {
    const browserLocale = navigator.language || navigator.userLanguage;
    const supportedLocales = ["en", "vi"];
    return supportedLocales.includes(browserLocale) ? browserLocale : "en";
};

export const i18n = {
    locales: ["en", "vi"],
    defaultLocale: getDefaultLocale(),
};
