"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, ChevronRight, ChevronLeft, Upload, Check, Wand2, Calendar, Users, Shield, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { translateText } from '@/app/actions/translate';


// --- Validation Schema ---
const courseSchema = z.object({
    // Step 1: Identity
    title_en: z.string().min(5, "Title (EN) must be at least 5 characters"),
    title_fr: z.string().min(5, "Title (FR) must be at least 5 characters"),
    description_en: z.string().optional(),
    description_fr: z.string().optional(),
    thumbnail_url: z.string().optional(),
    language: z.enum(['en', 'fr']),

    // Step 2: Logistics
    start_date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), "Invalid Date"),
    end_date: z.string().optional(),
    max_capacity: z.number().min(1, "At least 1 student required").max(500, "Max capacity matches physical limits"),

    // Step 3: Access
    enrollment_mode: z.enum(['auto', 'manual']),
    prerequisites: z.array(z.string()).default([]) // For tags
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseCreationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    instructorId: string;
    onSuccess: () => void;
}

const STEPS = [
    { id: 1, name: "The Hook", icon: Upload, desc: "Branding & First Impressions" },
    { id: 2, name: "Logistics", icon: Calendar, desc: "Schedule & Capacity" },
    { id: 3, name: "Access", icon: Shield, desc: "Security & Enrollment" }
];

