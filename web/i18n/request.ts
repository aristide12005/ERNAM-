import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Validate that the incoming `locale` parameter is valid
    if (!locale || !['en', 'fr'].includes(locale as string)) {
        locale = 'fr';
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
