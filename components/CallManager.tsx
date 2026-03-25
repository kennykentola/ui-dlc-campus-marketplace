
import React, { useState, useEffect, useRef } from 'react';
import { client, databases } from '../lib/appwrite';
import { useAuth } from '../App';
import { ID, Query } from 'appwrite';

const CALLS_COLLECTION_ID = 'calls';
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

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
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [liveDuration, setLiveDuration] = useState(0);

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

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (callStatus === 'connected') {
            interval = setInterval(() => {
                setLiveDuration(prev => prev + 1);
            }, 1000);
        } else {
            setLiveDuration(0);
        }
        return () => clearInterval(interval);
    }, [callStatus]);

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
        } catch (err) { }
    };

    useEffect(() => {
        if (!user) return;
        const channel = `databases.${DATABASE_ID}.collections.${CALLS_COLLECTION_ID}.documents`;
        unsubscribe.current = client.subscribe(channel, (response) => {
            const payload = response.payload as any;
            const currentStatus = statusRef.current;
            const currentActiveCall = activeCallRef.current;

            if (response.events.some(e => e.includes('.create'))) {
                if (payload.receiverId === user.userId && payload.status === 'ringing') {
                    setIncomingCall(payload);
                    setCallStatus('ringing');
                }
            }

            if (response.events.some(e => e.includes('.update'))) {
                const callId = payload.$id;
                if (currentActiveCall && callId === currentActiveCall.$id) {
                    if (payload.status === 'ended') endCall(false);
                    if (user.userId === payload.callerId) {
                        if (payload.type === 'answer' && payload.sdp && peerConnection.current && currentStatus === 'ringing') {
                            handleAnswer(payload.sdp);
                        }
                        if (payload.receiverCandidates && payload.receiverCandidates.length > 0 && peerConnection.current) {
                            payload.receiverCandidates.forEach((c: string) => {
                                peerConnection.current?.addIceCandidate(JSON.parse(c)).catch(() => { });
                            });
                        }
                    } else if (user.userId === payload.receiverId) {
                        if (payload.callerCandidates && payload.callerCandidates.length > 0 && peerConnection.current) {
                            payload.callerCandidates.forEach((c: string) => {
                                peerConnection.current?.addIceCandidate(JSON.parse(c)).catch(() => { });
                            });
                        }
                    }
                }
            }
        });
        return () => { if (unsubscribe.current) unsubscribe.current(); };
    }, [user]);

    const startCall = async (receiverId: string) => {
        setCallStatus('calling');
        const pc = new RTCPeerConnection(rtcConfig);
        peerConnection.current = pc;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStream.current = stream;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        } catch (err: any) {
            alert(`Voice Connection Blocked: ${err.message || 'Microphone access is required.'}`);
            setCallStatus('idle');
            return;
        }

        pc.ontrack = (event) => {
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
                } else { initialCandidates.push(candStr); }
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await new Promise(r => setTimeout(r, 600));

        try {
            const callDoc = await databases.createDocument(DATABASE_ID, CALLS_COLLECTION_ID, ID.unique(), {
                callerId: user!.userId,
                receiverId,
                status: 'ringing',
                sdp: JSON.stringify(pc.localDescription),
                type: 'offer',
                callerCandidates: initialCandidates
            });
            setActiveCall(callDoc);
            activeCallRef.current = callDoc;
            setCallStatus('ringing');

            setRingTimer(setTimeout(async () => {
                if (statusRef.current !== 'connected') {
                    await logCallEvidence(user!.userId, receiverId, 0);
                    endCall(true);
                }
            }, 30000));
        } catch (err) { setCallStatus('idle'); }
    };

    const answerCall = async () => {
        if (!incomingCall || !user) return;
        if (ringTimer) clearTimeout(ringTimer);
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
                    try {
                        await databases.updateDocument(DATABASE_ID, CALLS_COLLECTION_ID, incomingCall.$id, {
                            receiverCandidates: [...receiverCandidates]
                        });
                    } catch (e) { }
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
            setActiveCall(incomingCall);
            activeCallRef.current = incomingCall;
            callStartTime.current = Date.now();
        } catch (err) { endCall(true); }
    };

    const handleAnswer = async (sdp: string) => {
        if (!peerConnection.current || peerConnection.current.signalingState === 'stable') return;
        if (ringTimer) clearTimeout(ringTimer);
        try {
            const remoteDesc = new RTCSessionDescription(JSON.parse(sdp));
            await peerConnection.current.setRemoteDescription(remoteDesc);
            setCallStatus('connected');
            statusRef.current = 'connected';
            callStartTime.current = Date.now();
        } catch (e) { }
    };

    const endCall = async (notifyBackend = true) => {
        if (ringTimer) clearTimeout(ringTimer);
        if (localStream.current) localStream.current.getTracks().forEach(t => t.stop());
        if (peerConnection.current) peerConnection.current.close();
        
        if (notifyBackend && activeCallRef.current) {
            try {
                const duration = callStartTime.current ? Math.floor((Date.now() - callStartTime.current) / 1000) : 0;
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
        setIsMuted(false);
        setLiveDuration(0);
    };

    const toggleMute = () => {
        if (localStream.current) {
            const audioTrack = localStream.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
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

    const displayDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-1000 flex items-center justify-center overflow-hidden animate-fadeIn font-sans">
            <div className="absolute inset-0 bg-[#075e54] dark:bg-slate-950/98 transition-all duration-700">
                <div className="absolute inset-0 opacity-10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]"></div>
                <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/60"></div>
            </div>

            <audio ref={audioRef} autoPlay />

            <div className="relative w-full h-full flex flex-col items-center justify-between py-24 px-8 z-10">
                <div className="text-center space-y-4 animate-slideDown">
                    <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-2 text-white/60 text-[10px] uppercase font-black tracking-[0.3em]">
                            <i className="fa-solid fa-lock text-[8px]"></i> End-to-End Encrypted
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mt-4 uppercase">
                            {incomingCall ? "Incoming call" : (callStatus === 'connected' ? "Active Connection" : "Calling...")}
                        </h2>
                    </div>
                    <p className="text-teal-400 font-bold text-sm md:text-lg uppercase tracking-widest">
                        {callStatus === 'connected' ? displayDuration(liveDuration) : (incomingCall ? "Voice Call" : "Linking Terminals...")}
                    </p>
                </div>

                <div className="relative flex items-center justify-center">
                    <div className={`absolute w-48 h-48 md:w-64 md:h-64 bg-teal-500/20 rounded-full ${callStatus !== 'connected' ? 'animate-ping' : ''} duration-3000`}></div>
                    <div className="relative w-44 h-44 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                        <img src={`https://ui-avatars.com/api/?name=${incomingCall ? "INCOMING" : (callStatus === 'connected' ? "ACTIVE" : "STUDENT")}&background=075e54&color=fff&size=512&bold=true`} className="w-full h-full object-cover" />
                    </div>
                </div>

                <div className="w-full max-w-sm bg-white/10 backdrop-blur-3xl rounded-[40px] p-6 md:p-8 flex items-center justify-between border border-white/10 shadow-2xl animate-slideUp">
                    <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isSpeakerOn ? 'bg-white/20 text-white' : 'bg-white text-[#075e54]'}`}>
                        <i className={`fa-solid ${isSpeakerOn ? 'fa-volume-high' : 'fa-volume-off'} text-xl`}></i>
                    </button>

                    <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-rose-500' : 'bg-white/20 text-white'}`}>
                        <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-xl`}></i>
                    </button>

                    {incomingCall ? (
                        <div className="flex gap-4">
                            <button onClick={() => endCall(true)} className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center shadow-lg justify-center"><i className="fa-solid fa-phone-slash text-2xl"></i></button>
                            <button onClick={answerCall} className="w-16 h-16 rounded-full bg-teal-500 text-white flex items-center shadow-lg justify-center animate-bounce"><i className="fa-solid fa-phone text-2xl"></i></button>
                        </div>
                    ) : (
                        <button onClick={() => endCall(true)} className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center shadow-xl justify-center hover:scale-110 transition-transform"><i className="fa-solid fa-phone-slash text-2xl"></i></button>
                    )}

                    <button className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center opacity-50"><i className="fa-solid fa-video text-xl"></i></button>
                </div>
            </div>
        </div>
    );
};

export default CallManager;
