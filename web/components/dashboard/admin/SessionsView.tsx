"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Calendar, MapPin, Users, Clock, Search } from 'lucide-react';
import { motion } from 'framer-motion';

// For date formatting
const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

type Session = {
    id: string;
    start_date: string;
    end_date: string;
    location: string;
    status: string;
    delivery_mode: string;
    training_standard: {
        code: string;
        title: string;
    };
    participants: { count: number }[];
};

import CreateSessionDialog from './CreateSessionDialog';
import ManageSessionView from './ManageSessionView';

export default function SessionsView() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    // Filters
    const [filterStandard, setFilterStandard] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const fetchSessions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                id,
                start_date,
                end_date,
                location,
                delivery_mode,
                status,
                training_standard:training_standards(code, title),
                participants:session_participants(count)
            `)
            .order('start_date', { ascending: true });

        // Cast because Supabase relation types can be tricky
        if (data) setSessions(data as any);
        setLoading(false);
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    if (selectedSessionId) {
        return <ManageSessionView sessionId={selectedSessionId} onBack={() => setSelectedSessionId(null)} />;
    }

    // Filter Logic
    const filteredSessions = sessions.filter(s => {
        const matchesStandard = (s.training_standard?.code + " " + s.training_standard?.title)
            .toLowerCase()
            .includes(filterStandard.toLowerCase());
        const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
        return matchesStandard && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'; // Planned
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Bar: Title & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Sessions</h1>
                    <p className="text-sm text-muted-foreground">Official training operations authority view.</p>
                </div>
                <button
                    onClick={() => setShowWizard(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm"
                >
                    <Plus className="h-4 w-4" />
                    Create Session
                </button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap gap-3 items-center bg-card border border-border p-3 rounded-lg shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Filter by Standard..."
                        value={filterStandard}
                        onChange={(e) => setFilterStandard(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="all">All Statuses</option>
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <button
                    onClick={fetchSessions}
                    className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Refresh"
                >
                    <Clock className="w-4 h-4" />
                </button>
            </div>

            {/* Authority Table */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 text-muted-foreground uppercase tracking-wider text-xs font-semibold border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Standard</th>
                                <th className="px-6 py-4">Dates</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Mode</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Participants</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                        Loading operations data...
                                    </td>
                                </tr>
                            ) : filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-muted-foreground italic">
                                        No sessions found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs mb-1">
                                                {session.training_standard?.code || 'UNK'}
                                            </div>
                                            <div className="text-foreground font-medium truncate max-w-[200px]" title={session.training_standard?.title}>
                                                {session.training_standard?.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                <span className="font-medium text-foreground">{formatDate(session.start_date)}</span>
                                                <span>to {formatDate(session.end_date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {session.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border ${session.delivery_mode === 'online'
                                                ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                                : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                                }`}>
                                                {session.delivery_mode === 'online' ? 'Online' : 'On-Site'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase border tracking-wide ${getStatusColor(session.status)}`}>
                                                {session.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 border border-border text-xs font-medium">
                                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                {session.participants?.[0]?.count || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedSessionId(session.id)}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateSessionDialog
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                onSuccess={fetchSessions}
            />
        </div>
    );
}
