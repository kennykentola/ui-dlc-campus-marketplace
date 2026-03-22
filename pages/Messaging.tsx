
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { databases, storage, client } from "../lib/appwrite";
import { useAuth } from "../App";
import { ID, Query } from "appwrite";
import { Message, UserProfile } from "../types";

const POPULAR_EMOJIS = ["👋", "🔥", "🤝", "💰", "🎓", "📚", "✅", "❌", "💯", "🚀"];

const Messaging: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sellerId = searchParams.get("with") || searchParams.get("seller");

  const [conversations, setConversations] = useState<{ user: UserProfile; lastMsg: string; time: string }[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chattingWith, setChattingWith] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConversationId = user && chattingWith 
    ? [user.userId, chattingWith.userId].sort().join("-") 
    : null;

  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      try {
        const res = await databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "messages", [
          Query.or([
            Query.equal("senderId", user.userId),
            Query.equal("receiverId", user.userId)
          ]),
          Query.orderDesc("createdAt"),
          Query.limit(100)
        ]);

        const uniqueConvos = new Map();
        for (const doc of res.documents) {
          const otherId = doc.senderId === user.userId ? doc.receiverId : doc.senderId;
          if (!uniqueConvos.has(otherId)) {
            uniqueConvos.set(otherId, { lastMsg: doc.text || "Shared File", time: new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
          }
        }

        const convosWithDetails = await Promise.all(
          Array.from(uniqueConvos.entries()).map(async ([id, details]) => {
            const profile = await databases.getDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", id);
            return { user: profile as unknown as UserProfile, ...details };
          })
        );
        setConversations(convosWithDetails);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!activeConversationId) return;
    const fetchMessages = async () => {
      try {
        const res = await databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "messages", [
          Query.equal("conversationId", activeConversationId),
          Query.orderAsc("createdAt"),
          Query.limit(100)
        ]);
        setMessages(res.documents as unknown as Message[]);
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
      } catch (error) { console.error(error); }
    };
    fetchMessages();

    const unsubscribe = client.subscribe(
      `databases.${import.meta.env.VITE_APPWRITE_DATABASE_ID}.collections.messages.documents`,
      (response) => {
        if (response.events.some(e => e.includes("create"))) {
          const msg = response.payload as Message;
          if (msg.conversationId === activeConversationId) {
            setMessages(prev => [...prev, msg]);
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
          }
        }
      }
    );
    return () => unsubscribe();
  }, [activeConversationId]);

  useEffect(() => {
    if (sellerId && user) {
      const loadTarget = async () => {
        try {
          const profile = await databases.getDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", sellerId);
          setChattingWith(profile as unknown as UserProfile);
        } catch (error) { console.error(error); }
      };
      loadTarget();
    }
  }, [sellerId, user]);

  const sendMessage = async (e?: React.FormEvent, type: 'text' | 'audio' | 'file' = 'text', payload: any = {}) => {
    e?.preventDefault();
    if (!user || !chattingWith || (!newMessage.trim() && type === 'text')) return;

    try {
      const data = {
        conversationId: activeConversationId,
        senderId: user.userId,
        receiverId: chattingWith.userId,
        text: type === 'text' ? newMessage : "",
        type,
        createdAt: new Date().toISOString(),
        isRead: false,
        ...payload
      };
      await databases.createDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "messages", ID.unique(), data);
      if (type === 'text') setNewMessage("");
      setShowEmojiPicker(false);
    } catch (error) { console.error(error); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        try {
          setUploadingFile(true);
          const response = await storage.createFile(import.meta.env.VITE_APPWRITE_BUCKET_ID, ID.unique(), file);
          const fileUrl = storage.getFileView(import.meta.env.VITE_APPWRITE_BUCKET_ID, response.$id).toString();
          await sendMessage(undefined, 'audio', { audioUrl: fileUrl, duration: recordingDuration });
        } catch (error) {
          alert("Audio transmission failed.");
        } finally {
          setUploadingFile(false);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimer.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
    } catch (err) {
      alert("Microphone access required for voice protocols.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !chattingWith) return;
    try {
      setUploadingFile(true);
      const response = await storage.createFile(import.meta.env.VITE_APPWRITE_BUCKET_ID, ID.unique(), file);
      const fileUrl = storage.getFileView(import.meta.env.VITE_APPWRITE_BUCKET_ID, response.$id).toString();
      await sendMessage(undefined, 'file', { fileUrl, fileName: file.name });
    } catch (error) {
      alert("Asset attachment failed.");
    } finally {
      setUploadingFile(false);
    }
  };

  const initiateCall = () => {
    if (!chattingWith) return;
    window.dispatchEvent(new CustomEvent('start-app-call', { detail: { receiverId: chattingWith.userId } }));
  };

  const parseMessageContent = (m: Message) => {
    return {
      type: m.type,
      text: m.text,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      audioUrl: m.audioUrl,
      duration: m.duration
    };
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  return (
    <div className="h-[calc(100vh-140px)] w-[calc(100%-2rem)] max-w-[1500px] mx-auto md:w-[calc(100%-5rem)] flex bg-white overflow-hidden shadow-2xl rounded-[48px] border border-slate-100 animate-fadeIn my-12 relative z-10 transition-all duration-500">
      
      {/* Sidebar Terminal */}
      <div className={`w-full md:w-1/3 lg:w-[450px] bg-slate-50 border-r border-slate-100 flex flex-col h-full ${chattingWith ? "hidden md:flex" : "flex"}`}>
        <div className="h-24 px-10 flex items-center justify-between border-b border-slate-100 bg-white">
           <h2 className="text-2xl font-black text-[#003366] uppercase tracking-tighter">Campus <span className="text-teal-600">Chat.</span></h2>
        </div>
        <div className="grow overflow-y-auto bg-white no-scrollbar">
          {conversations.map((c, i) => (
            <button key={i} onClick={() => { setChattingWith(c.user); navigate(`/messages?with=${c.user.userId}`); }} className={`w-full h-24 px-10 flex items-center gap-6 border-b border-slate-50 transition-all ${chattingWith?.userId === c.user.userId ? "bg-teal-50/50" : "hover:bg-slate-50"}`}>
              <img src={c.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user.name)}&background=003366&color=fff`} className="w-16 h-16 rounded-[28px] shrink-0 shadow-lg border-2 border-white object-cover" alt="Av" />
              <div className="grow text-left overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                   <p className="text-[15px] font-black text-[#003366] uppercase tracking-tight truncate leading-none">{c.user.name}</p>
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{c.time}</span>
                </div>
                <p className="text-[12px] text-slate-400 font-medium italic truncate leading-relaxed">{c.lastMsg}</p>
              </div>
            </button>
          ))}
          {conversations.length === 0 && <div className="py-20 text-center uppercase font-black text-slate-200 text-[10px] tracking-[0.4em]">Registry Empty.</div>}
        </div>
      </div>

      {/* Main Distributed Stream */}
      <div className={`grow flex flex-col h-full bg-white relative ${!chattingWith ? "hidden md:flex" : "flex"}`}>
        {chattingWith ? (
          <>
            <div className="h-24 px-6 md:px-12 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-100 z-10 shrink-0">
               <div className="flex items-center gap-6">
                 <button onClick={() => setChattingWith(null)} className="md:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 text-[#003366]"><i className="fa-solid fa-arrow-left"></i></button>
                 <div className="relative">
                    <img src={chattingWith.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(chattingWith.name)}&background=003366&color=fff`} className="w-12 h-12 md:w-16 md:h-16 rounded-[28px] shadow-lg border-2 border-white object-cover" alt="Av" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-500 rounded-lg border-4 border-white"></div>
                 </div>
                 <div className="overflow-hidden">
                    <h3 className="text-lg md:text-xl font-black text-[#003366] uppercase tracking-tighter truncate leading-none mb-1">{chattingWith.name}</h3>
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest italic flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                      Verified Scholar
                    </span>
                 </div>
               </div>
               <div className="flex gap-4">
                  <button onClick={initiateCall} className="w-14 h-14 flex items-center justify-center bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-sm active:scale-95 group">
                     <i className="fa-solid fa-phone text-xl group-hover:rotate-12 transition-transform"></i>
                  </button>
               </div>
            </div>

            <div ref={scrollRef} className="grow px-6 md:px-12 py-12 space-y-8 overflow-y-auto no-scrollbar relative w-full overflow-x-hidden">
               <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`, backgroundRepeat: 'repeat', backgroundSize: '400px' }}></div>
               <div className="relative z-10 flex flex-col gap-8 w-full">
                 {messages.map((m: any, i) => {
                    const isMe = m.senderId === user?.userId;
                    const parsed = parseMessageContent(m);
                    return (
                      <div key={i} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] space-y-3 flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                           <div className={`px-6 py-4 md:px-8 md:py-6 rounded-[32px] text-[15px] font-medium leading-relaxed border wrap-break-word w-full shadow-sm ${isMe ? "bg-[#003366] text-white rounded-tr-none border-[#003366] text-right" : "bg-white text-slate-800 rounded-tl-none border-slate-50 text-left"}`}>
                             {parsed.type === 'file' ? (
                                <div className="space-y-4">
                                   {parsed.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                      <div className="w-full bg-slate-900/5 rounded-2xl overflow-hidden">
                                         <img src={parsed.fileUrl} className="w-full h-auto object-contain max-h-[400px]" alt="Shared" />
                                      </div>
                                   ) : (
                                      <a href={parsed.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-black/5 rounded-2xl hover:bg-black/10 transition-all border border-black/5">
                                         <i className="fa-solid fa-file-invoice text-2xl"></i>
                                         <span className="text-[11px] font-black uppercase tracking-widest truncate max-w-[200px]">{parsed.fileName}</span>
                                      </a>
                                   )}
                                </div>
                             ) : parsed.type === 'audio' ? (
                                <div className="flex items-center gap-6 py-2">
                                   <button className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMe ? 'bg-white text-[#003366]' : 'bg-[#003366] text-white'}`}>
                                      <i className="fa-solid fa-play ml-1"></i>
                                   </button>
                                   <div className="grow space-y-2">
                                      <div className={`h-1.5 rounded-full relative ${isMe ? 'bg-white/20' : 'bg-slate-100'}`}>
                                         <div className={`absolute left-0 top-0 h-full w-1/3 rounded-full ${isMe ? 'bg-teal-400' : 'bg-[#003360]'}`}></div>
                                      </div>
                                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-60">
                                         <span>Voice Asset</span>
                                         <span>{formatDuration(parsed.duration || 0)}</span>
                                      </div>
                                   </div>
                                   <audio src={parsed.audioUrl} className="hidden" />
                                </div>
                             ) : parsed.text}
                           </div>
                           <p className={`text-[10px] font-black uppercase tracking-widest text-slate-300 italic px-4`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    );
                 })}
               </div>
            </div>

            <div className="relative bg-white border-t border-slate-100 p-6 md:p-10 shrink-0">
               {showEmojiPicker && (
                  <div className="absolute bottom-full mb-6 left-10 p-6 bg-white rounded-[36px] shadow-2xl border border-slate-50 grid grid-cols-5 gap-3 w-[280px] z-50 animate-slideUp">
                     {POPULAR_EMOJIS.map(emoji => <button key={emoji} onClick={() => addEmoji(emoji)} className="w-10 h-10 md:w-12 md:h-12 text-2xl hover:scale-125 transition-transform flex items-center justify-center">{emoji}</button>)}
                  </div>
               )}
               <div className="flex items-center gap-6 md:gap-10 grow">
                  <div className="flex gap-6 md:gap-8 text-slate-300 text-2xl md:text-3xl shrink-0">
                    <i className={`fa-regular fa-face-awesome cursor-pointer ${showEmojiPicker ? "text-teal-600" : "hover:text-[#003360]"} transition-colors`} onClick={() => setShowEmojiPicker(!showEmojiPicker)}></i>
                    <i className={`fa-solid fa-paperclip cursor-pointer ${uploadingFile ? "animate-spin text-teal-600" : "hover:text-[#003360]"} transition-colors`} onClick={() => fileInputRef.current?.click()}></i>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </div>
                  
                  <div className="grow flex items-center gap-5 relative">
                     {isRecording ? (
                        <div className="grow flex items-center justify-between bg-rose-50 border border-rose-100 rounded-[32px] px-8 py-5 animate-pulse">
                           <div className="flex items-center gap-4">
                              <span className="w-3 h-3 bg-rose-500 rounded-full animate-ping"></span>
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500">Node Recording: {formatDuration(recordingDuration)}</span>
                           </div>
                           <button onClick={stopRecording} className="text-xs font-black uppercase tracking-widest text-rose-600 underline">Transmit</button>
                        </div>
                     ) : (
                        <>
                           <form onSubmit={sendMessage} className="grow flex items-center gap-5">
                              <input type="text" className="grow bg-slate-50 border border-slate-100 rounded-[32px] px-10 py-6 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-12 focus:ring-teal-50 transition-all placeholder:text-slate-200 shadow-sm" placeholder="Document message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                              <button type="submit" className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-[28px] md:rounded-[36px] shadow-2xl transition-all ${newMessage.trim() ? "bg-[#003366] text-white scale-105" : "bg-slate-50 text-slate-200"}`}>
                                <i className="fa-solid fa-paper-plane text-xl md:text-2xl"></i>
                              </button>
                           </form>
                           <button onClick={startRecording} className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-teal-50 text-teal-600 rounded-[28px] md:rounded-[36px] hover:bg-teal-600 hover:text-white transition-all shadow-xl active:scale-90 group shrink-0">
                              <i className="fa-solid fa-microphone text-xl md:text-2xl group-hover:scale-110 transition-transform"></i>
                           </button>
                        </>
                     )}
                  </div>
               </div>
            </div>
          </>
        ) : (
          <div className="grow flex flex-col items-center justify-center p-20 text-center bg-slate-50/20">
             <div className="w-32 h-32 bg-slate-100 rounded-[48px] flex items-center justify-center text-slate-200 mb-8 animate-pulse">
               <i className="fa-solid fa-satellite-dish text-6xl"></i>
             </div>
             <h2 className="text-4xl font-black text-[#003366] uppercase tracking-tighter">Hub Terminal Active.</h2>
             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] mt-4 italic">Select a scholar to synchronize encrypted data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
