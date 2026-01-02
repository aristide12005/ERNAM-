import { useTranslations } from 'next-intl';
import AdmissionWizard from '@/components/admissions/AdmissionWizard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdmissionsPage() {
    const t = useTranslations('Admissions');

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
                                <ArrowLeft size={20} />
                            </Link>
                            <span className="h-6 w-px bg-gray-200"></span>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {t('title')}
                            </h1>
                        </div>
                        <div className="text-sm text-gray-500">
                            {t('academic_session', { year: '2024-2025' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
                        {t('start_journey')}
                    </h2>
                    <p className="max-w-2xl mx-auto text-xl text-gray-500">
                        {t('description')}
                    </p>
                </div>

                <AdmissionWizard />

                <div className="mt-12 text-center text-sm text-gray-400">
                    {t('already_student')} <Link href="/auth/login" className="text-blue-600 hover:underline">{t('login_here')}</Link>
                </div>
            </main>
        </div>
    );
}
