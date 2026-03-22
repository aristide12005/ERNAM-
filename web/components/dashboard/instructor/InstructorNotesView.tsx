"use client";

import { useState } from 'react';
import { Plus, Trash2, Globe } from 'lucide-react';

export default function InstructorNotesView() {
    const [modules, setModules] = useState([
        { id: 1, name: 'Introduction' },
        { id: 2, name: 'Documents' },
        { id: 3, name: 'Conclusion' }
    ]);
    const [creating, setCreating] = useState(false);

    const moveModule = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index > 0) {
            const newArray = [...modules];
            [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
            setModules(newArray);
        } else if (direction === 'down' && index < modules.length - 1) {
            const newArray = [...modules];
            [newArray[index + 1], newArray[index]] = [newArray[index], newArray[index + 1]];
            setModules(newArray);
        }
    };

    const addModule = () => {
        setModules([...modules, { id: Date.now(), name: `Module ${modules.length + 1}` }]);
    };

    const removeModule = (id: number) => {
        setModules(modules.filter(m => m.id !== id));
    };

    const handlePublish = () => {
        setCreating(true);
        setTimeout(() => {
            alert(`Successfully published ${modules.length} modules! Creation date saved automatically.`);
            setCreating(false);
        }, 800);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6 p-2 max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-end border-b border-gray-200 dark:border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Course Notes Wizard</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">NB: creation date will be automatically saved.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-card border border-border rounded-3xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-blue-900 dark:text-blue-300">Creation Process</h2>
                    <button 
                        onClick={addModule}
                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 p-2.5 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors shadow-sm border border-blue-200 dark:border-blue-800/50"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {modules.map((mod, idx) => (
                        <div key={mod.id} className="group relative flex items-center bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 p-4 rounded-2xl shadow-sm transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700">
                            
                            {/* Grip / Ascend Descend placeholder */}
                            <div className="flex flex-col gap-1 items-center justify-center pr-4 border-r border-gray-200 dark:border-white/10 mr-4 text-gray-400">
                                <button onClick={() => moveModule(idx, 'up')} disabled={idx === 0} className="hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer p-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                </button>
                                <button onClick={() => moveModule(idx, 'down')} disabled={idx === modules.length - 1} className="hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer p-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </button>
                            </div>

                            <input 
                                type="text" 
                                value={mod.name} 
                                onChange={(e) => {
                                    const n = [...modules];
                                    n[idx].name = e.target.value;
                                    setModules(n);
                                }}
                                className="flex-1 bg-transparent border-none outline-none font-semibold text-lg text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                                placeholder="Module Name..."
                            />

                            <button onClick={() => removeModule(mod.id)} className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-end pt-6 border-t border-gray-100 dark:border-white/5">
                    <button 
                        onClick={handlePublish}
                        disabled={creating || modules.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {creating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Globe className="w-5 h-5" />}
                        {creating ? 'PUBLISHING...' : 'PUBLISH'}
                    </button>
                </div>
            </div>
        </div>
    );
}
