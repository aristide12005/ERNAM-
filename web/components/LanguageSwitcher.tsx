"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const { user } = useAuth();

    const onSelectChange = (nextLocale: string) => {
        if (nextLocale === locale) return;

        startTransition(async () => {
            // 1. Update DB preference if user is logged in (optional but good)
            if (user) {
                await supabase
                    .from('profiles')
                    .update({ language_preference: nextLocale })
                    .eq('id', user.id);
            }

            // 2. Construct the new path
            // This replaces the current locale segment (e.g., /en/...) with the new one (/fr/...)
            // The pathname usually looks like "/en/dashboard" or "/en"
            let newPath = pathname;

            if (pathname.startsWith(`/${locale}`)) {
                // Replace the existing prefix
                newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
            } else {
                // If for some reason the prefix is missing (e.g. root), prepend it
                newPath = `/${nextLocale}${pathname}`;
            }

            // 3. Navigate immediately (No Reload!)
            router.replace(newPath);
            router.refresh(); // Soft refresh to ensure server components update
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
