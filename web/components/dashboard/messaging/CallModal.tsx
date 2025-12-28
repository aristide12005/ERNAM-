'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, Maximize2, Minimize2 } from 'lucide-react';
import SimplePeer from 'simple-peer'; // Ensure this is client-side only
import { cn } from '@/lib/utils';

import { CallState } from '@/hooks/useWebRTC';

// We'll pass the peer instance or signaling functions as props
interface CallModalProps {
    isOpen: boolean;
    mode: CallState;
    callerName?: string;
    onAccept?: () => void;
    onReject?: () => void;
    onEndCall: () => void;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    callType?: 'audio' | 'video';
}

export default function CallModal({
    isOpen,
    mode,
    callerName = "Unknown Caller",
    onAccept,
    onReject,
    onEndCall,
    localStream,
    remoteStream,
    callType = 'video'
}: CallModalProps) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Attach streams to video elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, isOpen]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, isOpen]);

    // Handle toggles
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    {/* Backdrop (Backdrop only if not minimized) */}
                    {!isMinimized && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
                        />
                    )}

                    {/* Main Card */}
                    <motion.div
                        drag={isMinimized} // Draggable when minimized
                        dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
                        initial={isMinimized ? { scale: 0.5, x: 200, y: 200 } : { scale: 0.9, opacity: 0 }}
                        animate={isMinimized
                            ? { scale: 0.4, x: undefined, y: undefined, borderRadius: 24, width: 300, height: 400 }
                            : { scale: 1, x: 0, y: 0, borderRadius: 24, width: '100%', maxWidth: '900px', height: '80vh' }
                        }
                        exit={{ scale: 0.8, opacity: 0 }}
                        className={cn(
                            "bg-slate-900 shadow-2xl overflow-hidden relative pointer-events-auto transition-all",
                            isMinimized ? "fixed bottom-4 right-4" : "w-full max-w-4xl h-[80vh] rounded-3xl"
                        )}
                    >
                        {/* Header Controls (Minimize) */}
                        <div className="absolute top-4 right-4 z-20 flex gap-2">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md"
                            >
                                {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="relative w-full h-full flex flex-col">

                            {/* REMOTE VIDEO (Main) */}
                            {mode === 'connected' && callType === 'video' ? (
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover bg-slate-800"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
                                    <div className={cn(
                                        "w-32 h-32 rounded-full bg-slate-700 mb-6 flex items-center justify-center shadow-2xl",
                                        mode === 'connected' ? "border-4 border-emerald-500" : "animate-pulse"
                                    )}>
                                        <span className="text-4xl font-bold">{callerName[0]}</span>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2">{callerName}</h2>
                                    <p className="text-blue-200 text-lg animate-pulse font-medium tracking-wide">
                                        {mode === 'incoming' && `Incoming ${callType === 'audio' ? 'Audio' : 'Video'} Call...`}
                                        {mode === 'calling' && "Calling..."}
                                        {mode === 'connecting' && "Connecting..."}
                                        {mode === 'reconnecting' && "Reconnecting..."}
                                        {mode === 'connected' && <span className="text-emerald-400">Connected ({callType})</span>}
                                    </p>
                                </div>
                            )}

                            {/* LOCAL VIDEO (PIP) */}
                            <motion.div
                                className="absolute bottom-6 right-6 w-48 h-36 bg-black rounded-xl overflow-hidden shadow-lg border border-white/10 z-10"
                                drag
                                dragConstraints={{ top: -300, left: -500, right: 0, bottom: 0 }}
                            >
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={cn(
                                        "w-full h-full object-cover transform -scale-x-100", // Mirror effect
                                        (isVideoOff || !localStream || callType === 'audio') && "opacity-0"
                                    )}
                                />
                                {(isVideoOff || !localStream) && (
                                    <div className="absolute inset-0 flex items-center justify-center text-white/50 bg-slate-800">
                                        <VideoOff className="w-8 h-8" />
                                    </div>
                                )}
                            </motion.div>

                            {/* CONTROLS (Bottom Bar) */}
                            {!isMinimized && (
                                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-20">
                                    {mode === 'incoming' ? (
                                        <>
                                            <button
                                                onClick={onReject}
                                                className="p-4 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg shadow-red-500/30 transition-all hover:scale-110"
                                            >
                                                <PhoneOff className="w-8 h-8" />
                                            </button>
                                            <button
                                                onClick={onAccept}
                                                className="p-4 bg-green-500 hover:bg-green-600 rounded-full text-white shadow-lg shadow-green-500/30 transition-all hover:scale-110"
                                            >
                                                <Phone className="w-8 h-8 animate-bounce" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={toggleMute}
                                                className={cn(
                                                    "p-3 rounded-full text-white backdrop-blur-md transition-all",
                                                    isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20"
                                                )}
                                            >
                                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                            </button>

                                            <button
                                                onClick={onEndCall}
                                                className="p-4 bg-red-600 hover:bg-red-700 rounded-2xl text-white shadow-xl shadow-red-600/20 transition-all hover:scale-105"
                                            >
                                                <PhoneOff className="w-8 h-8" />
                                            </button>

                                            <button
                                                onClick={toggleVideo}
                                                className={cn(
                                                    "p-3 rounded-full text-white backdrop-blur-md transition-all",
                                                    isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20"
                                                )}
                                            >
                                                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Add simple-peer types if needed in global
declare global {
    interface Window {
        global: any;
    }
}
