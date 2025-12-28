"use client";

import { CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

interface MessageBubbleProps {
    content: string;
    createdAt: string;
    isFromMe: boolean;
    isRead?: boolean; // For "sent" messages
    senderName?: string;
    showAvatar?: boolean;
}

export default function MessageBubble({
    content,
    createdAt,
    isFromMe,
    isRead,
    senderName,
    showAvatar
}: MessageBubbleProps) {
    const formattedTime = format(new Date(createdAt), 'h:mm a');

    // Simple parser for [FILE: name](url)
    const fileRegex = /\[FILE: (.*?)\]\((.*?)\)/;
    const match = content.match(fileRegex);

    let displayContent = content;
    let fileAttachment: { name: string; url: string; isImage: boolean } | null = null;

    if (match) {
        displayContent = content.replace(fileRegex, '').trim();
        const name = match[1];
        const url = match[2];
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
        fileAttachment = { name, url, isImage };
    }

    return (
        <div className={`flex items-end gap-3 mb-6 ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar - Only show for others */}
            <div className={`h-8 w-8 flex-shrink-0 flex flex-col justify-end`}>
                {!isFromMe && (
                    showAvatar ? (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white">
                            {senderName?.charAt(0) || '?'}
                        </div>
                    ) : <div className="w-8" />
                )}
            </div>

            <div className={`max-w-[70%] flex flex-col ${isFromMe ? 'items-end' : 'items-start'}`}>
                {/* Sender Name */}
                {!isFromMe && showAvatar && senderName && (
                    <span className="text-xs text-slate-400 mb-1 ml-1 font-medium">{senderName}</span>
                )}

                {/* Bubble */}
                <div
                    className={`px-5 py-3 shadow-sm text-[15px] relative group transition-all duration-200 
                        ${isFromMe
                            ? 'bg-[#6366f1] text-white rounded-[20px] rounded-br-[4px]' // Indigo-500ish matching the screenshot
                            : 'bg-white text-slate-800 rounded-[20px] rounded-bl-[4px] border border-slate-100 shadow-sm'
                        }
                    `}
                >
                    {/* Text Content */}
                    {displayContent && <p className="whitespace-pre-wrap break-words leading-relaxed">{displayContent}</p>}

                    {/* Attachment Card Style matching Screen */}
                    {fileAttachment && (
                        <div className={`mt-3 ${displayContent ? 'pt-3 border-t border-white/20' : ''}`}>
                            {fileAttachment.isImage ? (
                                <a href={fileAttachment.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-white/20">
                                    <img
                                        src={fileAttachment.url}
                                        alt={fileAttachment.name}
                                        className="w-full max-h-60 object-cover hover:scale-105 transition-transform duration-500"
                                    />
                                </a>
                            ) : (
                                <div className={`flex items-center gap-3 p-3 rounded-xl ${isFromMe ? 'bg-black/20' : 'bg-slate-50 border border-slate-100'}`}>
                                    <div className="h-10 w-10 flex items-center justify-center bg-red-100 rounded-lg text-red-500">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate text-sm">{fileAttachment.name}</p>
                                        <p className="text-xs opacity-70">Document</p>
                                    </div>
                                    {/* Mock Actions */}
                                    <a href={fileAttachment.url} target="_blank" className={`text-xs font-bold px-3 py-1.5 rounded-full ${isFromMe ? 'bg-white text-indigo-600' : 'bg-indigo-50 text-indigo-600'} hover:opacity-90`}>
                                        Open
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Metadata Row (Time + Read Receipt) */}
                <div className={`flex items-center gap-1 mt-1 ${isFromMe ? 'mr-1' : 'ml-1'}`}>
                    <span className="text-[11px] text-slate-400 font-medium">
                        {formattedTime}
                    </span>
                    {isFromMe && (
                        <span className={isRead ? 'text-indigo-500' : 'text-slate-300'}>
                            {/* Double Tick SVG */}
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L7 17l-5-5" />
                                <path d="m22 10-7.5 7.5L13 16" />
                            </svg>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