export default function CourseCreationWizard({ isOpen, onClose, instructorId, onSuccess }: CourseCreationWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [uploading, setUploading] = useState(false);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            max_capacity: 30,
            enrollment_mode: 'auto',
            title_en: '',
            title_fr: '',
            language: 'en', // Default
            start_date: '',
            end_date: '',
            prerequisites: [],
            description_en: '',
            description_fr: '',
            thumbnail_url: ''
        }
    });

    // Watchers for realtime feedback/logic
    const watchedEnTitle = watch('title_en');

    // Actions
    // Actions
    const handleAutoTranslate = async () => {
        const lang = watch('language');
        setIsTranslating(true);

        try {
            if (lang === 'en') {
                const source = watch('title_en');
                if (!source) return;
                const translation = await translateText(source, 'fr');
                if (translation) {
                    setValue('title_fr', translation);
                    trigger('title_fr');
                }
            } else {
                const source = watch('title_fr');
                if (!source) return;
                const translation = await translateText(source, 'en');
                if (translation) {
                    setValue('title_en', translation);
                    trigger('title_en');
                }
            }
        } catch (error) {
            console.error("Translation failed", error);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        // Standard Supabase upload logic
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data: uploadData, error } = await supabase.storage
            .from('course-thumbnails')
            .upload(fileName, file);

        if (uploadData) {
            const { data: { publicUrl } } = supabase.storage
                .from('course-thumbnails')
                .getPublicUrl(fileName);
            setThumbnailPreview(publicUrl);
            setValue('thumbnail_url', publicUrl);
        }
        setUploading(false);
    };

    const validateStep = async (nextStep: number) => {
        let fieldsToValidate: (keyof CourseFormData)[] = [];
        if (currentStep === 1) fieldsToValidate = ['title_en', 'title_fr'];
        if (currentStep === 2) fieldsToValidate = ['max_capacity', 'start_date'];

        const isValid = await trigger(fieldsToValidate);
        if (isValid) setCurrentStep(nextStep);
    };

    const onSubmit = async (data: CourseFormData) => {
        setIsSubmitting(true);

        try {
            // LAYER 3: RPC Call for Atomic Creation
            const { data: rpcData, error } = await supabase.rpc('create_new_course', {
                p_title_en: data.title_en,
                p_title_fr: data.title_fr,
                p_description_en: data.description_en,
                p_description_fr: data.description_fr,
                p_start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
                p_end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
                p_max_capacity: data.max_capacity,
                p_enrollment_mode: data.enrollment_mode,
                p_thumbnail_url: data.thumbnail_url,
                p_course_status: 'draft'
            });

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Creation failed:", err);
            alert("Failed to create course: " + (err.message || "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" // z-index 40 ensures it's below sheet (z-50)
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-2 right-2 bottom-2 w-full md:w-[600px] z-50 bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-100 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white/50 backdrop-blur sticky top-0">
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                    Create New Course
                                </h2>
                                <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1">
                                    Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 bg-slate-100 w-full">
                            <motion.div
                                className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <form id="wizard-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                                {/* STEP 1: IDENTITY */}
                                {currentStep === 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Thumbnail Dropzone */}
                                        <div className="group relative border-2 border-dashed border-slate-200 rounded-2xl p-8 transition-colors hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/10 text-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleThumbnailUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            {thumbnailPreview ? (
                                                <div className="relative aspect-video rounded-lg overflow-hidden shadow-sm">
                                                    <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 py-4">
                                                    <div className="p-4 bg-white rounded-full shadow-sm">
                                                        {uploading ? <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" /> : <Upload className="h-6 w-6 text-blue-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700">Upload Course Thumbnail</p>
                                                        <p className="text-xs text-slate-400 mt-1">1920x1080 Recommended</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Language & Titles */}
                                        <div className="space-y-6">
                                            {/* Language Selector */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Primary Language</label>
                                                <div className="flex gap-4">
                                                    <label className={cn("flex-1 border rounded-xl p-4 cursor-pointer transition-all", watch('language') === 'en' ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500" : "border-slate-200 hover:border-blue-300")}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", watch('language') === 'en' ? "border-blue-500" : "border-slate-300")}>
                                                                {watch('language') === 'en' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">English</p>
                                                                <p className="text-xs text-slate-500">Course content will be in English</p>
                                                            </div>
                                                        </div>
                                                        <input type="radio" value="en" {...register('language')} className="hidden" />
                                                    </label>

                                                    <label className={cn("flex-1 border rounded-xl p-4 cursor-pointer transition-all", watch('language') === 'fr' ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500" : "border-slate-200 hover:border-blue-300")}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", watch('language') === 'fr' ? "border-blue-500" : "border-slate-300")}>
                                                                {watch('language') === 'fr' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">Français</p>
                                                                <p className="text-xs text-slate-500">Le contenu sera en Français</p>
                                                            </div>
                                                        </div>
                                                        <input type="radio" value="fr" {...register('language')} className="hidden" />
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Titles - Dynamic Order */}
                                            <div className="space-y-4">
                                                {watch('language') === 'en' ? (
                                                    <>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title (English)</label>
                                                            <input
                                                                {...register('title_en')}
                                                                placeholder="e.g. Aviation Security Fundamentals"
                                                                className={cn("w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all", errors.title_en ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-blue-500")}
                                                            />
                                                            {errors.title_en && <p className="text-xs text-red-500 font-medium">{errors.title_en.message}</p>}
                                                        </div>

                                                        <div className="space-y-1 relative">
                                                            <label className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                                Title (French)
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAutoTranslate}
                                                                    disabled={isTranslating}
                                                                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-[10px] normal-case disabled:opacity-50"
                                                                >
                                                                    {isTranslating ? <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" /> : <Wand2 className="h-3 w-3" />}
                                                                    {isTranslating ? "Translating..." : "Auto-Translate"}
                                                                </button>
                                                            </label>
                                                            <input
                                                                {...register('title_fr')}
                                                                placeholder="e.g. Principes Fondamentaux de la Sécurité Aérienne"
                                                                className={cn("w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all", errors.title_fr ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-blue-500")}
                                                            />
                                                            {errors.title_fr && <p className="text-xs text-red-500 font-medium">{errors.title_fr.message}</p>}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Titre (Français)</label>
                                                            <input
                                                                {...register('title_fr')}
                                                                placeholder="e.g. Principes Fondamentaux de la Sécurité Aérienne"
                                                                className={cn("w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all", errors.title_fr ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-blue-500")}
                                                            />
                                                            {errors.title_fr && <p className="text-xs text-red-500 font-medium">{errors.title_fr.message}</p>}
                                                        </div>

                                                        <div className="space-y-1 relative">
                                                            <label className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                                Title (English)
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAutoTranslate}
                                                                    disabled={isTranslating}
                                                                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-[10px] normal-case disabled:opacity-50"
                                                                >
                                                                    {isTranslating ? <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" /> : <Wand2 className="h-3 w-3" />}
                                                                    {isTranslating ? "Translating..." : "Auto-Translate to English"}
                                                                </button>
                                                            </label>
                                                            <input
                                                                {...register('title_en')}
                                                                placeholder="e.g. Aviation Security Fundamentals"
                                                                className={cn("w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all", errors.title_en ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-blue-500")}
                                                            />
                                                            {errors.title_en && <p className="text-xs text-red-500 font-medium">{errors.title_en.message}</p>}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 2: LOGISTICS */}
                                {currentStep === 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className='p-4 bg-blue-50 rounded-xl border border-blue-100'>
                                            <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                                                <Calendar className="h-4 w-4" /> Schedule
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-blue-700/60 uppercase">Start Date</label>
                                                    <input
                                                        type="date"
                                                        {...register('start_date')}
                                                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-blue-700/60 uppercase">End Date (Opt)</label>
                                                    <input
                                                        type="date"
                                                        {...register('end_date')}
                                                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Capacity</label>
                                                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                    {watch('max_capacity')} Students
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={1}
                                                max={100}
                                                {...register('max_capacity', { valueAsNumber: true })}
                                                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>1 (Private)</span>
                                                <span>100 (Lecture Hall)</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3: ACCESS */}
                                {currentStep === 3 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer"
                                            onClick={() => setValue('enrollment_mode', watch('enrollment_mode') === 'auto' ? 'manual' : 'auto')}>
                                            <div>
                                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                    {watch('enrollment_mode') === 'auto' ? "Open Enrollment" : "Approval Required"}
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-1 max-w-[250px]">
                                                    {watch('enrollment_mode') === 'auto'
                                                        ? "Students can join immediately without review."
                                                        : "Instructors must approve each request manually."}
                                                </p>
                                            </div>
                                            <div className={cn("w-12 h-7 rounded-full p-1 transition-colors duration-300", watch('enrollment_mode') === 'auto' ? "bg-emerald-500" : "bg-blue-600")}>
                                                <div className={cn("w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300", watch('enrollment_mode') === 'manual' && "translate-x-5")} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <Tag className="h-3 w-3" /> Prerequisites
                                            </label>
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
                                                (Tag Input Component Placeholder)
                                                <br />
                                                <span className="text-xs opacity-70">Coming soon in next sprint</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                            </form>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 backdrop-blur flex justify-between items-center">
                            <button
                                onClick={() => currentStep > 1 && setCurrentStep(curr => curr - 1)}
                                disabled={currentStep === 1}
                                className={cn("flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-colors", currentStep === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-200/50")}
                            >
                                <ChevronLeft className="h-4 w-4" /> Back
                            </button>

                            {currentStep < 3 ? (
                                <button
                                    onClick={() => validateStep(currentStep + 1)}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all active:scale-95"
                                >
                                    Next Step <ChevronRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                                >
                                    {isSubmitting ? "Launching..." : "Launch Course"} <Check className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
