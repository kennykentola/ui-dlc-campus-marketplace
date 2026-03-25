
import React, { useState, useEffect, useRef } from 'react';
import { client, databases } from '../lib/appwrite';
import { useAuth } from '../App';
import { ID, Query } from 'appwrite';

const CALLS_COLLECTION_ID = 'calls';
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

// Simple STUN servers
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

const CallManager: React.FC = () => {
    const { user } = useAuth();
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [activeCall, setActiveCall] = useState<any>(null);
    const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected' | 'calling'>('idle');
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const unsubscribe = useRef<(() => void | null)>(null);
    const [ringTimer, setRingTimer] = useState<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const statusRef = useRef(callStatus);
    const activeCallRef = useRef(activeCall);

    useEffect(() => {
        statusRef.current = callStatus;
        activeCallRef.current = activeCall;
    }, [callStatus, activeCall]);

    // Initialize Realtime Subscription
    useEffect(() => {
        if (!user) return;

        const channel = `databases.${DATABASE_ID}.collections.${CALLS_COLLECTION_ID}.documents`;
        console.log(`[CallManager] Subscribing to: ${channel}`);

        unsubscribe.current = client.subscribe(channel, (response) => {
            const payload = response.payload as any;
            const currentStatus = statusRef.current;
            const currentActiveCall = activeCallRef.current;

            // Incoming Call Node Creation
            if (response.events.some(e => e.includes('.create'))) {
                if (payload.receiverId === user.userId && payload.status === 'ringing') {
                    console.log(`[CallManager] 🔔 Incoming call from: ${payload.callerId}`);
                    setIncomingCall(payload);
                    setCallStatus('ringing');
                }
            }

            // Call Protocol Update
            if (response.events.some(e => e.includes('.update'))) {
                const callId = payload.$id;

                if (currentActiveCall && callId === currentActiveCall.$id) {
                    if (payload.status === 'ended') {
                        console.log(`[CallManager] 🛑 Peer ended call.`);
                        endCall(false);
                    }

                    // Caller side logic: receiving answer and candidates
                    if (user.userId === payload.callerId) {
                        if (payload.type === 'answer' && payload.sdp && peerConnection.current && currentStatus === 'ringing') {
                            console.log(`[CallManager] 🤝 Handshake Answer Received.`);
                            handleAnswer(payload.sdp);
                        }
                        if (payload.receiverCandidates && payload.receiverCandidates.length > 0 && peerConnection.current) {
                            payload.receiverCandidates.forEach((c: string) => {
                                peerConnection.current?.addIceCandidate(JSON.parse(c)).catch(() => { });
                            });
                        }
                    }
                    // Receiver side logic: receiving caller candidates
                    else if (user.userId === payload.receiverId) {
                        if (payload.callerCandidates && payload.callerCandidates.length > 0 && peerConnection.current) {
                            payload.callerCandidates.forEach((c: string) => {
                                peerConnection.current?.addIceCandidate(JSON.parse(c)).catch(() => { });
                            });
                        }
                    }
                }
            }
        });

        return () => {
            if (unsubscribe.current) unsubscribe.current();
        };
    }, [user]);

    const callStartTime = useRef<number | null>(null);

    const logCallEvidence = async (callerId: string, receiverId: string, durationSeconds: number = 0) => {
        try {
            const isMissed = durationSeconds <= 0;
            const durationText = durationSeconds > 60 
                ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
                : `${durationSeconds}s`;

            const text = isMissed 
                ? "📞 Missed Voice Call" 
                : `📞 Voice Call (${durationText})`;

            await databases.createDocument(DATABASE_ID, 'messages', ID.unique(), {
                conversationId: [callerId, receiverId].sort().join('-'),
                senderId: callerId,
                receiverId: receiverId,
                text: text,
                type: 'text',
                isRead: false,
                createdAt: new Date().toISOString()
            });
            console.log(`[CallManager] 📂 Call record archived: ${text}`);
        } catch (err) {
            console.error("Evidence Archive Failure:", err);
        }
    };

    const startCall = async (receiverId: string) => {
        setCallStatus('calling');
        console.log(`[CallManager] 🏗️ INITIALIZING PEER CONNECTION...`);

        const pc = new RTCPeerConnection(rtcConfig);
        peerConnection.current = pc;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStream.current = stream;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            console.log(`[CallManager] 🎤 MIC ACTIVE.`);
        } catch (err: any) {
            console.error("[CallManager] Mic Access Denied:", err);
            alert(`Voice Connection Blocked: ${err.message || 'Microphone access is required.'}`);
            setCallStatus('idle');
            return;
        }

        pc.ontrack = (event) => {
            console.log(`[CallManager] 📡 REMOTE TRACK DETECTED.`);
            setRemoteStream(event.streams[0]);
            if (audioRef.current) audioRef.current.srcObject = event.streams[0];
        };

        const initialCandidates: string[] = [];
        pc.onicecandidate = async (event) => {
            if (event.candidate) {
                const candStr = JSON.stringify(event.candidate);
                if (activeCallRef.current) {
                    try {
                        await databases.updateDocument(DATABASE_ID, CALLS_COLLECTION_ID, activeCallRef.current.$id, {
                            callerCandidates: [...(activeCallRef.current.callerCandidates || []), candStr]
                        });
                    } catch (e) { }
                } else {
                    initialCandidates.push(candStr);
                }
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log(`[CallManager] ⏱️ GATHERING NODES...`);
        await new Promise(r => setTimeout(r, 600));

        if (!user) return;

        try {
            console.log(`[CallManager] 📨 ANNOUNCING CALL...`);
            const callDoc = await databases.createDocument(
                DATABASE_ID,
                CALLS_COLLECTION_ID,
                ID.unique(),
                {
                    callerId: user.userId,
                    receiverId,
                    status: 'ringing',
                    sdp: JSON.stringify(pc.localDescription),
                    type: 'offer',
                    callerCandidates: initialCandidates
                }
            );

            setActiveCall(callDoc);
            activeCallRef.current = callDoc;
            setCallStatus('ringing');

            const timeout = setTimeout(async () => {
                if (statusRef.current !== 'connected') {
                    console.log(`[CallManager] 🕰️ TIMEOUT: NO ANSWER.`);
                    await logCallEvidence(user.userId, receiverId, 0);
                    endCall(true);
                }
            }, 30000);
            setRingTimer(timeout);

        } catch (err) {
            console.error("[CallManager] Registry Sync Failure:", err);
            setCallStatus('idle');
        }
    };

    const answerCall = async () => {
        if (!incomingCall || !user) return;
        if (ringTimer) clearTimeout(ringTimer);

        console.log(`[CallManager] 🤝 ACCEPTING CONNECTION...`);
        setCallStatus('connected');
        statusRef.current = 'connected';

        const pc = new RTCPeerConnection(rtcConfig);
        peerConnection.current = pc;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStream.current = stream;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                setRemoteStream(event.streams[0]);
                if (audioRef.current) audioRef.current.srcObject = event.streams[0];
            };

            const remoteDesc = JSON.parse(incomingCall.sdp);
            await pc.setRemoteDescription(new RTCSessionDescription(remoteDesc));

            if (incomingCall.callerCandidates) {
                incomingCall.callerCandidates.forEach((c: string) => {
                    pc.addIceCandidate(JSON.parse(c)).catch(() => { });
                });
            }

            const receiverCandidates: string[] = [];
            pc.onicecandidate = async (event) => {
                if (event.candidate) {
                    const candStr = JSON.stringify(event.candidate);
                    receiverCandidates.push(candStr);
                    if (incomingCall?.$id) {
                        try {
                            await databases.updateDocument(DATABASE_ID, CALLS_COLLECTION_ID, incomingCall.$id, {
                                receiverCandidates: [...receiverCandidates]
                            });
                        } catch (e) { }
                    }
                }
            };

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await databases.updateDocument(DATABASE_ID, CALLS_COLLECTION_ID, incomingCall.$id, {
                status: 'connected',
                sdp: JSON.stringify(pc.localDescription),
                type: 'answer',
                receiverCandidates
            });

            callStartTime.current = Date.now();
            console.log(`[CallManager] ✅ HANDSHAKE OK. CALL LIVE.`);

        } catch (err) {
            console.error("[CallManager] Audio Bridge Failure:", err);
            endCall(true);
        }
    };

    const handleAnswer = async (sdp: string) => {
        if (!peerConnection.current) return;
        if (peerConnection.current.signalingState === 'stable') {
            console.warn(`[CallManager] PeerConnection already stable. Skipping duplicate answer.`);
            return;
        }
        if (ringTimer) clearTimeout(ringTimer);
        try {
            const remoteDesc = new RTCSessionDescription(JSON.parse(sdp));
            await peerConnection.current.setRemoteDescription(remoteDesc);
            setCallStatus('connected');
            statusRef.current = 'connected';
            callStartTime.current = Date.now();
            console.log(`[CallManager] ✅ CALL CONNECTED.`);
        } catch (e) { console.error(e); }
    };

    const endCall = async (notifyBackend = true) => {
        console.log(`[CallManager] 🛑 END CALL.`);
        if (ringTimer) clearTimeout(ringTimer);

        if (localStream.current) {
            localStream.current.getTracks().forEach(t => t.stop());
            localStream.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        if (notifyBackend && activeCallRef.current) {
            try {
                const duration = callStartTime.current ? Math.floor((Date.now() - callStartTime.current) / 1000) : 0;
                
                // Only log if the caller or if the call was never connected (missed)
                // We typically only want ONE record in the chat.
                if (user?.userId === activeCallRef.current.callerId) {
                    await logCallEvidence(activeCallRef.current.callerId, activeCallRef.current.receiverId, duration);
                }

                await databases.updateDocument(DATABASE_ID, CALLS_COLLECTION_ID, activeCallRef.current.$id, { status: 'ended' });
            } catch (e) { }
        }

        callStartTime.current = null;

        setActiveCall(null);
        activeCallRef.current = null;
        setIncomingCall(null);
        setCallStatus('idle');
        statusRef.current = 'idle';
        setRemoteStream(null);
        setRingTimer(null);
    };

    useEffect(() => {
        const handleStartCall = (e: CustomEvent) => {
            const { receiverId } = e.detail;
            if (receiverId) startCall(receiverId);
        };
        window.addEventListener('start-app-call' as any, handleStartCall as any);
        return () => window.removeEventListener('start-app-call' as any, handleStartCall as any);
    }, [user]);

    useEffect(() => {
        if (audioRef.current && remoteStream) {
            audioRef.current.play().catch(() => { });
        }
    }, [remoteStream]);

    if (callStatus === 'idle' && !incomingCall) return null;

    return (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 overflow-hidden animate-fadeIn">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl transition-all duration-1000"></div>

            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-green rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-800 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            <audio ref={audioRef} autoPlay />

            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[60px] p-12 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center space-y-12 animate-bounceIn overflow-hidden group">
                <div className="relative flex items-center justify-center">
                    <div className="absolute w-48 h-48 bg-brand-green/20 rounded-full animate-ping duration-3000"></div>
                    <div className="absolute w-64 h-64 bg-brand-green/10 rounded-full animate-ping duration-4000 delay-500"></div>

                    <div className="relative w-40 h-40 rounded-[40px] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl transform transition-transform duration-700">
                        <img
                            src={`https://ui-avatars.com/api/?name=${incomingCall ? "INCOMING" : (callStatus === 'connected' ? "ACTIVE" : "CALLING")}&background=00a884&color=fff&size=512&bold=true`}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-900/40 to-transparent"></div>
                    </div>

                    <div className="absolute -bottom-2 px-4 py-1.5 bg-brand-green text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg border-2 border-white dark:border-slate-800 z-10 transition-all duration-500">
                        {callStatus.toUpperCase()}
                    </div>
                </div>

                <div className="text-center space-y-4 relative z-10">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">Voice Call</span>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                            {incomingCall ? "Incoming Call" : (callStatus === 'connected' ? "Call Connected" : "Calling...")}
                        </h2>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse"></div>
                        <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                            {incomingCall ? "New Voice Connection" : (callStatus === 'connected' ? "Secure Link Active" : "Connecting...")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-8 w-full relative z-10">
                    {incomingCall ? (
                        <>
                            <button
                                onClick={() => endCall(true)}
                                className="w-20 h-20 rounded-[30px] bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-md hover:bg-rose-500 hover:text-white transition-all active:scale-90 border-2 border-rose-500/20"
                                title="Decline"
                            >
                                <i className="fa-solid fa-phone-slash text-2xl"></i>
                            </button>
                            <button
                                onClick={answerCall}
                                className="w-24 h-24 rounded-[35px] bg-brand-green text-white flex items-center justify-center shadow-lg hover:rotate-10 hover:scale-105 transition-all active:scale-90 animate-pulse border-4 border-white dark:border-slate-800"
                                title="Accept"
                            >
                                <i className="fa-solid fa-phone text-3xl"></i>
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-6">
                            <button
                                onClick={() => endCall(true)}
                                className="w-20 h-20 rounded-[30px] bg-rose-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 border-4 border-white dark:border-slate-800"
                                title="End Call"
                            >
                                <i className="fa-solid fa-phone-slash text-2xl"></i>
                            </button>
                            <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest opacity-50">End Call</span>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-brand-green/30 to-transparent"></div>
            </div>
        </div>
    );
};

export default CallManager;
