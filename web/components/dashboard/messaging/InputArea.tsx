"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, X, Loader2 } from 'lucide-react';

interface InputAreaProps {
    onSendMessage: (text: string, file?: File) => Promise<void>;
    disabled?: boolean;
    replyTo?: { id: string; content: string; sender: string } | null;
    onCancelReply?: () => void;
}

export default function InputArea({ onSendMessage, disabled, replyTo, onCancelReply }: InputAreaProps) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [message]);

    const handleSend = async () => {
        if (!message.trim() || sending || disabled) return;

        setSending(true);
        try {
            await onSendMessage(message, file || undefined); // Parent handles everything
            setMessage('');
            setFile(null);
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 bg-white border-t border-slate-100">
            {/* Context: Reply or File */}
            {(replyTo || file) && (
                <div className="mb-3 mx-2 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
                    {replyTo ? (
                        <div className="flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
                            <div>
                                <p className="text-xs font-bold text-indigo-600">Replying to {replyTo.sender}</p>
                                <p className="text-xs text-slate-500 truncate max-w-[200px]">{replyTo.content}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold uppercase text-xs">
                                {file!.name.split('.').pop()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-700 max-w-[150px] truncate">{file!.name}</span>
                                <span className="text-[10px] text-slate-400">Ready to send</span>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => { onCancelReply?.(); setFile(null); }}
                        className="p-1 hover:bg-slate-200 rounded-full"
                    >
                        <X className="h-4 w-4 text-slate-400" />
                    </button>
                </div>
            )}

            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />

            <div className="flex items-end gap-3">
                {/* Main Input Capsule */}
                <div className="flex-1 bg-slate-100 rounded-3xl flex items-center p-1.5 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white transition-all duration-300 border border-transparent focus-within:border-indigo-200">

                    {/* Left Actions */}
                    <button onClick={() => { }} className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors">
                        <Smile className="h-5 w-5" />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a new message..."
                        disabled={disabled || sending}
                        rows={1}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 text-[15px] resize-none max-h-32 py-2.5 px-2 font-medium"
                    />

                    {/* Right Actions (Attachment) */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2.5 rounded-full transition-colors mx-1 ${file ? 'text-indigo-600 bg-indigo-100' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                    >
                        <Paperclip className="h-5 w-5" />
                    </button>
                </div>

                {/* Send Button */}
                <button
                    onClick={handleSend}
                    disabled={(!message.trim() && !file) || sending || disabled}
                    className={`
                         flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full shadow-md transition-all duration-300
                        ${(!message.trim() && !file) || sending || disabled
                            ? 'bg-slate-200 text-slate-400 scale-95'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 hover:shadow-lg'
                        }
                    `}
                >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
                </button>
            </div>
        </div>
    );
}
