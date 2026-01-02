"use client";

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Globe, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { user } = useAuth();

    const onSelectChange = (nextLocale: string) => {
        if (nextLocale === locale) return;

        startTransition(async () => {
            // 1. Update DB preference if user is logged in
            if (user) {
                await supabase
                    .from('profiles')
                    .update({ language_preference: nextLocale })
                    .eq('id', user.id);
            }

            // 2. Refresh/Redirect
            // Simple approach: force reload or use router replace to new locale path
            // Actually, since we are using next-intl middleware, we can just set the cookie or navigate to the new path.

            // Navigate to the same path but with new locale prefix
            // Note: This requires knowing the current pathname without locale.
            // Easiest is to set cookie 'NEXT_LOCALE' and refresh options.

            document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

            // Reload page to apply middleware redirect or new locale
            window.location.reload();
        });
    };

    return (
        <div className="flex flex-col gap-2 p-2">
            <button
                onClick={() => onSelectChange('en')}
                disabled={isPending}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${locale === 'en'
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
            >
                <span className="flex items-center gap-2">
                    🇺🇸 English
                </span>
                {locale === 'en' && <Check className="h-4 w-4" />}
            </button>

            <button
                onClick={() => onSelectChange('fr')}
                disabled={isPending}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${locale === 'fr'
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
            >
                <span className="flex items-center gap-2">
                    🇫🇷 Français
                </span>
                {locale === 'fr' && <Check className="h-4 w-4" />}
            </button>
        </div>
    );
}
