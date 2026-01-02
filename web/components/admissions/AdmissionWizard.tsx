'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, ChevronRight, ChevronLeft, Loader2, School } from 'lucide-react';

type Department = {
    id: string;
    name: string;
};

export default function AdmissionWizard() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        dob: '',
        guardian_name: '',
        guardian_phone: '',
        address: '',
        previous_school: '',
        previous_result: '',
        applied_department: '',
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const { data, error } = await supabase.from('departments').select('id, name');
            if (data) setDepartments(data);
        } catch (err) {
            console.log('Departments table might not exist yet', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            // 1. Validate
            if (!formData.full_name || !formData.email) {
                throw new Error('Full Name and Email are required');
            }

            // 2. Submit to Applicants table
            const { error: insertError } = await supabase
                .from('applicants')
                .insert([{
                    ...formData,
                    status: 'pending'
                }]);

            if (insertError) throw insertError;

            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
                <p className="text-gray-600 max-w-md">
                    Thank you for applying to ERNAM. Your application ID has been generated.
                    We will review your details and contact you at <strong>{formData.email}</strong> shortly.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-8 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                >
                    Start New Application
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-blue-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span className={step >= 1 ? 'text-blue-600 font-medium' : ''}>Personal Details</span>
                    <span className={step >= 2 ? 'text-blue-600 font-medium' : ''}>Guardian & Address</span>
                    <span className={step >= 3 ? 'text-blue-600 font-medium' : ''}>Academic Choice</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8">
                    <AnimatePresence mode="wait">

                        {/* Step 1: Personal Info */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                        <School size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Student Information</h2>
                                        <p className="text-gray-500">Let's start with your basic details</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                                        <input
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dob"
                                            value={formData.dob}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Guardian & Address */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Guardian & Address</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Guardian Name</label>
                                        <input
                                            name="guardian_name"
                                            value={formData.guardian_name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Guardian Phone</label>
                                        <input
                                            name="guardian_phone"
                                            value={formData.guardian_phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Permanent Address</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Full street address..."
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Academic Choice */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Academic Background</h2>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Previous School/College</label>
                                            <input
                                                name="previous_school"
                                                value={formData.previous_school}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Previous Result (GPA/Grade)</label>
                                            <input
                                                name="previous_result"
                                                value={formData.previous_result}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Program / Department Preference</label>
                                        <select
                                            name="applied_department"
                                            value={formData.applied_department}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                                        >
                                            <option value="">Select a Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                            {departments.length === 0 && <option value="general">General Science (Default)</option>}
                                        </select>
                                        <p className="text-xs text-gray-500">
                                            {departments.length === 0 ? "No departments found. Standard admission will apply." : "Select the department you wish to enroll in."}
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex justify-between items-center">
                    {step > 1 ? (
                        <button
                            onClick={prevStep}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <ChevronLeft size={20} /> Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:bg-blue-700 hover:shadow-blue-500/25 transition-all"
                        >
                            Continue <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:bg-green-700 hover:shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Submit Application'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
