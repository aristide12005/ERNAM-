"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, Download, Database, ShieldCheck, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock types for now
type ArchiveRecord = {
    id: string;
    year: number;
    license_number: string;
    course_name_snapshot: string;
    diploma_url: string;
    user: {
        full_name: string;
    }
}

export default function ArchivesPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const searchArchives = async (searchTerm: string) => {
        setLoading(true);
        // Join with users table to get names
        const { data, error } = await supabase
            .from('archives')
            .select(`
        *,
        user:users (full_name)
      `)
            .or(`license_number.ilike.%${searchTerm}%,course_name_snapshot.ilike.%${searchTerm}%`)
            .limit(20);

        if (data) {
            setResults(data);
        }
        setLoading(false);
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 1) {
                searchArchives(query);
            } else {
                // Load recent by default
                searchArchives('');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Digital Vault
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Secure, searchable verification of all historical certifications.
                </p>
            </motion.div>

            {/* Search Bar */}
            <div className="relative mb-12 max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-4 bg-secondary/50 border border-border rounded-xl text-white placeholder-muted-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-xl backdrop-blur-sm"
                    placeholder="Search by License Number, Name, or Course..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {loading && <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>}
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-card/50 border border-border hover:border-blue-500/50 rounded-xl p-6 transition-all hover:bg-secondary/60 hover:shadow-2xl overflow-hidden cursor-pointer"
                    >
                        {/* Cinematic Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <div className="flex justify-between items-start mb-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                                VERIFIED
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                            {item.course_name_snapshot}
                        </h3>

                        <p className="text-muted-foreground text-sm mb-6">
                            Issued to <span className="text-white font-medium">{item.user?.full_name}</span> in <span className="text-white font-medium">{item.year}</span>
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 font-mono border-t border-border pt-4">
                            <div className="flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                {item.license_number}
                            </div>
                            <div className="ml-auto flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                                <Download className="h-4 w-4" />
                                PDF
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {results.length === 0 && !loading && (
                <div className="text-center py-20 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No records found in the vault.</p>
                </div>
            )}

        </div>
    )
}
