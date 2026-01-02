'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    CheckCircle2,
    Circle,
    Clock,
    MapPin,
    MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useFormatter } from 'next-intl';

interface Todo {
    id: string;
    title: string;
    is_completed: boolean;
    due_date?: string;
}

interface Event {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    type: string;
    location?: string;
}

export default function Schedule({ userId }: { userId: string }) {
    const t = useTranslations('InstructorDashboard');
    const format = useFormatter();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [newTodo, setNewTodo] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        // Todos
        const { data: todosData } = await supabase
            .from('personal_todos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (todosData) setTodos(todosData);

        // Events
        const { data: eventsData } = await supabase
            .from('calendar_events')
            .select('*')
            .order('start_time', { ascending: true });
        if (eventsData) setEvents(eventsData);

        setLoading(false);
    };

    useEffect(() => {
        if (userId) fetchData();
    }, [userId]);

    const handleAddTodo = async () => {
        if (!newTodo.trim()) return;
        const { error } = await supabase.from('personal_todos').insert({
            user_id: userId,
            title: newTodo
        });
        if (!error) {
            setNewTodo('');
            fetchData();
        }
    };

    const toggleTodo = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('personal_todos')
            .update({ is_completed: !currentStatus })
            .eq('id', id);
        if (!error) fetchData();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            {/* Calendar Main View */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{t('calendar_title')}</h2>
                            <p className="text-sm text-muted-foreground">{t('calendar_desc')}</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-muted rounded-lg border border-border transition-colors">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button className="px-4 py-2 border border-border rounded-lg text-sm font-bold text-foreground">
                                {t('today')}
                            </button>
                            <button className="p-2 hover:bg-muted rounded-lg border border-border transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {events.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-border rounded-xl opacity-40">
                                <CalendarIcon className="h-12 w-12 mx-auto mb-3" />
                                <p>{t('no_events')}</p>
                            </div>
                        ) : (
                            events.map(event => (
                                <div key={event.id} className="flex gap-4 p-4 hover:bg-muted/50 rounded-xl border border-transparent hover:border-border transition-all">
                                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary">
                                        <span className="text-[10px] font-bold uppercase">{format.dateTime(new Date(event.start_time), { month: 'short' })}</span>
                                        <span className="text-xl font-bold">{format.dateTime(new Date(event.start_time), { day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <h3 className="font-bold text-foreground">{event.title}</h3>
                                            <button className="p-1 hover:bg-muted rounded-lg text-muted-foreground">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                {format.dateTime(new Date(event.start_time), { hour: '2-digit', minute: '2-digit' })} - {format.dateTime(new Date(event.end_time), { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {event.location}
                                                </div>
                                            )}
                                            <span className="px-2 py-0.5 bg-secondary text-foreground text-[10px] font-bold rounded uppercase tracking-wider">{event.type}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Daily Tasks / To-Dos */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-foreground">{t('personal_tasks')}</h2>
                        <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-1 rounded-full uppercase">
                            {todos.filter(t => !t.is_completed).length} {t('remaining')}
                        </span>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder={t('add_task')}
                            className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                        />
                        <button
                            onClick={handleAddTodo}
                            className="p-2 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence>
                            {todos.map((todo) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={todo.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${todo.is_completed ? 'bg-secondary/20 border-transparent opacity-50' : 'bg-card border-border shadow-sm'
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleTodo(todo.id, todo.is_completed)}
                                        className="text-primary hover:scale-110 transition-transform"
                                    >
                                        {todo.is_completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
                                    </button>
                                    <span className={`text-sm font-medium flex-1 ${todo.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                        {todo.title}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {todos.length === 0 && (
                            <div className="text-center py-10 opacity-30">
                                <Plus className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-xs">{t('no_tasks')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">{t('instructor_tips')}</h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-xs text-muted-foreground leading-relaxed">
                            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold">1</div>
                            {t('tip_1')}
                        </li>
                        <li className="flex gap-3 text-xs text-muted-foreground leading-relaxed">
                            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold">2</div>
                            {t('tip_2')}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
