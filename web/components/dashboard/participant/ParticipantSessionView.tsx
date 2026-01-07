"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTranslations } from 'next-intl';
import { ArrowLeft, BookOpen, Download, Calendar, MapPin, User, FileText, Bell, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

type ParticipantSessionViewProps = {
    sessionId: string;
    onBack: () => void;
};

type ViewTab = 'overview' | 'schedule' | 'materials' | 'messages';

export default function ParticipantSessionView({ sessionId, onBack }: ParticipantSessionViewProps) {
    const t = useTranslations('Session');
    const tp = useTranslations('Participant');
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ViewTab>('overview');

    // Data
    const [session, setSession] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [instructor, setInstructor] = useState<any>(null);

    // State for Messages
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        if (sessionId) fetchData();
    }, [sessionId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Session Details
            const { data: sData } = await supabase
                .from('sessions')
                .select('id, start_date, end_date, location, status, training_standard:training_standards(title, code, description), organization:organizations(name)')
                .eq('id', sessionId)
                .single();
            if (sData) setSession(sData);

            // 2. Instructor (First one found)
            const { data: iData } = await supabase
                .from('session_instructors')
                .select('instructor:users(full_name, email)')
                .eq('session_id', sessionId)
                .limit(1)
                .single();
            if (iData) setInstructor(iData.instructor);

            // 3. Activities
            const { data: actData } = await supabase
                .from('planned_activities')
                .select('*')
                .eq('session_id', sessionId)
                .order('day_order', { ascending: true });
            if (actData) setActivities(actData);

            // 4. Documents
            const { data: docData } = await supabase
                .from('documents')
                .select('*')
                .eq('session_id', sessionId);
            if (docData) setDocuments(docData);

            // 5. Messages
            const { data: msgData } = await supabase
                .from('messages')
                .select('id, message, created_at, sender:users(full_name)')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: false });
            if (msgData) setMessages(msgData);

        } catch (error) {
            console.error("Error fetching session details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">{t('loading')}</div>;

    const tabs = [
        { id: 'overview', label: t('tabs.overview'), icon: BookOpen },
        { id: 'schedule', label: t('tabs.schedule'), icon: Calendar },
        { id: 'materials', label: t('tabs.materials'), icon: FileText },
        { id: 'messages', label: t('tabs.messages'), icon: Bell },
    ];

    return (
        <div className="bg-white min-h-screen -m-8 relative">
            {/* Header / Hero */}
            <div className="bg-slate-900 text-white p-8 pb-32">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> {tp('backToJourney')}
                </button>
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                            {session?.training_standard?.code || 'TRAINING'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider animate-pulse">
                            {t('status.active')}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{session?.training_standard?.title}</h1>
                    <div className="flex flex-wrap gap-8 text-slate-300">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-blue-400" />
                            <span>{new Date(session?.start_date).toLocaleDateString()} — {new Date(session?.end_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-red-400" />
                            <span>{session?.location}</span>
                        </div>
                        {instructor && (
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-emerald-400" />
                                <span>{t('instructor')}: {instructor.full_name}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* TAB NAVIGATION */}
            <div className="max-w-4xl mx-auto -mt-8 relative z-10 px-4">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 flex overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as ViewTab)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold transition-all whitespace-nowrap ${isActive
                                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TAB CONTENT */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <h3 className="text-xl font-bold text-slate-900 mb-4">{t('overview.about')}</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {session?.training_standard?.description || t('overview.noDescription')}
                                </p>
                            </div>

                            {/* Add more overview content here if needed */}
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">{t('schedule.title')}</h3>
                            </div>
                            <div className="space-y-4">
                                {activities.length > 0 ? (
                                    activities.map((activity) => (
                                        <div key={activity.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex gap-6">
                                            <div className="flex-shrink-0 w-16 text-center">
                                                <div className="text-2xl font-bold text-slate-900">
                                                    {activity.day_order || 1}
                                                </div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('schedule.day')}</div>
                                            </div>
                                            <div className="flex-1 border-l border-slate-100 pl-6">
                                                <h4 className="font-bold text-lg text-slate-900 mb-2">{activity.title}</h4>
                                                <p className="text-slate-500 text-sm mb-4">{activity.description}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                                                        {activity.duration_minutes} min
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${activity.type === 'practical' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {activity.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                        <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium">{t('schedule.empty')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'materials' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-900">{t('materials.title')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {documents.length > 0 ? (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{doc.title}</h4>
                                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{doc.file_type || 'PDF'}</p>
                                                <div className="mt-4 flex gap-2">
                                                    <a
                                                        href={doc.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors flex items-center gap-2"
                                                    >
                                                        <Download className="h-3 w-3" /> {t('materials.download')}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                        <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium">{t('materials.empty')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div className="text-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center justify-center gap-2">
                                <Bell className="h-6 w-6 text-blue-500" />
                                {t('messages.title')}
                            </h3>

                            {messages.length > 0 ? (
                                <div className="space-y-4 text-left max-w-2xl mx-auto">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="flex gap-3">
                                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white flex-shrink-0">
                                                    {(msg.sender?.full_name || 'U').charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-bold text-slate-900">{msg.sender?.full_name || 'Unknown'}</p>
                                                        <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 leading-relaxed mt-1">
                                                        {msg.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Bell className="h-8 w-8 text-blue-300" />
                                    </div>
                                    <p className="text-slate-500 max-w-sm mx-auto">{t('messages.empty')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
