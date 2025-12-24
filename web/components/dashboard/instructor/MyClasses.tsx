'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Search, MoreHorizontal, Settings, BookOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Course {
    id: string;
    title_en: string;
    title_fr: string;
    status: string;
    thumbnail_url?: string;
    enrollment_count?: number;
}

interface MyClassesProps {
    instructorId: string;
    onManageClass: (courseId: string) => void;
    showCreateModal?: boolean;
    setShowCreateModal?: (show: boolean) => void;
}

export default function MyClasses({
    instructorId,
    onManageClass,
    showCreateModal: externalShowModal,
    setShowCreateModal: setExternalShowModal
}: MyClassesProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [internalShowModal, setInternalShowModal] = useState(false);

    const showCreateModal = externalShowModal !== undefined ? externalShowModal : internalShowModal;
    const setShowCreateModal = setExternalShowModal !== undefined ? setExternalShowModal : setInternalShowModal;

    const [isCreating, setIsCreating] = useState(false);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title_en: '',
        title_fr: '',
        description_en: '',
        description_fr: '',
        max_capacity: 30,
        status: 'upcoming' as 'upcoming' | 'active' | 'completed',
        thumbnail_url: ''
    });

    const fetchCourses = async () => {
        setLoading(true);
        const { data: coursesData, error } = await supabase
            .from('courses')
            .select('*')
            .eq('instructor_id', instructorId);

        if (coursesData) {
            const enrichedCourses = coursesData.map(c => ({
                ...c,
                enrollment_count: 0 // Fetch real enrollment count here if available
            }));
            setCourses(enrichedCourses);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (instructorId) fetchCourses();
    }, [instructorId]);

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title_en || !formData.title_fr) return;

        setIsCreating(true);

        let finalThumbnailUrl = formData.thumbnail_url;
        if (thumbnailFile) {
            const fileExt = thumbnailFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { data, error: uploadError } = await supabase.storage
                .from('course-thumbnails')
                .upload(fileName, thumbnailFile);

            if (uploadError) {
                console.error('Thumbnail upload error:', uploadError);
                alert('Thumbnail upload failed, but course will still be created.');
            } else if (data) {
                const { data: urlData } = supabase.storage.from('course-thumbnails').getPublicUrl(fileName);
                finalThumbnailUrl = urlData.publicUrl;
            }
        }

        const { error } = await supabase.from('courses').insert({
            ...formData,
            thumbnail_url: finalThumbnailUrl,
            instructor_id: instructorId
        });

        if (!error) {
            setShowCreateModal(false);
            setFormData({
                title_en: '',
                title_fr: '',
                description_en: '',
                description_fr: '',
                max_capacity: 30,
                status: 'upcoming',
                thumbnail_url: ''
            });
            setThumbnailFile(null);
            fetchCourses();
            if (setExternalShowModal) setExternalShowModal(false);
        } else {
            console.error('Error creating course:', error);
            alert(`Failed to create course: ${error.message}`);
        }
        setIsCreating(false);
    };

    const filteredCourses = courses.filter(c =>
        (c.title_en?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.title_fr?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your active teaching curriculum</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" /> Create New Course
                </button>
            </div>

            <div className="flex gap-4 items-center bg-card p-4 rounded-xl border border-border">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search your courses..."
                        className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-card h-64 rounded-2xl border border-border"></div>
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">No courses found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <motion.div
                            layout
                            key={course.id}
                            whileHover={{ y: -5 }}
                            className="bg-card rounded-2xl shadow-sm border border-border p-5 transition-all hover:shadow-xl group"
                        >
                            <div className="h-40 w-full rounded-xl bg-muted mb-4 overflow-hidden relative border border-border/50">
                                <img
                                    src={course.thumbnail_url || `https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=600&auto=format&fit=crop`}
                                    alt={course.title_en}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                        {course.status}
                                    </span>
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">{course.title_en}</h3>
                            <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[32px]">{course.title_fr}</p>

                            <div className="flex items-center justify-between mb-5 pt-4 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-6 w-6 rounded-full border-2 border-card bg-secondary overflow-hidden">
                                                <img src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} alt="Student" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground">+{course.enrollment_count} Students</span>
                                </div>
                                <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>

                            <button
                                onClick={() => onManageClass(course.id)}
                                className="w-full bg-secondary hover:bg-muted text-foreground font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground"
                            >
                                <Settings className="h-4 w-4" /> Manage Class
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* CREATE COURSE MODAL */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Create New Course</h2>
                                    <p className="text-xs text-muted-foreground">Launch a new training curriculum</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-muted rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5 text-muted-foreground" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Course Title (EN)</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Aviation Safety 101"
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            value={formData.title_en}
                                            onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Titre du Cours (FR)</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Sécurité Aérienne 101"
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            value={formData.title_fr}
                                            onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description (EN)</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Detailed course description in English..."
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                        value={formData.description_en}
                                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description (FR)</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Description détaillée du cours en Français..."
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                        value={formData.description_fr}
                                        onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Max Capacity</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            value={formData.max_capacity}
                                            onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Initial Status</label>
                                        <select
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        >
                                            <option value="upcoming">Upcoming</option>
                                            <option value="active">Active</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Course Thumbnail</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-20 w-32 rounded-xl bg-muted overflow-hidden border border-border flex items-center justify-center">
                                            {thumbnailFile ? (
                                                <img src={URL.createObjectURL(thumbnailFile)} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <BookOpen className="h-6 w-6 text-muted-foreground opacity-20" />
                                            )}
                                        </div>
                                        <label className="flex-1 cursor-pointer">
                                            <div className="bg-secondary hover:bg-muted border border-border rounded-xl px-4 py-3 text-sm font-bold text-center transition-all">
                                                {thumbnailFile ? 'Change Image' : 'Upload Thumbnail'}
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-6 py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="flex-1 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        {isCreating ? 'Creating...' : 'Create Course'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
