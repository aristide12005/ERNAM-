'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Mic, MicOff, Video, VideoOff, Users, Monitor, Maximize2 } from 'lucide-react';
import { Peer } from 'peerjs';

interface VideoConferenceProps {
    courseId: string;
    userId: string;
    userName: string;
    onClose: () => void;
}

interface PeerState {
    peerId: string;
    userId: string;
    userName: string;
    stream?: MediaStream;
}

export default function VideoConference({ courseId, userId, userName, onClose }: VideoConferenceProps) {
    const [myPeerId, setMyPeerId] = useState<string>('');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<Record<string, PeerState>>({});
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isSharingScreen, setIsSharingScreen] = useState(false);

    const myVideoRef = useRef<HTMLVideoElement>(null);
    const peerInstance = useRef<Peer | null>(null);
    const channelRef = useRef<any>(null);

    const addRemotePeer = (peerId: string, stream: MediaStream, userId: string = 'unknown', userName: string = 'Participant') => {
        setPeers(prev => ({
            ...prev,
            [peerId]: { peerId, stream, userId, userName }
        }));
    };

    const removePeer = (peerId: string) => {
        setPeers(prev => {
            const newPeers = { ...prev };
            delete newPeers[peerId];
            return newPeers;
        });
    };

    const connectToNewUser = (remotePeerId: string, remoteUserId: string, remoteUserName: string, myStream: MediaStream) => {
        // Call the new user
        const call = peerInstance.current?.call(remotePeerId, myStream);

        if (call) {
            call.on('stream', (userVideoStream) => {
                addRemotePeer(remotePeerId, userVideoStream, remoteUserId, remoteUserName);
            });
            call.on('close', () => {
                removePeer(remotePeerId);
            });
        }
    };

    const joinRoom = (peerId: string) => {
        // 3. Join Supabase Channel for Signaling
        const channel = supabase.channel(`room:${courseId}`, {
            config: {
                broadcast: { self: true }
            }
        });

        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'user-joined' }, ({ payload }) => {
                console.log('User joined signal:', payload);
                if (payload.peerId !== peerId) {
                    connectToNewUser(payload.peerId, payload.userId, payload.userName, stream!);
                }
            })
            .on('broadcast', { event: 'user-left' }, ({ payload }) => {
                console.log('User left:', payload);
                removePeer(payload.peerId);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Announce myself
                    channel.send({
                        type: 'broadcast',
                        event: 'user-joined',
                        payload: { peerId, userId, userName }
                    });
                }
            });
    };

    useEffect(() => {
        // 1. Initialize PeerJS
        const peer = new Peer();
        peerInstance.current = peer;

        peer.on('open', (id) => {
            console.log('My Peer ID:', id);
            setMyPeerId(id);
            joinRoom(id);
        });

        peer.on('call', (call) => {
            console.log('Incoming call from:', call.peer);
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
                call.answer(mediaStream);
                call.on('stream', (remoteStream) => {
                    addRemotePeer(call.peer, remoteStream);
                });
            });
        });

        // 2. Get User Media
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((mediaStream) => {
                setStream(mediaStream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = mediaStream;
                }
            })
            .catch(err => console.error('Failed to get local stream:', err));

        // Cleanup
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (peerInstance.current) {
                peerInstance.current.destroy();
            }
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);



    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] text-white flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#111]">
                <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                    <h2 className="font-bold text-lg">Live Class Session</h2>
                    <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-gray-400">ID: {courseId.slice(0, 6)}...</span>
                </div>
                <button onClick={onClose} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Stage (My Stream for now, eventually active speaker) */}
                <div className="flex-1 bg-black relative flex items-center justify-center p-4">
                    <div className="relative w-full max-w-4xl aspect-video bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <video
                            ref={myVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                            {isAudioEnabled ? <Mic className="h-3 w-3 text-emerald-400" /> : <MicOff className="h-3 w-3 text-red-400" />}
                            {userName} (You)
                        </div>
                    </div>
                </div>

                {/* Sidebar (Participants) */}
                <div className="w-80 border-l border-white/10 bg-[#111] flex flex-col">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="font-bold text-sm tracking-wide text-gray-400 flex items-center gap-2">
                            <Users className="h-4 w-4" /> PARTICIPANTS ({Object.keys(peers).length + 1})
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Remote Peers Loop */}
                        {Object.values(peers).map((peer) => (
                            <div key={peer.peerId} className="relative aspect-video bg-[#222] rounded-xl overflow-hidden border border-white/5">
                                <VideoPlayer stream={peer.stream} />
                                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs">
                                    {peer.userName}
                                </div>
                            </div>
                        ))}

                        {Object.keys(peers).length === 0 && (
                            <div className="text-center py-10 text-gray-500 text-sm">
                                Waiting for others...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Controls */}
            <div className="h-20 border-t border-white/10 bg-[#111] flex items-center justify-center gap-4">
                <button
                    onClick={toggleAudio}
                    className={`p-4 rounded-full transition-all ${isAudioEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                >
                    {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-all ${isVideoEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                >
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
                <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-gray-400">
                    <Monitor className="h-5 w-5" />
                </button>
                <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-gray-400">
                    <Maximize2 className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

// Helper component for remote videos to handle ref callbacks
const VideoPlayer = ({ stream }: { stream?: MediaStream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />;
};
