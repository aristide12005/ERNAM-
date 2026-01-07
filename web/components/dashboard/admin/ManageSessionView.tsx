"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, UserPlus, Trash2, Calendar, MapPin, CheckCircle, Award, LayoutDashboard, UserCog, Users, List, FileText, ClipboardCheck, Shield } from 'lucide-react';

type ManageSessionViewProps = {
    sessionId: string;
    onBack: () => void;
};

type SessionDetails = {
    id: string;
    start_date: string;
    end_date: string;
    location: string;
    status: string;
    training_standard: {
        code: string;
        title: string;
        validity_months: number;
    }
};

type User = {
    id: string;
    full_name: string;
    email: string;
};

export default function ManageSessionView({ sessionId, onBack }: ManageSessionViewProps) {
    const [session, setSession] = useState<SessionDetails | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Sub-data states
    const [instructors, setInstructors] = useState<User[]>([]);
    const [participants, setParticipants] = useState<User[]>([]);

    // Available lists for assignment
    const [availableInstructors, setAvailableInstructors] = useState<User[]>([]);
    const [availableParticipants, setAvailableParticipants] = useState<User[]>([]);

    // UI Dialog states
    const [showAddInstructor, setShowAddInstructor] = useState(false);
    const [showEnrollParticipant, setShowEnrollParticipant] = useState(false);

    useEffect(() => {
        fetchSessionData();
    }, [sessionId]);

    const fetchSessionData = async () => {
        setLoading(true);
        // 1. Fetch Session Details
        const { data: sData } = await supabase
            .from('sessions')
            .select(`*, training_standard:training_standards(code, title, validity_months)`)
            .eq('id', sessionId)
            .single();
        if (sData) setSession(sData as any);

        // 2. Fetch Assigned Instructors
        const { data: iData } = await supabase
            .from('session_instructors')
            .select('instructor:users(id, full_name, email)')
            .eq('session_id', sessionId);
        if (iData) setInstructors(iData.map((d: any) => d.instructor));

        // 3. Fetch Enrolled Participants
        const { data: pData } = await supabase
            .from('session_participants')
            .select('participant:users(id, full_name, email)')
            .eq('session_id', sessionId);
        if (pData) setParticipants(pData.map((d: any) => d.participant));

        setLoading(false);
    };

    // --- Actions ---
    const handleStatusUpdate = async (newStatus: string) => {
        if (!confirm(`Are you sure you want to change status to ${newStatus.toUpperCase()}? This is an official action.`)) return;

        const { error } = await supabase
            .from('sessions')
            .update({ status: newStatus })
            .eq('id', sessionId);

        if (!error) fetchSessionData();
        else alert("Status update failed: " + error.message);
    };

    const handleIssueCertificates = async () => {
        if (!confirm("This will issue official certificates to all passed participants. Proceed?")) return;
        // Placeholder for issuance logic
        alert("Certificate issuance process initiated.");
    };

    // --- Fetchers for Dialogs ---
    const fetchAvailableInstructors = async () => {
        const assignedIds = instructors.map(i => i.id);
        const { data } = await supabase.from('users').select('id, full_name, email').eq('role', 'instructor');
        if (data) setAvailableInstructors(data.filter(u => !assignedIds.includes(u.id)));
        setShowAddInstructor(true);
    };

    const fetchAvailableParticipants = async () => {
        const enrolledIds = participants.map(p => p.id);
        const { data } = await supabase.from('users').select('id, full_name, email').eq('role', 'participant');
        if (data) setAvailableParticipants(data.filter(u => !enrolledIds.includes(u.id)));
        setShowEnrollParticipant(true);
    };

    // --- Assignment Handlers ---
    const handleAddInstructor = async (instructorId: string) => {
        const { error } = await supabase.from('session_instructors').insert([{ session_id: sessionId, instructor_id: instructorId }]);
        if (!error) { fetchSessionData(); setShowAddInstructor(false); }
    };

    const handleEnrollParticipant = async (participantId: string) => {
        const { error } = await supabase.from('session_participants').insert([{ session_id: sessionId, participant_id: participantId, status: 'enrolled' }]);
        if (!error) { fetchSessionData(); setShowEnrollParticipant(false); }
    };

    const handleRemoveInstructor = async (instructorId: string) => {
        const { error } = await supabase.from('session_instructors').delete().eq('session_id', sessionId).eq('instructor_id', instructorId);
        if (!error) fetchSessionData();
    };

    if (loading) return <div className="p-12 text-center animate-pulse text-muted-foreground font-medium">Loading Command Center...</div>;
    if (!session) return <div className="p-12 text-center text-red-500 font-bold">Session record not found.</div>;

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. Header & Actions */}
            <div className="flex flex-col gap-6 border-b border-border pb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors w-fit">
                    <ArrowLeft className="h-4 w-4" /> Back to List
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded font-mono border border-blue-200 dark:border-blue-800">
                                {session.training_standard.code}
                            </span>
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${session.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                session.status === 'planned' ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400' :
                                    'bg-red-100 text-red-700 border-red-200'
                                }`}>
                                {session.status}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">{session.training_standard.title}</h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-medium">
                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(session.start_date).toLocaleDateString()} — {new Date(session.end_date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {session.location}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {session.status === 'planned' && (
                            <button onClick={() => handleStatusUpdate('active')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition-all">
                                Activate Session
                            </button>
                        )}
                        {session.status === 'active' && (
                            <button onClick={() => handleStatusUpdate('completed')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition-all">
                                Complete Session
                            </button>
                        )}
                        {session.status === 'completed' && (
                            <button onClick={handleIssueCertificates} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                                <Award className="w-4 h-4" /> Issue Certificates
                            </button>
                        )}
                        {session.status !== 'cancelled' && session.status !== 'completed' && (
                            <button onClick={() => handleStatusUpdate('cancelled')} className="bg-white dark:bg-card border border-border hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 px-5 py-2 rounded-lg font-medium text-sm transition-all">
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Tabs */}
            <div className="border-b border-border flex gap-1 overflow-x-auto">
                <TabButton id="overview" label="Overview" icon={LayoutDashboard} />
                <TabButton id="instructors" label="Instructors" icon={UserCog} />
                <TabButton id="participants" label="Participants" icon={Users} />
                <TabButton id="plan" label="Training Plan" icon={List} />
                <TabButton id="documents" label="Documents" icon={FileText} />
                <TabButton id="assessments" label="Assessments" icon={ClipboardCheck} />
                <TabButton id="compliance" label="Compliance" icon={Shield} />
            </div>

            {/* 3. Tab Content */}
            <div className="min-h-[400px]">

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-xl border border-border bg-card">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4">Validity & Certification</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-2xl font-bold text-foreground">{session.training_standard.validity_months} Months</div>
                                    <div className="text-sm text-muted-foreground">Standard Validity Period</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">0</div>
                                    <div className="text-sm text-muted-foreground">Certificates Issued</div>
                                </div>
                            </div>
                        </div>
                        {/* More stats can go here */}
                    </div>
                )}

                {activeTab === 'instructors' && (
                    <div className="space-y-4 max-w-4xl">
                        <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border border-border">
                            <h3 className="font-bold text-foreground">Assigned Instructors ({instructors.length})</h3>
                            <button onClick={fetchAvailableInstructors} className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5">
                                <UserPlus className="w-3.5 h-3.5" /> Assign
                            </button>
                        </div>

                        {showAddInstructor && (
                            <div className="bg-card p-4 rounded-xl border border-border animate-in slide-in-from-top-2">
                                <div className="text-sm font-bold mb-3">Select Instructor</div>
                                <div className="flex flex-wrap gap-2">
                                    {availableInstructors.map(inst => (
                                        <button key={inst.id} onClick={() => handleAddInstructor(inst.id)} className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md text-sm border border-border">
                                            {inst.full_name}
                                        </button>
                                    ))}
                                    {availableInstructors.length === 0 && <span className="text-sm text-muted-foreground italic">No available instructors.</span>}
                                </div>
                                <button onClick={() => setShowAddInstructor(false)} className="text-xs text-blue-500 mt-2 hover:underline">Close</button>
                            </div>
                        )}

                        <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
                            {instructors.map(inst => (
                                <div key={inst.id} className="p-4 flex justify-between items-center hover:bg-muted/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                            {inst.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-foreground">{inst.full_name}</div>
                                            <div className="text-xs text-muted-foreground">{inst.email}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveInstructor(inst.id)} className="text-muted-foreground hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                            {instructors.length === 0 && <div className="p-8 text-center text-muted-foreground italic text-sm">No instructors assigned.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'participants' && (
                    <div className="space-y-4 max-w-4xl">
                        <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border border-border">
                            <h3 className="font-bold text-foreground">Enrolled Participants ({participants.length})</h3>
                            <button onClick={fetchAvailableParticipants} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5">
                                <UserPlus className="w-3.5 h-3.5" /> Enroll
                            </button>
                        </div>

                        {showEnrollParticipant && (
                            <div className="bg-card p-4 rounded-xl border border-border animate-in slide-in-from-top-2">
                                <div className="text-sm font-bold mb-3">Select Participant</div>
                                <div className="flex flex-wrap gap-2">
                                    {availableParticipants.map(part => (
                                        <button key={part.id} onClick={() => handleEnrollParticipant(part.id)} className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md text-sm border border-border">
                                            {part.full_name}
                                        </button>
                                    ))}
                                    {availableParticipants.length === 0 && <span className="text-sm text-muted-foreground italic">No available participants.</span>}
                                </div>
                                <button onClick={() => setShowEnrollParticipant(false)} className="text-xs text-blue-500 mt-2 hover:underline">Close</button>
                            </div>
                        )}

                        <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
                            {participants.map(part => (
                                <div key={part.id} className="p-4 flex justify-between items-center hover:bg-muted/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                                            {part.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-foreground">{part.full_name}</div>
                                            <div className="text-xs text-muted-foreground">{part.email}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold uppercase text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                        Enrolled
                                    </span>
                                </div>
                            ))}
                            {participants.length === 0 && <div className="p-8 text-center text-muted-foreground italic text-sm">No participants enrolled.</div>}
                        </div>
                    </div>
                )}

                {/* Skeletons for other tabs */}
                {(activeTab === 'plan' || activeTab === 'documents' || activeTab === 'assessments' || activeTab === 'compliance') && (
                    <div className="p-12 text-center border border-dashed border-border rounded-xl bg-muted/5">
                        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-foreground">Restricted Authority Area</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mt-2">
                            This module ({activeTab.toUpperCase()}) is currently under strict access control or development.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
