"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { uploadCourseContent } from '@/lib/storage';
import { toast } from 'sonner';
import { 
    X, 
    Check, 
    Type, 
    Image as ImageIcon, 
    Video, 
    FileText, 
    Volume2, 
    Layout, 
    Code, 
    Link, 
    HelpCircle, 
    MessageSquare,
    Save,
    Eye,
    ChevronRight,
    Search,
    GripVertical,
    Trash2,
    Bold,
    Italic,
    Underline,
    AlignLeft,
    Plus,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Block {
    id: string;
    type: string;
    content: any;
    order_index: number;
}

interface CourseNotesEditorProps {
    note: any;
    courseName: string;
    onClose: (updated: boolean) => void;
    initialPreview?: boolean;
    isReadOnly?: boolean;
}

const BLOCK_TYPES = [
    { id: 'text', label: 'Text', icon: Type, color: 'bg-blue-50 text-blue-600' },
    { id: 'image', label: 'Image', icon: ImageIcon, color: 'bg-purple-50 text-purple-600' },
    { id: 'video', label: 'Video', icon: Video, color: 'bg-rose-50 text-rose-600' },
    { id: 'pdf', label: 'PDF Viewer', icon: FileText, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'audio', label: 'Audio', icon: Volume2, color: 'bg-amber-50 text-amber-600' },
    { id: 'banner', label: 'Banner', icon: Layout, color: 'bg-indigo-50 text-indigo-600' },
    { id: 'resource', label: 'Resource', icon: FileText, color: 'bg-cyan-50 text-cyan-600' },
    { id: 'code', label: 'Code', icon: Code, color: 'bg-gray-50 text-gray-600' },
    { id: 'embed', label: 'Embed', icon: Link, color: 'bg-pink-50 text-pink-600' },
];

const EDUCATIONAL_TOOLS = [
    { id: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'bg-purple-50 text-purple-600' },
    { id: 'open_ended', label: 'Open-ended', icon: MessageSquare, color: 'bg-purple-50 text-purple-600' },
];

export default function CourseNotesEditor({ note, courseName, onClose, initialPreview = false, isReadOnly = false }: CourseNotesEditorProps) {
    const [title, setTitle] = useState(note.title);
    const [status, setStatus] = useState(note.status);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [isPreview, setIsPreview] = useState(isReadOnly || initialPreview);

    useEffect(() => {
        if (note.id) {
            fetchBlocks();
        } else {
            setLoading(false);
        }
    }, [note.id]);

    const fetchBlocks = async () => {
        const { data } = await supabase
            .from('course_content_blocks')
            .select('*')
            .eq('note_id', note.id)
            .order('order_index', { ascending: true });
        setBlocks(data || []);
        setLoading(false);
    };

    const addBlock = (type: string) => {
        const newBlock = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: type === 'text' ? { html: '<p>Start writing...</p>' } : {},
            order_index: blocks.length
        };
        setBlocks([...blocks, newBlock as Block]);
        setActiveBlockId(newBlock.id);
    };

    const updateBlockContent = (id: string, newContent: any) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, content: newContent } : b));
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let noteId = note.id;
            
            // 1. Save/Update Note header
            if (!noteId) {
                const { data: newNote, error } = await supabase
                    .from('course_notes')
                    .insert({ course_id: note.course_id, title, status })
                    .select()
                    .single();
                if (error) throw error;
                noteId = newNote.id;
            } else {
                await supabase
                    .from('course_notes')
                    .update({ title, status, updated_at: new Date().toISOString() })
                    .eq('id', noteId);
            }

            // 2. Sync Blocks (Delete old, Insert current)
            // Simplified sync: delete all and re-insert
            await supabase.from('course_content_blocks').delete().eq('note_id', noteId);
            
            if (blocks.length > 0) {
                const blocksToInsert = blocks.map((b, idx) => ({
                    note_id: noteId,
                    type: b.type,
                    content: b.content,
                    order_index: idx
                }));
                await supabase.from('course_content_blocks').insert(blocksToInsert);
            }

            setSaving(false);
            toast.success("Note saved successfully");
            onClose(true); // This triggers fetchData in parent
        } catch (e) {
            console.error(e);
            toast.error("Failed to save note");
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        setStatus('published');
        // We need to wait for status to update or pass it directly
        setSaving(true);
        try {
            let noteId = note.id;
            if (!noteId) {
                const { data: newNote, error } = await supabase
                    .from('course_notes')
                    .insert({ course_id: note.course_id, title, status: 'published' })
                    .select()
                    .single();
                if (error) throw error;
                noteId = newNote.id;
            } else {
                await supabase
                    .from('course_notes')
                    .update({ title, status: 'published', updated_at: new Date().toISOString() })
                    .eq('id', noteId);
            }

            await supabase.from('course_content_blocks').delete().eq('note_id', noteId);
            if (blocks.length > 0) {
                await supabase.from('course_content_blocks').insert(blocks.map((b, idx) => ({
                    note_id: noteId,
                    type: b.type,
                    content: b.content,
                    order_index: idx
                })));
            }
            setSaving(false);
            toast.success("Note published successfully!");
            onClose(true);
        } catch (e) {
            console.error(e);
            toast.error("Failed to publish note");
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f1a] flex flex-col">
            {/* Minimal Top Bar */}
            <div className="flex items-center justify-between px-10 py-6 bg-white dark:bg-[#0f0f1a] sticky top-0 z-[110]">
                {/* Left: Edit Mode Toggle */}
                <div className="flex items-center gap-4">
                    {!isReadOnly && (
                        <button 
                            onClick={() => setIsPreview(false)}
                            className={cn(
                                "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                !isPreview 
                                    ? "bg-black text-white shadow-xl shadow-black/10" 
                                    : "text-gray-400 hover:text-black"
                            )}
                        >
                            Edit Mode
                        </button>
                    )}
                    {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-300" />}
                </div>

                {/* Center: Status Indicator (Minimal) */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status === 'published' ? "bg-emerald-500" : "bg-amber-500")} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{status}</span>
                </div>

                {/* Right: Preview & Actions */}
                <div className="flex items-center gap-4">
                    {!isReadOnly && (
                        <button 
                            onClick={() => setIsPreview(true)}
                            className={cn(
                                "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                isPreview 
                                    ? "bg-purple-600 text-white shadow-xl shadow-purple-500/20" 
                                    : "text-gray-400 hover:text-purple-600"
                            )}
                        >
                            Preview
                        </button>
                    )}
                    
                    <div className="w-px h-4 bg-gray-100 mx-2" />

                    <button 
                        onClick={() => onClose(true)}
                        className="p-2.5 hover:bg-gray-50 rounded-full transition-all text-gray-400 hover:text-black"
                        title="Close Editor"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Editor Area */}
                <div className={cn("flex-1 overflow-y-auto px-8 py-12 transition-all", isPreview ? "bg-white dark:bg-[#0f0f1a]" : "bg-transparent")}>
                    <div className={cn("mx-auto space-y-12", isPreview ? "max-w-4xl" : "max-w-3xl")}>
                        {/* Title Section */}
                        {!isPreview && (
                            <div className="space-y-4">
                                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none truncate">{courseName}</h1>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter lesson title..."
                                    className="w-full bg-transparent border-none text-2xl font-black text-gray-900 dark:text-white placeholder:text-gray-200 outline-none focus:ring-0"
                                />
                            </div>
                        )}

                        {isPreview && (
                            <div className="border-b border-gray-100 pb-12 mb-12">
                                <p className="text-xs font-black text-purple-600 uppercase tracking-[0.2em] mb-4">Lesson Preview</p>
                                <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{title}</h1>
                                <div className="flex items-center gap-4 mt-8 text-gray-400 font-bold text-xs uppercase tracking-widest">
                                    <span>{courseName}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-200" />
                                    <span>Published by You</span>
                                </div>
                            </div>
                        )}

                        {/* Blocks Section */}
                        <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="space-y-6 pb-40">
                            {blocks.map((block) => (
                                <Reorder.Item 
                                    key={block.id} 
                                    value={block}
                                    dragListener={!isPreview}
                                    className={cn(
                                        "group relative bg-white dark:bg-[#1a1a2e] rounded-[2rem] p-8 border transition-all",
                                        isPreview ? "border-transparent px-0" : (activeBlockId === block.id ? "border-purple-500 shadow-xl shadow-purple-500/5 ring-4 ring-purple-500/5" : "border-gray-100 dark:border-white/5 hover:border-purple-200")
                                    )}
                                    onClick={() => !isPreview && setActiveBlockId(block.id)}
                                >
                                    {!isPreview && (
                                        <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                                            <GripVertical className="w-5 h-5 text-gray-300 cursor-grab" />
                                            <button onClick={() => removeBlock(block.id)} className="p-1 rounded-md hover:bg-rose-50 text-rose-400 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {block.type === 'text' && (
                                        <div className="space-y-4">
                                            {!isPreview && (
                                                <div className="flex items-center gap-2 border-b border-gray-50 dark:border-white/5 pb-4 mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1.5 rounded-lg hover:bg-gray-100"><Bold className="w-4 h-4" /></button>
                                                    <button className="p-1.5 rounded-lg hover:bg-gray-100"><Italic className="w-4 h-4" /></button>
                                                    <button className="p-1.5 rounded-lg hover:bg-gray-100"><Underline className="w-4 h-4" /></button>
                                                </div>
                                            )}
                                            <div 
                                                contentEditable={!isPreview}
                                                dangerouslySetInnerHTML={{ __html: block.content.html }}
                                                onBlur={(e) => updateBlockContent(block.id, { html: e.currentTarget.innerHTML })}
                                                className={cn(
                                                    "min-h-[20px] text-lg font-medium text-gray-700 dark:text-gray-300 outline-none leading-relaxed",
                                                    isPreview && "text-xl leading-loose text-gray-800"
                                                )}
                                            />
                                        </div>
                                    )}

                                    {block.type === 'image' && (
                                        <div className="space-y-4">
                                            <div 
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.onchange = async (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0];
                                                        if (file) {
                                                            updateBlockContent(block.id, { ...block.content, isUploading: true });
                                                            const { url, error } = await uploadCourseContent(file);
                                                            if (error) {
                                                                toast.error('Upload failed: ' + error.message);
                                                                updateBlockContent(block.id, { ...block.content, isUploading: false });
                                                            } else {
                                                                updateBlockContent(block.id, { ...block.content, fileName: file.name, locallySelected: true, url, isUploading: false });
                                                            }
                                                        }
                                                    };
                                                    input.click();
                                                }}
                                                className="aspect-video relative bg-gray-50 dark:bg-black/20 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 group/drop cursor-pointer hover:bg-purple-50/30 transition-all overflow-hidden"
                                            >
                                                {block.content.isUploading ? (
                                                    <div className="flex flex-col items-center z-10">
                                                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
                                                        <p className="text-xs font-black text-purple-600 uppercase tracking-widest">Uploading...</p>
                                                    </div>
                                                ) : block.content.url ? (
                                                    <>
                                                        <img src={block.content.url} alt="Uploaded" className="w-full h-full object-contain absolute inset-0 z-0" />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/drop:opacity-100 transition-opacity flex flex-col items-center justify-center z-10">
                                                            <ImageIcon className="w-8 h-8 text-white mb-2" />
                                                            <p className="text-xs font-black text-white uppercase tracking-widest">Click to Replace</p>
                                                        </div>
                                                    </>
                                                ) : block.content.locallySelected ? (
                                                    <div className="flex flex-col items-center z-10">
                                                        <Check className="w-8 h-8 text-emerald-500 mb-2" />
                                                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">{block.content.fileName}</p>
                                                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Ready</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center z-10">
                                                        <ImageIcon className="w-12 h-12 text-gray-200 group-hover/drop:text-purple-300 transition-colors" />
                                                        <p className="text-xs font-black text-gray-400 mt-4 uppercase tracking-widest">Click to Upload Image</p>
                                                    </div>
                                                )}
                                            </div>
                                            <input type="text" placeholder="Add image caption..." className="w-full bg-transparent border-none text-sm font-bold text-gray-400 outline-none" />
                                        </div>
                                    )}

                                    {/* Video, PDF, Audio with upload triggers */}
                                    {['video', 'pdf', 'audio'].includes(block.type) && (
                                        <div 
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.onchange = async (e) => {
                                                    const file = (e.target as HTMLInputElement).files?.[0];
                                                    if (file) {
                                                        updateBlockContent(block.id, { ...block.content, isUploading: true });
                                                        const { url, error } = await uploadCourseContent(file);
                                                        if (error) {
                                                            toast.error('Upload failed: ' + error.message);
                                                            updateBlockContent(block.id, { ...block.content, isUploading: false });
                                                        } else {
                                                            updateBlockContent(block.id, { ...block.content, fileName: file.name, locallySelected: true, url, isUploading: false });
                                                        }
                                                    }
                                                };
                                                input.click();
                                            }}
                                            className="py-12 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 cursor-pointer hover:bg-purple-50/20 transition-all relative group/media"
                                        >
                                            {block.content.isUploading ? (
                                                <div className="flex flex-col items-center">
                                                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
                                                    <p className="text-xs font-black text-purple-600 uppercase tracking-widest">Uploading...</p>
                                                </div>
                                            ) : block.content.url ? (
                                                <div className="flex flex-col items-center group-hover/media:opacity-50 transition-opacity">
                                                    {block.type === 'video' ? <Video className="w-8 h-8 text-emerald-500 mb-2" /> : block.type === 'pdf' ? <FileText className="w-8 h-8 text-emerald-500 mb-2" /> : <Volume2 className="w-8 h-8 text-emerald-500 mb-2" />}
                                                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">{block.content.fileName}</p>
                                                    <a href={block.content.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:text-blue-600 mt-2 uppercase font-bold" onClick={(e) => { e.stopPropagation(); }}>View File</a>
                                                </div>
                                            ) : block.content.locallySelected ? (
                                                <div className="flex flex-col items-center">
                                                    <FileText className="w-8 h-8 text-emerald-500 mb-2" />
                                                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">{block.content.fileName}</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    {block.type === 'video' ? <Video className="w-8 h-8 text-gray-200 mb-2" /> : block.type === 'pdf' ? <FileText className="w-8 h-8 text-gray-200 mb-2" /> : <Volume2 className="w-8 h-8 text-gray-200 mb-2" />}
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Click to Upload {block.type.toUpperCase()}</p>
                                                </div>
                                            )}
                                            {block.content.url && (
                                                <div className="absolute inset-0 opacity-0 group-hover/media:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none">
                                                    <p className="text-xs font-black text-purple-600 uppercase tracking-widest bg-purple-50 rounded-lg px-4 py-2 pointer-events-auto">Click to Replace</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>

                        {blocks.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                                <Plus className="w-12 h-12 text-gray-300 mb-4" />
                                <p className="text-lg font-black text-gray-400 uppercase tracking-widest">Start Building Curriculum</p>
                                <p className="text-sm font-medium text-gray-300 mt-1 italic italic">Select a content type from the right panel</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Panel */}
                <AnimatePresence>
                    {!isPreview && !isReadOnly && (
                        <motion.div 
                            initial={{ x: 300 }}
                            animate={{ x: 0 }}
                            exit={{ x: 300 }}
                            className="w-[320px] bg-white dark:bg-[#1a1a2e] border-l border-gray-100 dark:border-white/5 p-8 flex flex-col gap-10"
                        >
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Add Content</h2>
                                    <X className="w-5 h-5 text-gray-300 cursor-pointer" />
                                </div>
                                
                                <div className="space-y-6">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Content Types</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {BLOCK_TYPES.map(type => (
                                            <button 
                                                key={type.id}
                                                onClick={() => addBlock(type.id)}
                                                className="group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/5 transition-all text-center aspect-square"
                                            >
                                                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", type.color)}>
                                                    <type.icon className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 group-hover:text-purple-600">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Educational Tools</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {EDUCATIONAL_TOOLS.map(type => (
                                        <button 
                                            key={type.id}
                                            className="group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-purple-200 hover:shadow-lg transition-all aspect-square"
                                        >
                                            <div className={cn("p-3 rounded-2xl", type.color)}>
                                                <type.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-auto space-y-4">
                                <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
                                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">Publish Note</p>
                                    <p className="text-xs font-bold text-gray-500 leading-relaxed mb-4 italic">Once published, this note will be visible to all trainees joined in this course.</p>
                                    <button 
                                        onClick={handlePublish}
                                        disabled={saving}
                                        className={cn(
                                            "w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md",
                                            status === 'published' ? "bg-emerald-500 text-white" : "bg-purple-600 text-white"
                                        )}
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (status === 'published' ? 'Published' : 'Publish Now')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
