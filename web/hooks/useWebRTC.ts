import { useState, useEffect, useRef, useCallback } from 'react';
import SimplePeer, { SignalData, Instance as PeerInstance } from 'simple-peer';
import { supabase } from '@/lib/supabaseClient';

// Production ICE Configuration (STUN mandatory, TURN recommended)
// In production, fetch these from an API provided by Twilio/Metered
const ICE_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
        // TODO: Add TURN server here
        // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'password' }
    ]
};

// Strict State Machine
export type CallState =
    | 'idle'            // Nothing happening
    | 'calling'         // I am calling someone (waiting for them to answer)
    | 'incoming'        // Someone is calling me (ringing)
    | 'connecting'      // Establishing P2P connection (ICE candidates)
    | 'connected'       // Media flowing
    | 'reconnecting'    // ICE restart (optional complexity)
    | 'ended';          // Cleanup state

interface WebRTCSignal {
    type: 'call-offer' | 'call-answer' | 'call-reject' | 'call-cancel' | 'ice-candidate';
    signal?: SignalData;
    callerId: string;
    callerName?: string;
    candidate?: any; // For trickling
    callType?: 'audio' | 'video';
}

export function useWebRTC(currentUserId: string | null) {
    // Current User Data
    const [currentUserName, setCurrentUserName] = useState<string>('');

    useEffect(() => {
        if (currentUserId) {
            supabase.from('profiles').select('full_name').eq('id', currentUserId).single()
                .then(({ data }) => {
                    if (data) setCurrentUserName(data.full_name);
                });
        }
    }, [currentUserId]);

    // Call State (exposed to UI)
    // Call State (exposed to UI)
    const [callState, setCallState] = useState<CallState>('idle');
    const [callType, setCallType] = useState<'audio' | 'video'>('video');
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [callerName, setCallerName] = useState("Unknown");

    // Internal Refs (State of Truth for Event Listeners)
    // We use Refs to avoid race conditions in closures (critical for Signal Listeners)
    const stateRef = useRef<CallState>('idle');
    const remoteUserIdRef = useRef<string | null>(null);
    const peerRef = useRef<PeerInstance | null>(null);
    const incomingSignalRef = useRef<SignalData | null>(null);
    const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update state wrapper to keep refs in sync
    const updateCallState = (newState: CallState) => {
        stateRef.current = newState;
        setCallState(newState);
    };

    // 1. Get Media (Internal)
    const getMedia = useCallback(async (isVideo: boolean = true) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error("Media permission denied:", err);
            alert("Camera/Microphone permission failed.");
            return null;
        }
    }, []);

    // 2. Cleanup (Internal)
    const cleanup = useCallback(() => {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setRemoteStream(null);
        updateCallState('idle');
        remoteUserIdRef.current = null;

        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }
    }, [localStream]);

    // Send Signal Helper
    const sendSignal = (targetId: string, payload: WebRTCSignal) => {
        // We broadcast to the target's room
        supabase.channel(`room:${targetId}`).send({
            type: 'broadcast',
            event: 'call-signal',
            payload
        });
    };

    // 3. Start a Call (Initiator)
    const startCall = async (recipientId: string, isVideo: boolean = true) => {
        if (stateRef.current !== 'idle') return;

        setCallType(isVideo ? 'video' : 'audio');
        const stream = await getMedia(isVideo);
        if (!stream) return;

        updateCallState('calling');
        remoteUserIdRef.current = recipientId;

        // Safety Timeout (30s ringing limit)
        callTimeoutRef.current = setTimeout(() => {
            if (peerRef.current && !peerRef.current.connected) {
                console.log("Call timed out");
                cancelCall(recipientId);
            }
        }, 30000);

        // Initialize Peer (Initiator)
        const peer = new SimplePeer({
            initiator: true,
            trickle: true, // Enable Trickle ICE
            stream: stream,
            config: ICE_CONFIG
        });

        // Event: Send Signals (Offer + Candidates)
        peer.on('signal', (data) => {
            const signalData = data as any;
            if (signalData.type === 'offer') {
                sendSignal(recipientId, {
                    type: 'call-offer',
                    signal: data,
                    callerId: currentUserId || '',
                    callerName: currentUserName,
                    callType: isVideo ? 'video' : 'audio'
                });
            } else if (signalData.candidate) {
                // Trickle ICE Candidate
                sendSignal(recipientId, {
                    type: 'ice-candidate',
                    candidate: data,
                    callerId: currentUserId || ''
                });
            }
        });

        peer.on('stream', (remote) => {
            setRemoteStream(remote);
            updateCallState('connected');
            if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        });

        peer.on('connect', () => {
            updateCallState('connected');
            if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        });

        peer.on('close', cleanup);
        peer.on('error', (err) => { console.error("Peer error:", err); cleanup(); });

        peerRef.current = peer;
    };

    // 4. Accept Call (Receiver)
    const acceptCall = async () => {
        if (stateRef.current !== 'incoming' || !incomingSignalRef.current || !remoteUserIdRef.current) return;

        const targetId = remoteUserIdRef.current;
        const stream = await getMedia(callType === 'video'); // Use the captured callType
        if (!stream) return;

        updateCallState('connecting');

        const peer = new SimplePeer({
            initiator: false,
            trickle: true, // Enable Trickle ICE
            stream: stream,
            config: ICE_CONFIG
        });

        peer.on('signal', (data) => {
            const signalData = data as any;
            if (signalData.type === 'answer') {
                sendSignal(targetId, {
                    type: 'call-answer',
                    signal: data,
                    callerId: currentUserId || ''
                });
            } else if (signalData.candidate) {
                // Trickle ICE
                sendSignal(targetId, {
                    type: 'ice-candidate',
                    candidate: data,
                    callerId: currentUserId || ''
                });
            }
        });

        peer.on('stream', (remote) => {
            setRemoteStream(remote);
            updateCallState('connected');
        });

        peer.on('connect', () => {
            updateCallState('connected');
        });

        // Signal the saved offer
        peer.signal(incomingSignalRef.current);

        peer.on('close', cleanup);
        peer.on('error', (err) => { console.error("Peer error:", err); cleanup(); });

        peerRef.current = peer;
    };

    // 5. Reject Call
    const rejectCall = () => {
        if (remoteUserIdRef.current) {
            sendSignal(remoteUserIdRef.current, {
                type: 'call-reject', callerId: currentUserId || ''
            });
        }
        cleanup();
    };

    // 6. Cancel Call (Caller hangs up before answer)
    const cancelCall = (recipientId?: string) => {
        const target = recipientId || remoteUserIdRef.current;
        if (target) {
            sendSignal(target, {
                type: 'call-cancel', callerId: currentUserId || ''
            });
        }
        cleanup();
    };

    // 7. Stable Signaling Protocol
    useEffect(() => {
        if (!currentUserId || !supabase) return;

        // One-time subscription to MY room
        const channel = supabase.channel(`room:${currentUserId}`)
            .on('broadcast', { event: 'call-signal' }, ({ payload }) => {
                const data = payload as WebRTCSignal;

                // IMPORTANT: Use Refs to check state without dependency changes

                // Case: Incoming Offer
                if (data.type === 'call-offer') {
                    if (stateRef.current !== 'idle') {
                        // Busy: Auto-reject
                        // We need to briefly create a channel to reject if we aren't connected to theirs? 
                        // No, we just broadcast to theirs.
                        sendSignal(data.callerId, { type: 'call-reject', callerId: currentUserId });
                        return;
                    }

                    updateCallState('incoming');
                    setCallerName(data.callerName || "Unknown");
                    remoteUserIdRef.current = data.callerId;
                    incomingSignalRef.current = data.signal || null;
                    if (data.callType) setCallType(data.callType); // Capture call type
                }

                // Case: Answer
                if (data.type === 'call-answer') {
                    if (stateRef.current === 'calling' && peerRef.current) {
                        updateCallState('connecting');
                        if (data.signal) peerRef.current.signal(data.signal);
                    }
                }

                // Case: ICE Candidate (Trickle)
                if (data.type === 'ice-candidate') {
                    if (peerRef.current && data.candidate) {
                        // Only accept candidates if we have started signaling or connected
                        // SimplePeer handles buffering, so safe to call .signal
                        peerRef.current.signal(data.candidate);
                    }
                }

                // Case: Rejected
                if (data.type === 'call-reject') {
                    alert("User is busy or declined the call.");
                    cleanup();
                }

                // Case: Canceled
                if (data.type === 'call-cancel') {
                    cleanup();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId]); // Only re-run if ID changes (login/logout)

    return {
        callState,
        callType, // Export
        callerName,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        rejectCall,
        endCall: cleanup
    };
}
