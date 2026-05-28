import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { databases, storage, client } from "../lib/appwrite";
import { useAuth } from "../App";
import { ID, Query } from "appwrite";
import { Message, UserProfile } from "../types";

const POPULAR_EMOJIS = ["👋", "🔥", "🤝", "💰", "🎓", "📚", "✅", "❌", "💯", "🚀", "😂", "😭", "😍", "🤔", "👍", "👎", "❤️", "💔", "🎉", "🎊", "🚗", "💜", "❤️", "👖", "🧵", "🎁", "🎈", "🎊", "🎉", "🎗️", "🕶️", "👕", "🧢", "💄", "💄", "🏀", "🏈", "🥎", "🎯", "🔔", "🎧", "🎤", "📢", "🪕", "🎹", "📻", "🔨", "🔒", "🔓", "🔑", "🗝️", "🛖", "🧱", "⚙️", "💊", "🧲", "🪜", "🔗", "♂️", "📞", "☎️", "📱", "💣", "💾", "🔌", "🎥", "📸", "📹", "🔍", "📖", "📕", "📗", "📘", "📚", "💴", "💵", "💶", "💷", "🏧", "✏️", "🖌️", "🖋️", "📂", "🗂️", "📈", "🗓️", "✂️", "🕰️", "🍿", "🍞", "🥪", "🍚", "🍰"];

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
  const [chatWallpaper, setChatWallpaper] = useState<string>(localStorage.getItem("chat-wallpaper") || "default");
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  const WALLPAPERS = [
    { id: 'default', color: 'bg-white', label: 'Default' },
    { id: '#1E3A8A', color: 'bg-brand-primary', label: 'Midnight' },
    { id: '#4f46e5', color: 'bg-brand-primary', label: 'Royal' },
    { id: '#0d9488', color: 'bg-brand-primary', label: 'Forest' },
    { id: '#d97706', color: 'bg-brand-secondary', label: 'Sunset' },
    { id: '#e11d48', color: 'bg-rose-600', label: 'Vibrant' },
    { id: '#059669', color: 'bg-emerald-600', label: 'Emerald' },
    { id: '#7c3aed', color: 'bg-violet-600', label: 'Violet' },
    { id: '#475569', color: 'bg-slate-600', label: 'Slate' },
    { id: '#0284c7', color: 'bg-sky-600', label: 'Sky' },
    { id: '#881337', color: 'bg-rose-900', label: 'Wine' },
    { id: 'https://images.unsplash.com/photo-1557683316-973673baf926', color: 'bg-brand-surface', label: 'Gradient' },
    { id: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab', color: 'bg-brand-surface', label: 'Abstract' },
    { id: 'custom', color: 'bg-slate-800', label: 'Upload', isAction: true },
  ];

  const changeWallpaper = (id: string) => {
    if (id === 'custom') {
      wallpaperInputRef.current?.click();
    } else {
      setChatWallpaper(id);
      localStorage.setItem("chat-wallpaper", id);
    }
    setShowWallpaperPicker(false);
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingFile(true);
      const response = await storage.createFile(import.meta.env.VITE_APPWRITE_BUCKET_ID, ID.unique(), file);
      const fileUrl = storage.getFileView(import.meta.env.VITE_APPWRITE_BUCKET_ID, response.$id).toString();
      setChatWallpaper(fileUrl);
      localStorage.setItem("chat-wallpaper", fileUrl);
    } catch (error) {
      alert("Wallpaper upload failed.");
    } finally {
      setUploadingFile(false);
    }
  };

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback State
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

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
            try {
              const profile = await databases.getDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", id);
              return { user: profile as unknown as UserProfile, ...details };
            } catch (err) {
              console.warn(`Profile not found for ID: ${id}`);
              return { 
                user: { $id: id, userId: id, name: "Deleted User", email: "", department: "", level: "", role: "STUDENT", matricNumber: "", sellerStatus: "UNVERIFIED" } as unknown as UserProfile, 
                ...details 
              };
            }
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
        } else if (response.events.some(e => e.includes("delete"))) {
          const msg = response.payload as Message;
          setMessages(prev => prev.filter(m => m.$id !== msg.$id));
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

  const toggleAudio = (id: string) => {
    const audio = audioRefs.current.get(id);
    if (!audio) return;

    if (currentlyPlaying === id) {
      audio.pause();
      setCurrentlyPlaying(null);
    } else {
      if (currentlyPlaying) {
        audioRefs.current.get(currentlyPlaying)?.pause();
      }
      audio.play();
      setCurrentlyPlaying(id);
      audio.onended = () => setCurrentlyPlaying(null);
    }
  };

  const initiateCall = () => {
    if (!chattingWith) return;
    console.log(`[Messaging] Dispatching start-app-call for: ${chattingWith.userId}`);
    window.dispatchEvent(new CustomEvent('start-app-call', { detail: { receiverId: chattingWith.userId } }));
  };

  const deleteMessage = async (msgId: string) => {
    try {
      await databases.deleteDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "messages", msgId);
      setMessages(prev => prev.filter(m => m.$id !== msgId));
    } catch (error) { console.error(error); }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style>
        {`
          .dynamic-chat-bg {
            background-color: ` + (chatWallpaper.startsWith('#') ? chatWallpaper : 'transparent') + `;
            background-image: ` + (!chatWallpaper.startsWith('#') && chatWallpaper !== 'default' ? "url('" + chatWallpaper + "')" : 'none') + `;
            background-size: cover;
            background-position: center;
          }
        ` + WALLPAPERS.map(wp => {
            const safeId = wp.id.replace(/[^a-zA-Z0-9]/g, '');
            const isColor = wp.id.startsWith('#') || wp.id === 'default';
            const isImage = wp.id.startsWith('http');
            return `
              .wp-preview-` + safeId + ` {
                background-color: ` + (isColor ? (wp.id === 'default' ? '#fff' : wp.id) : 'transparent') + `;
                background-image: ` + (isImage ? "url('" + wp.id + "?w=100&h=100&fit=crop')" : 'none') + `;
                background-size: cover;
              }
            `;
          }).join('')}
      </style>
      <div className="h-[calc(100vh-140px)] w-full max-w-[1500px] mx-auto md:w-[calc(100%-5rem)] flex overflow-hidden shadow-2xl md:rounded-[48px] border-0 animate-fadeIn my-12 md:my-12 relative z-10 transition-all duration-500 glass-panel">

      {/* Sidebar Terminal */}
      <div className={`w-full md:w-1/3 lg:w-[450px] bg-transparent flex flex-col h-full ${chattingWith ? "hidden md:flex" : "flex"}`}>
        <div className="h-24 md:h-28 px-6 md:px-10 flex items-center justify-between bg-black/20 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Campus <span className="text-[#F5A623]">Chat.</span></h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Active Transmissions</p>
          </div>
          <Link to="/support" className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm border-0" title="Safe Trade Support">
             <i className="fa-solid fa-shield-halved"></i>
          </Link>
        </div>
        <div className="grow overflow-y-auto bg-transparent no-scrollbar">
          {conversations.map((c, i) => (
            <button key={i} onClick={() => { setChattingWith(c.user); navigate(`/messages?with=${c.user.userId}`); }} className={`w-full px-4 md:px-6 py-3 flex items-center gap-4 transition-all ${chattingWith?.userId === c.user.userId ? "bg-white/10" : "hover:bg-white/5"}`}>
              <img src={c.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user.name)}&background=1E3A8A&color=fff`} className="w-12 h-12 md:w-14 md:h-14 rounded-full shrink-0 object-cover" alt="Avatar" />
              <div className="grow text-left overflow-hidden pb-3 h-full flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1 mt-2">
                  <p className="text-sm md:text-[16px] font-semibold text-white truncate leading-none capitalize">{c.user.name.toLowerCase()}</p>
                  <span className="text-[10px] md:text-xs text-slate-400">{c.time}</span>
                </div>
                <p className="text-xs md:text-sm text-slate-400 truncate leading-relaxed">{c.lastMsg}</p>
              </div>
            </button>
          ))}
          {conversations.length === 0 && <div className="py-20 text-center uppercase font-black text-slate-200 text-[10px] tracking-[0.4em]">Registry Empty.</div>}
        </div>
      </div>

      {/* Main Distributed Stream */}
      <div className={`grow flex flex-col h-full bg-transparent relative ${!chattingWith ? "hidden md:flex" : "flex"}`}>
        {chattingWith ? (
          <>
            <div className="h-20 md:h-24 px-4 md:px-12 flex items-center justify-between bg-black/40 backdrop-blur-xl border-0 z-60 shrink-0">
              <div className="flex items-center gap-3 md:gap-6">
                <button onClick={() => setChattingWith(null)} aria-label="Close chat" className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white"><i className="fa-solid fa-arrow-left" aria-hidden="true"></i></button>
                <Link to={`/user/${chattingWith.userId}`} className="flex items-center gap-3 md:gap-6 hover:opacity-80 transition-opacity group">
                  <div className="relative">
                    <img src={chattingWith.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(chattingWith.name)}&background=003366&color=fff`} className="w-10 h-10 md:w-16 md:h-16 rounded-[18px] md:rounded-[28px] shadow-md border-0 object-cover group-hover:scale-105 transition-transform" alt="Av" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-5 md:h-5 bg-emerald-500 rounded-full border-2 md:border-4 border-[#08110c]"></div>
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm md:text-xl font-black text-white uppercase tracking-tighter truncate leading-none mb-1 transition-colors">{chattingWith.name}</h3>
                    <span className="text-[8px] md:text-[10px] font-black text-[#F5A623] uppercase tracking-widest italic flex items-center gap-1 md:gap-2">
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#F5A623] rounded-full animate-pulse"></span>
                      Verified Student
                    </span>
                  </div>
                </Link>
              </div>
              <div className="flex gap-2 md:gap-4 relative z-50">
                <button 
                  onClick={() => setShowWallpaperPicker(!showWallpaperPicker)} 
                  className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-xl md:rounded-2xl transition-all shadow-sm active:scale-95 group ${showWallpaperPicker ? 'bg-[#F5A623] text-[#003366]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  title="Change Wallpaper"
                >
                  <i className="fa-solid fa-palette text-sm md:text-xl"></i>
                </button>

                {showWallpaperPicker && (
                  <div className="absolute top-full right-0 mt-4 p-4 glass-panel border-0 w-[280px] max-h-[400px] overflow-y-auto z-70 animate-slideUp no-scrollbar">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white mb-4 text-center">Chat Theme</p>
                    <div className="grid grid-cols-4 gap-3">
                      {WALLPAPERS.map(wp => {
                        const isColor = wp.id.startsWith('#') || wp.id === 'default';
                        const isImage = wp.id.startsWith('http');
                        return (
                          <button 
                            key={wp.id} 
                            onClick={() => changeWallpaper(wp.id)}
                            className={`group flex flex-col items-center gap-2`}
                          >
                            <div 
                              className={`w-12 h-12 rounded-2xl border-0 ${chatWallpaper === wp.id ? 'scale-110 ring-2 ring-[#F5A623]' : ''} shadow-sm hover:scale-110 transition-transform flex items-center justify-center overflow-hidden wp-preview-${wp.id.replace(/[^a-zA-Z0-9]/g, '')}`}
                            >
                              {wp.id === 'custom' && <i className="fa-solid fa-camera text-white text-xs"></i>}
                            </div>
                            <span className="text-[8px] font-bold uppercase text-slate-300 truncate w-full">{wp.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button onClick={initiateCall} aria-label="Call user" className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-[#F5A623]/20 text-[#F5A623] rounded-xl md:rounded-2xl hover:bg-[#F5A623] hover:text-[#003366] transition-all shadow-sm active:scale-95 group border-0">
                  <i className="fa-solid fa-phone text-sm md:text-xl group-hover:rotate-12 transition-transform" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="grow px-4 md:px-12 py-8 md:py-12 space-y-6 md:space-y-8 overflow-y-auto no-scrollbar relative w-full overflow-x-hidden dynamic-chat-bg">
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-whatsapp-pattern"></div>
              <div className="relative z-10 flex flex-col gap-6 md:gap-8 w-full">
                {messages.map((m: any, i) => {
                  const isMe = m.senderId === user?.userId;
                  return (
                    <div key={m.$id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] space-y-2 md:space-y-3 flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`px-4 py-3 md:px-8 md:py-6 rounded-[24px] md:rounded-[32px] text-[13px] md:text-[15px] font-medium leading-relaxed wrap-break-word w-full shadow-sm border-0 ${isMe ? "bg-[#F5A623] text-[#003366] rounded-tr-none text-right" : "bg-white/10 text-white rounded-tl-none text-left backdrop-blur-md"}`}>
                          {m.type === 'file' ? (
                            <div className="space-y-3 md:space-y-4">
                              {m.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <div className="w-full bg-slate-900/5 rounded-2xl overflow-hidden">
                                  <img src={m.fileUrl} className="w-full h-auto object-contain max-h-[400px]" alt="Shared" />
                                </div>
                              ) : (
                                <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-black/5 rounded-2xl hover:bg-black/10 transition-all border border-black/5">
                                  <i className="fa-solid fa-file-invoice text-xl md:text-2xl"></i>
                                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest truncate max-w-[150px] md:max-w-[200px]">{m.fileName}</span>
                                </a>
                              )}
                            </div>
                          ) : m.type === 'audio' ? (
                            <div className="flex items-center gap-4 md:gap-6 py-1 md:py-2">
                              <button onClick={() => toggleAudio(m.$id)} aria-label={currentlyPlaying === m.$id ? 'Pause audio' : 'Play audio'} className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isMe ? 'bg-[#003366] text-[#F5A623]' : 'bg-[#F5A623] text-[#003366]'}`}>
                                <i className={`fa-solid ${currentlyPlaying === m.$id ? 'fa-pause' : 'fa-play ml-1'} text-xs md:text-base`} aria-hidden="true"></i>
                              </button>
                              <div className="grow space-y-1.5 md:space-y-2 min-w-[100px] md:min-w-[150px]">
                                <div className={`h-1 rounded-full relative ${isMe ? 'bg-white/20' : 'bg-slate-100'}`}>
                                  {currentlyPlaying === m.$id && <div className={`absolute left-0 top-0 h-full w-1/3 rounded-full bg-brand-surface0 animate-progressPulse`}></div>}
                                </div>
                                <div className="flex justify-between text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-60">
                                  <span>Voice Asset</span>

                                  <span>{formatDuration(m.duration || 0)}</span>
                                </div>
                              </div>
                              <audio ref={el => { if (el) audioRefs.current.set(m.$id, el); }} src={m.audioUrl} className="hidden" />
                            </div>
                          ) : m.text}
                        </div>
                        <div className="flex items-center gap-4 px-2 md:px-4">
                          <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-300 italic`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          {isMe && (
                            <button
                              onClick={() => deleteMessage(m.$id)}
                              className="text-[8px] md:text-[10px] text-rose-300 hover:text-rose-600 transition-colors"
                              title="Delete Message"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative bg-black/20 p-4 md:p-10 shrink-0 border-0">
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-4 left-4 md:left-10 p-4 md:p-6 glass-panel border-0 rounded-[24px] md:rounded-[36px] grid grid-cols-5 gap-2 md:gap-3 w-[220px] md:w-[280px] h-[300px] overflow-y-auto z-50 animate-slideUp no-scrollbar scroll-smooth">
                  {POPULAR_EMOJIS.map(emoji => <button key={emoji} onClick={() => addEmoji(emoji)} className="w-8 h-8 md:w-12 md:h-12 text-lg md:text-2xl hover:scale-125 transition-transform flex items-center justify-center">{emoji}</button>)}
                </div>
              )}
              <div className="flex items-center gap-3 md:gap-10 grow max-w-full">
                <div className="flex gap-4 md:gap-8 text-slate-300 text-xl md:text-3xl shrink-0">
                  <i className={`fa-regular fa-face-smile cursor-pointer ${showEmojiPicker ? "text-brand-primary" : "hover:text-[#003360]"} transition-colors`} onClick={() => setShowEmojiPicker(!showEmojiPicker)}></i>
                  <i className={`fa-solid fa-paperclip cursor-pointer ${uploadingFile ? "animate-spin text-brand-primary" : "hover:text-[#003360]"} transition-colors`} onClick={() => fileInputRef.current?.click()}></i>
                  <input type="file" className="hidden" aria-label="Upload file" title="Upload file" ref={fileInputRef} onChange={handleFileUpload} />
                  <input type="file" className="hidden" aria-label="Upload wallpaper" title="Upload wallpaper" ref={wallpaperInputRef} accept="image/*" onChange={handleWallpaperUpload} />
                </div>

                <div className="grow flex items-center gap-3 md:gap-6">
                  {isRecording ? (
                    <div className="grow flex items-center justify-between bg-rose-500/20 rounded-[20px] md:rounded-[32px] px-4 md:px-8 py-3 md:py-5 animate-pulse relative border-0">
                      <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <span className="w-2 h-2 md:w-3 md:h-3 bg-rose-500 rounded-full animate-ping"></span>
                        <span className="text-[8px] md:text-[11px] font-black uppercase tracking-widest text-rose-400 truncate">Recording: {formatDuration(recordingDuration)}</span>
                      </div>
                      <button onClick={stopRecording} className="text-[8px] md:text-xs font-black uppercase tracking-widest text-rose-400 underline shrink-0 ml-2">Send</button>
                    </div>
                  ) : (
                    <div className="grow relative flex items-center">
                      <form onSubmit={sendMessage} className="grow">
                        <input
                          type="text"
                          className="w-full bg-black/20 rounded-[24px] md:rounded-[40px] pl-6 pr-14 md:pl-10 md:pr-24 py-4 md:py-7 text-xs md:text-sm font-medium text-white outline-none focus:bg-black/40 transition-all placeholder:text-slate-400 shadow-inner border-0"
                          placeholder="Message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                        />
                        {newMessage.trim() && (
                          <button type="submit" aria-label="Send message" className="absolute right-1.5 md:right-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 flex items-center justify-center rounded-xl md:rounded-[30px] btn-gold shadow-xl transition-all scale-105 active:scale-95 border-0">
                            <i className="fa-solid fa-paper-plane text-[10px] md:text-xl" aria-hidden="true"></i>
                          </button>
                        )}
                      </form>
                      {!newMessage.trim() && (
                        <button onClick={startRecording} aria-label="Record voice message" className="absolute right-1.5 md:right-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 flex items-center justify-center bg-white/10 text-[#F5A623] rounded-xl md:rounded-[30px] hover:bg-white/20 transition-all shadow-md active:scale-90 border-0">
                          <i className="fa-solid fa-microphone text-xs md:text-xl" aria-hidden="true"></i>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grow flex flex-col items-center justify-center p-10 md:p-20 text-center bg-transparent">
            <div className="mb-8 relative">
               <div className="w-32 h-32 glass-panel rounded-[40px] flex items-center justify-center shadow-lg shadow-black/20 border-0 overflow-hidden">
                 <img src="/favicon.svg" alt="App Logo" className="w-16 h-16 opacity-30 grayscale" />
               </div>
               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#F5A623] rounded-full border-4 border-[#08110c] flex items-center justify-center text-[#003366]">
                  <i className="fa-solid fa-graduation-cap text-xs"></i>
               </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-4">UI DLC Campus Chat</h2>
            <p className="text-sm text-slate-300 mb-10 max-w-md leading-relaxed">
              Send and receive messages with your fellow students seamlessly. Select a contact to start chatting.
            </p>
            <div className="mt-auto pt-20 flex items-center justify-center gap-2 text-xs text-slate-400">
               <i className="fa-solid fa-lock text-[10px]"></i>
               <span>End-to-end encrypted by Campus Hub</span>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Messaging;
