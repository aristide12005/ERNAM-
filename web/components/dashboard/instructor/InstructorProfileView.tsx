"use client";

import { User } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function InstructorProfileView() {
    const { profile } = useAuth();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Profile & Settings</h1>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                        {profile?.full_name?.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{profile?.full_name}</h2>
                        <p className="text-gray-500 capitalize">{profile?.role}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                        <input disabled value={profile?.email || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500" />
                    </div>
                    <div className="pt-4">
                        <h3 className="font-bold text-gray-900 mb-2">Preferences</h3>
                        <p className="text-sm text-gray-500">Notification and display settings coming soon.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
