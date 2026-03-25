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

    // Initialize Realtime Subscription
    useEffect(() => {
        if (!user) return;

        // Subscribe to the entire calls collection for the database
        // ensure permissions are set to 'Users' for read in Appwrite
        const channel = `databases.${DATABASE_ID}.collections.${CALLS_COLLECTION_ID}.documents`;
        unsubscribe.current = client.subscribe(channel, (response) => {
            const payload = response.payload as any;

            // Incoming Call Node Creation
            if (response.events.some(e => e.includes('.create'))) {
                // Ensure the call is for the current user and it's currently ringing
                if (payload.receiverId === user.userId && payload.status === 'ringing') {
                    setIncomingCall(payload);
                    setCallStatus('ringing');
                }
            }

            // Call Protocol Update (sdp, candidates, status change)
            if (response.events.some(e => e.includes('.update'))) {
                const callId = payload.$id;
                
                // If this is our active call node
                if (activeCall && callId === activeCall.$id) {
                    if (payload.status === 'ended') {
                        endCall(false);
                    }

                    // Caller side logic: receiving answer
                    if (user.userId === payload.callerId) {
                        if (payload.type === 'answer' && payload.sdp && peerConnection.current && callStatus === 'calling') {
                            handleAnswer(payload.sdp);
                        }
                        if (payload.receiverCandidates && payload.receiverCandidates.length > 0 && peerConnection.current) {
                            payload.receiverCandidates.forEach((c: string) => {
                                peerConnection.current?.addIceCandidate(JSON.parse(c)).catch(() => {});
                            });
                        }
                    } 
                    // Receiver side logic: receiving more caller candidates
                    else if (user.userId === payload.receiverId) {
                        if (payload.callerCandidates && payload.callerCandidates.length > 0 && peerConnection.current) {
                            payload.callerCandidates.forEach((c: string) => {
                                peerConnection.current?.addIceCandidate(JSON.parse(c)).catch(() => {});
                            });
                        }
                    }
                }
            }
        });

        return () => {
            if (unsubscribe.current) unsubscribe.current();
        };
    }, [user, activeCall, callStatus]);

    const logMissedCallEvidence = async (callerId: string, receiverId: string) => {
        try {
            await databases.createDocument(DATABASE_ID, 'messages', ID.unique(), {
                conversationId: [callerId, receiverId].sort().join('-'),
                senderId: callerId,
                receiverId: receiverId,
                text: "📞 Missed Voice Call",
                type: 'text',
                isRead: false,
                createdAt: new Date().toISOString()
            });
        } catch (err) {
            console.error("Evidence Archive Failure:", err);
        }
    };

    const startCall = async (receiverIdentifier: string) => {
        setCallStatus('calling');
        let receiverId = receiverIdentifier;

        // Resolve Academic Email to Node ID
        if (receiverIdentifier.includes('@')) {
            try {
                const profiles = await databases.listDocuments(DATABASE_ID, 'profiles', [
                    Query.equal('email', receiverIdentifier)
                ]);
                if (profiles.documents.length > 0) {
                    receiverId = (profiles.documents[0] as any).userId;
                } else {
                    alert("Registry Failure: Student email not found.");
                    setCallStatus('idle');
                    return;
                }
            } catch (err) {
                console.error("Profile resolution failed:", err);
            }
        }

        const pc = new RTCPeerConnection(rtcConfig);
        peerConnection.current = pc;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStream.current = stream;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        } catch (err) {
            alert("Terminal Shield: Microphone access required for secure transmission.");
            setCallStatus('idle');
            return;
        }

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (audioRef.current) audioRef.current.srcObject = event.streams[0];
        };

        const callerCandidates: string[] = [];
        pc.onicecandidate = (event) => {
            if (event.candidate) callerCandidates.push(JSON.stringify(event.candidate));
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await new Promise(r => setTimeout(r, 800)); // Gathers initial candidates

        if (!user) return;

        try {
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
                    callerCandidates
                }
            );
            setActiveCall(callDoc);

            // Ringing Timeout Protocol (30s)
            const timeout = setTimeout(async () => {
                if (callStatus !== 'connected') {
                    alert("Registry Alert: Student not responding. Archiving missed call.");
                    await logMissedCallEvidence(user.userId, receiverId);
                    endCall(true);
                }
            }, 30000);
            setRingTimer(timeout);

        } catch (err) {
            console.error("Sync Failure:", err);
            setCallStatus('idle');
        }
    };

    const answerCall = async () => {
        if (!incomingCall) return;
        if (ringTimer) clearTimeout(ringTimer);
        
        setCallStatus('connected');
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
                    pc.addIceCandidate(JSON.parse(c)).catch(() => {});
                });
            }

            const receiverCandidates: string[] = [];
            pc.onicecandidate = (event) => {
                if (event.candidate) receiverCandidates.push(JSON.stringify(event.candidate));
            };

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await new Promise(r => setTimeout(r, 800));

            await databases.updateDocument(
                DATABASE_ID,
                CALLS_COLLECTION_ID,
                incomingCall.$id,
                {
                    status: 'connected',
                    sdp: JSON.stringify(answer),
                    type: 'answer',
                    receiverCandidates
                }
            );

            setActiveCall(incomingCall);
            setIncomingCall(null);
        } catch (err) {
            console.error("Audio Handshake Failure:", err);
            endCall(true);
        }
    };

    const handleAnswer = async (sdp: string) => {
        if (!peerConnection.current) return;
        if (ringTimer) clearTimeout(ringTimer);
        try {
            const remoteDesc = new RTCSessionDescription(JSON.parse(sdp));
            await peerConnection.current.setRemoteDescription(remoteDesc);
            setCallStatus('connected');
        } catch (e) { console.error(e); }
    };

    const endCall = async (notifyBackend = true) => {
        if (ringTimer) clearTimeout(ringTimer);
        
        if (localStream.current) {
            localStream.current.getTracks().forEach(t => t.stop());
            localStream.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        if (notifyBackend && activeCall) {
            try {
                await databases.updateDocument(
                    DATABASE_ID,
                    CALLS_COLLECTION_ID,
                    activeCall.$id,
                    { status: 'ended' }
                );
            } catch (e) { }
        }

        setActiveCall(null);
        setIncomingCall(null);
        setCallStatus('idle');
        setRemoteStream(null);
        setRingTimer(null);
    };

    useEffect(() => {
        const handleStartCall = (e: CustomEvent) => {
            const { receiverId } = e.detail;
            startCall(receiverId);
        };
        window.addEventListener('start-app-call' as any, handleStartCall as any);
        return () => window.removeEventListener('start-app-call' as any, handleStartCall as any);
    }, []);

    useEffect(() => {
        if (audioRef.current && remoteStream) {
            audioRef.current.play().catch(() => {});
        }
    }, [remoteStream]);

    if (callStatus === 'idle' && !incomingCall) return null;

    return (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 overflow-hidden animate-fadeIn">
            {/* Dynamic Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl transition-all duration-1000"></div>
            
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-green rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-800 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            <audio ref={audioRef} autoPlay />

            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[60px] p-12 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center space-y-12 animate-bounceIn overflow-hidden group">
                
                {/* Visual Radar / Pulse Effect */}
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
                    
                    {/* Status Badge */}
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
                                onClick={() => { setIncomingCall(null); setCallStatus('idle'); }}
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
                
                {/* Bottom Graphic */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-brand-green/30 to-transparent"></div>
            </div>
        </div>
    );
};

export default CallManager;
