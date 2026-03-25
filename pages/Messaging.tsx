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
    { id: '#003366', color: 'bg-[#003366]', label: 'Midnight' },
    { id: '#4f46e5', color: 'bg-indigo-600', label: 'Royal' },
    { id: '#0d9488', color: 'bg-teal-600', label: 'Forest' },
    { id: '#d97706', color: 'bg-amber-600', label: 'Sunset' },
    { id: '#e11d48', color: 'bg-rose-600', label: 'Vibrant' },
    { id: '#059669', color: 'bg-emerald-600', label: 'Emerald' },
    { id: '#7c3aed', color: 'bg-violet-600', label: 'Violet' },
    { id: '#475569', color: 'bg-slate-600', label: 'Slate' },
    { id: '#0284c7', color: 'bg-sky-600', label: 'Sky' },
    { id: '#881337', color: 'bg-rose-900', label: 'Wine' },
    { id: 'https://images.unsplash.com/photo-1557683316-973673baf926', color: 'bg-indigo-100', label: 'Gradient' },
    { id: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab', color: 'bg-blue-100', label: 'Abstract' },
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
    <div className="h-[calc(100vh-140px)] w-full max-w-[1500px] mx-auto md:w-[calc(100%-5rem)] flex bg-white overflow-hidden shadow-2xl md:rounded-[48px] border border-slate-100 animate-fadeIn my-12 md:my-12 relative z-10 transition-all duration-500">

      {/* Sidebar Terminal */}
      <div className={`w-full md:w-1/3 lg:w-[450px] bg-slate-50 border-r border-slate-100 flex flex-col h-full ${chattingWith ? "hidden md:flex" : "flex"}`}>
        <div className="h-20 md:h-24 px-6 md:px-10 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-xl md:text-2xl font-black text-[#003366] uppercase tracking-tighter">Campus <span className="text-teal-600">Chat.</span></h2>
        </div>
        <div className="grow overflow-y-auto bg-white no-scrollbar">
          {conversations.map((c, i) => (
            <button key={i} onClick={() => { setChattingWith(c.user); navigate(`/messages?with=${c.user.userId}`); }} className={`w-full h-20 md:h-24 px-6 md:px-10 flex items-center gap-4 md:gap-6 border-b border-slate-50 transition-all ${chattingWith?.userId === c.user.userId ? "bg-teal-50/50" : "hover:bg-slate-50"}`}>
              <img src={c.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user.name)}&background=003366&color=fff`} className="w-12 h-12 md:w-16 md:h-16 rounded-[22px] md:rounded-[28px] shrink-0 shadow-lg border-2 border-white object-cover" alt="Av" />
              <div className="grow text-left overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[13px] md:text-[15px] font-black text-[#003366] uppercase tracking-tight truncate leading-none">{c.user.name}</p>
                  <span className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest">{c.time}</span>
                </div>
                <p className="text-[11px] md:text-[12px] text-slate-400 font-medium italic truncate leading-relaxed">{c.lastMsg}</p>
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
            <div className="h-20 md:h-24 px-4 md:px-12 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-100 z-60 shrink-0">
              <div className="flex items-center gap-3 md:gap-6">
                <button onClick={() => setChattingWith(null)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-[#003366]"><i className="fa-solid fa-arrow-left"></i></button>
                <Link to={`/user/${chattingWith.userId}`} className="flex items-center gap-3 md:gap-6 hover:opacity-80 transition-opacity group">
                  <div className="relative">
                    <img src={chattingWith.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(chattingWith.name)}&background=003366&color=fff`} className="w-10 h-10 md:w-16 md:h-16 rounded-[18px] md:rounded-[28px] shadow-md border-2 border-white object-cover group-hover:scale-105 transition-transform" alt="Av" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-5 md:h-5 bg-teal-500 rounded-lg border-2 md:border-4 border-white"></div>
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm md:text-xl font-black text-[#003366] uppercase tracking-tighter truncate leading-none mb-1 group-hover:text-teal-600 transition-colors">{chattingWith.name}</h3>
                    <span className="text-[8px] md:text-[10px] font-black text-teal-600 uppercase tracking-widest italic flex items-center gap-1 md:gap-2">
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-teal-500 rounded-full animate-pulse"></span>
                      Verified Student
                    </span>
                  </div>
                </Link>
              </div>
              <div className="flex gap-2 md:gap-4 relative z-50">
                <button 
                  onClick={() => setShowWallpaperPicker(!showWallpaperPicker)} 
                  className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-xl md:rounded-2xl transition-all shadow-sm active:scale-95 group ${showWallpaperPicker ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  title="Change Wallpaper"
                >
                  <i className="fa-solid fa-palette text-sm md:text-xl"></i>
                </button>

                {showWallpaperPicker && (
                  <div className="absolute top-full right-0 mt-4 p-4 bg-white rounded-3xl shadow-2xl border border-slate-100 w-[280px] max-h-[400px] overflow-y-auto z-70 animate-slideUp no-scrollbar">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#003366] mb-4 text-center">Chat Theme</p>
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
                              className={`w-12 h-12 rounded-2xl border-2 ${chatWallpaper === wp.id ? 'border-teal-500 scale-110' : 'border-slate-100'} shadow-sm hover:scale-110 transition-transform flex items-center justify-center overflow-hidden`}
                              style={{ 
                                backgroundColor: isColor ? (wp.id === 'default' ? '#fff' : wp.id) : undefined,
                                backgroundImage: isImage ? `url("${wp.id}?w=100&h=100&fit=crop")` : undefined,
                                backgroundSize: 'cover'
                              }}
                            >
                              {wp.id === 'custom' && <i className="fa-solid fa-camera text-white text-xs"></i>}
                            </div>
                            <span className="text-[8px] font-bold uppercase text-slate-500 truncate w-full">{wp.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button onClick={initiateCall} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-teal-50 text-teal-600 rounded-xl md:rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-sm active:scale-95 group">
                  <i className="fa-solid fa-phone text-sm md:text-xl group-hover:rotate-12 transition-transform"></i>
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="grow px-4 md:px-12 py-8 md:py-12 space-y-6 md:space-y-8 overflow-y-auto no-scrollbar relative w-full overflow-x-hidden"
              style={{ 
                backgroundColor: chatWallpaper.startsWith('#') ? chatWallpaper : undefined,
                backgroundImage: !chatWallpaper.startsWith('#') && chatWallpaper !== 'default' ? `url("${chatWallpaper}")` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`, backgroundRepeat: 'repeat', backgroundSize: '400px' }}></div>
              <div className="relative z-10 flex flex-col gap-6 md:gap-8 w-full">
                {messages.map((m: any, i) => {
                  const isMe = m.senderId === user?.userId;
                  return (
                    <div key={m.$id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] space-y-2 md:space-y-3 flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`px-4 py-3 md:px-8 md:py-6 rounded-[24px] md:rounded-[32px] text-[13px] md:text-[15px] font-medium leading-relaxed border wrap-break-word w-full shadow-sm ${isMe ? "bg-[#003366] text-white rounded-tr-none border-[#003366] text-right" : "bg-white text-slate-800 rounded-tl-none border-slate-50 text-left"}`}>
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
                              <button onClick={() => toggleAudio(m.$id)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isMe ? 'bg-white text-[#003366]' : 'bg-[#003366] text-white'}`}>
                                <i className={`fa-solid ${currentlyPlaying === m.$id ? 'fa-pause' : 'fa-play ml-1'} text-xs md:text-base`}></i>
                              </button>
                              <div className="grow space-y-1.5 md:space-y-2 min-w-[100px] md:min-w-[150px]">
                                <div className={`h-1 rounded-full relative ${isMe ? 'bg-white/20' : 'bg-slate-100'}`}>
                                  {currentlyPlaying === m.$id && <div className={`absolute left-0 top-0 h-full w-1/3 rounded-full bg-teal-400 animate-progressPulse`}></div>}
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

            <div className="relative bg-white border-t border-slate-100 p-4 md:p-10 shrink-0">
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-4 left-4 md:left-10 p-4 md:p-6 bg-white rounded-[24px] md:rounded-[36px] shadow-2xl border border-slate-50 grid grid-cols-5 gap-2 md:gap-3 w-[220px] md:w-[280px] h-[300px] overflow-y-auto z-50 animate-slideUp no-scrollbar scroll-smooth">
                  {POPULAR_EMOJIS.map(emoji => <button key={emoji} onClick={() => addEmoji(emoji)} className="w-8 h-8 md:w-12 md:h-12 text-lg md:text-2xl hover:scale-125 transition-transform flex items-center justify-center">{emoji}</button>)}
                </div>
              )}
              <div className="flex items-center gap-3 md:gap-10 grow max-w-full">
                <div className="flex gap-4 md:gap-8 text-slate-300 text-xl md:text-3xl shrink-0">
                  <i className={`fa-regular fa-face-smile cursor-pointer ${showEmojiPicker ? "text-teal-600" : "hover:text-[#003360]"} transition-colors`} onClick={() => setShowEmojiPicker(!showEmojiPicker)}></i>
                  <i className={`fa-solid fa-paperclip cursor-pointer ${uploadingFile ? "animate-spin text-teal-600" : "hover:text-[#003360]"} transition-colors`} onClick={() => fileInputRef.current?.click()}></i>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <input type="file" className="hidden" ref={wallpaperInputRef} accept="image/*" onChange={handleWallpaperUpload} />
                </div>

                <div className="grow flex items-center gap-3 md:gap-6">
                  {isRecording ? (
                    <div className="grow flex items-center justify-between bg-rose-50 border border-rose-100 rounded-[20px] md:rounded-[32px] px-4 md:px-8 py-3 md:py-5 animate-pulse relative">
                      <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <span className="w-2 h-2 md:w-3 md:h-3 bg-rose-500 rounded-full animate-ping"></span>
                        <span className="text-[8px] md:text-[11px] font-black uppercase tracking-widest text-rose-500 truncate">Recording: {formatDuration(recordingDuration)}</span>
                      </div>
                      <button onClick={stopRecording} className="text-[8px] md:text-xs font-black uppercase tracking-widest text-rose-600 underline shrink-0 ml-2">Send</button>
                    </div>
                  ) : (
                    <div className="grow relative flex items-center">
                      <form onSubmit={sendMessage} className="grow">
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-100 rounded-[24px] md:rounded-[40px] pl-6 pr-14 md:pl-10 md:pr-24 py-4 md:py-7 text-xs md:text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 md:focus:ring-12 focus:ring-teal-50 transition-all placeholder:text-slate-300 shadow-sm"
                          placeholder="Message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                        />
                        {newMessage.trim() && (
                          <button type="submit" className="absolute right-1.5 md:right-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 flex items-center justify-center rounded-xl md:rounded-[30px] bg-[#003366] text-white shadow-xl transition-all scale-105 active:scale-95">
                            <i className="fa-solid fa-paper-plane text-[10px] md:text-xl"></i>
                          </button>
                        )}
                      </form>
                      {!newMessage.trim() && (
                        <button onClick={startRecording} className="absolute right-1.5 md:right-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 flex items-center justify-center bg-teal-500 text-white rounded-xl md:rounded-[30px] hover:bg-teal-600 transition-all shadow-md active:scale-90">
                          <i className="fa-solid fa-microphone text-xs md:text-xl"></i>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grow flex flex-col items-center justify-center p-10 md:p-20 text-center bg-slate-50/20">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-100 rounded-[40px] md:rounded-[48px] flex items-center justify-center text-slate-200 mb-6 md:mb-8 animate-pulse">
              <i className="fa-solid fa-satellite-dish text-4xl md:text-6xl"></i>
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-[#003366] uppercase tracking-tighter">Hub Terminal.</h2>
            <p className="text-[8px] md:text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-3 md:mt-4 italic">Select a student terminal to engage encryption.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
