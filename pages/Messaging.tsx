
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { UserProfile, Message, Product } from "../types";
import { databases, storage } from "../lib/appwrite";
import { Query, ID } from "appwrite";

const POPULAR_EMOJIS = ["😊", "👍", "❤️", "😂", "🔥", "🤝", "📚", "🙏", "🙌", "🎓", "💸", "✅", "📍", "👀", "✨"];

const Messaging: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chattingWith, setChattingWith] = useState<UserProfile | null>(null);
  const [contextProduct, setContextProduct] = useState<Product | null>(null);
  const [conversations, setConversations] = useState<{ user: UserProfile; lastMsg: string; time: string; unread: number }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConversationId =
    user && chattingWith
      ? [user.userId, chattingWith.userId].sort().join("_")
      : null;

  // Hybrid Content Parser
  const parseMessageContent = (m: Message) => {
    if (m.text?.startsWith("FILE_XP_PROTOCOL:")) {
      try {
        const data = JSON.parse(m.text.replace("FILE_XP_PROTOCOL:", ""));
        return { type: 'file' as const, fileUrl: data.url, fileName: data.name, text: "" };
      } catch (e) { return { type: m.type, text: m.text }; }
    }
    if (m.type === 'file' && (m as any).fileUrl) {
      return { type: 'file' as const, fileUrl: (m as any).fileUrl, fileName: (m as any).fileName || "Shared Attachment", text: "" };
    }
    return { type: m.type, text: m.text, fileUrl: m.fileUrl, fileName: m.fileName };
  };

  useEffect(() => {
    const loadData = async () => {
      const params = new URLSearchParams(location.search);
      const sellerId = params.get("seller");
      const productId = params.get("product");

      if (!user) return;
      try {
        const [sent, received] = await Promise.all([
          databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "messages", [Query.equal("senderId", user.userId), Query.limit(100)]),
          databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "messages", [Query.equal("receiverId", user.userId), Query.limit(100)]),
        ]);

        const all = [...sent.documents, ...received.documents].map((m: any) => ({
          ...m, createdAt: m.$createdAt,
        })) as unknown as Message[];
        all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(all);

        const partners = new Set<string>();
        all.forEach(m => {
          const pid = m.senderId === user.userId ? m.receiverId : m.senderId;
          if (pid !== user.userId) partners.add(pid);
        });
        if (sellerId && sellerId !== user.userId) partners.add(sellerId);

        const convos: any[] = [];
        for (const pid of partners) {
           try {
             const profile = await databases.getDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", pid);
             const thread = all.filter(m => (m.senderId === pid && m.receiverId === user.userId) || (m.senderId === user.userId && m.receiverId === pid));
             const last = thread[thread.length - 1];
             const parsedLast = last ? parseMessageContent(last) : null;
             
             convos.push({
               user: profile,
               lastMsg: parsedLast?.type === 'file' ? `📁 ${parsedLast.fileName}` : (parsedLast?.text || 'No messages yet'),
               time: last ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
               unread: thread.filter(m => m.senderId === pid && !m.isRead).length
             });
           } catch (e) {}
        }
        setConversations(convos);

        if (sellerId && sellerId !== chattingWith?.userId) {
           try {
              const found = await databases.getDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", sellerId);
              setChattingWith(found as any);
           } catch (e) {
              setChattingWith({ name: "Hub Support", userId: "admin", isVerified: true } as any);
           }
        }
        if (productId) {
           try {
              const p = await databases.getDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "products", productId);
              setContextProduct(p as any);
           } catch (e) {}
        }
      } catch (err) { console.error(err); }
    };
    loadData();
  }, [location, user, chattingWith?.userId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chattingWith]);

  const sendMessage = async (e?: React.FormEvent, data: any = {}) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !data.fileUrl) || !user || !chattingWith) return;
    
    try {
      const protocolContent = data.fileUrl 
        ? `FILE_XP_PROTOCOL:${JSON.stringify({ url: data.fileUrl, name: data.fileName })}`
        : newMessage;

      const payload: any = {
        conversationId: activeConversationId,
        senderId: user.userId,
        receiverId: chattingWith.userId,
        type: data.fileUrl ? 'file' : 'text',
        text: protocolContent,
        isRead: false
      };

      const msg = await databases.createDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "messages", ID.unique(), payload);
      setMessages(prev => [...prev, msg as any]);
      setNewMessage("");
      setShowEmojiPicker(false);
    } catch (err) { 
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !chattingWith) return;
    setUploadingFile(true);
    try {
      const uploadedFile = await storage.createFile(import.meta.env.VITE_APPWRITE_BUCKET_ID, ID.unique(), file);
      const url = storage.getFileView(import.meta.env.VITE_APPWRITE_BUCKET_ID, uploadedFile.$id).toString();
      await sendMessage(undefined, { fileUrl: url, fileName: file.name });
    } catch (error) {
       console.error("Upload Error", error);
       alert("Asset attachment failed.");
    } finally {
      setUploadingFile(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  return (
    <div className="h-[calc(100vh-140px)] w-[calc(100%-2rem)] max-w-[1500px] mx-auto md:w-[calc(100%-5rem)] flex bg-white overflow-hidden shadow-2xl rounded-[40px] border border-slate-100 animate-fadeIn my-12 relative z-10">
      
      {/* Sidebar Terminal */}
      <div className={`w-full md:w-1/3 lg:w-[450px] bg-slate-50 border-r border-slate-100 flex flex-col h-full ${chattingWith ? "hidden md:flex" : "flex"}`}>
        <div className="h-24 px-8 flex items-center justify-between border-b border-slate-100 bg-white">
           <h2 className="text-2xl font-black text-[#003366] uppercase tracking-tighter">Campus <span className="text-teal-600">Chat.</span></h2>
        </div>
        <div className="grow overflow-y-auto bg-white no-scrollbar">
          {conversations.map((c, i) => (
            <button key={i} onClick={() => { setChattingWith(c.user); navigate(`/messages?seller=${c.user.userId}`); }} className={`w-full h-24 px-8 flex items-center gap-5 border-b border-slate-50 ${chattingWith?.userId === c.user.userId ? "bg-teal-50/50" : "hover:bg-slate-50"}`}>
              <img src={c.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user.name)}&background=003366&color=fff`} className="w-14 h-14 rounded-3xl shrink-0 shadow-lg border-2 border-white" alt="Av" />
              <div className="grow text-left overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                   <p className="text-[14px] font-black text-[#003366] uppercase tracking-tight truncate">{c.user.name}</p>
                   <span className="text-[9px] font-black text-slate-300 uppercase">{c.time}</span>
                </div>
                <p className="text-[12px] text-slate-400 font-medium italic truncate leading-relaxed">{c.lastMsg}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Distributed Stream */}
      <div className={`grow flex flex-col h-full bg-white relative ${!chattingWith ? "hidden md:flex" : "flex"}`}>
        {chattingWith ? (
          <>
            <div className="h-24 px-6 md:px-10 flex items-center justify-between bg-white border-b border-slate-100 z-10 shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setChattingWith(null)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-[#003366]"><i className="fa-solid fa-arrow-left"></i></button>
                <img src={chattingWith.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(chattingWith.name)}&background=003366&color=fff`} className="w-12 h-12 md:w-14 md:h-14 rounded-3xl shadow-lg border-2 border-white" alt="Av" />
                <div className="overflow-hidden">
                   <h3 className="text-[15px] md:text-[17px] font-black text-[#003366] uppercase tracking-tighter truncate">{chattingWith.name}</h3>
                   <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest italic flex items-center gap-1">
                     <span className="w-1 h-1 bg-teal-500 rounded-full animate-pulse"></span>
                     Audited
                   </span>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="grow px-4 md:px-10 py-10 space-y-6 overflow-y-auto no-scrollbar relative w-full overflow-x-hidden">
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`, backgroundRepeat: 'repeat', backgroundSize: '350px' }}></div>
               <div className="relative z-10 flex flex-col gap-6 w-full">
                 {messages.filter(m => !activeConversationId || m.conversationId === activeConversationId).map((m: any, i) => {
                   const isMe = m.senderId === user?.userId;
                   const parsed = parseMessageContent(m);
                   return (
                     <div key={i} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                       <div className={`max-w-[85%] md:max-w-[70%] space-y-2 flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div className={`px-5 py-3 md:px-6 md:py-4 rounded-[24px] md:rounded-[28px] text-[14px] font-medium leading-relaxed border wrap-break-word w-full ${isMe ? "bg-[#003366] text-white rounded-tr-none border-[#003366] shadow-sm ml-auto text-right" : "bg-white text-slate-900 rounded-tl-none border-slate-100 shadow-sm mr-auto text-left"}`}>
                            {parsed.type === 'file' ? (
                               <div className="space-y-3">
                                  {parsed.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                     <div className="w-full h-auto min-h-[100px] bg-slate-100/10 rounded-xl overflow-hidden shadow-inner">
                                        <img 
                                          src={parsed.fileUrl} 
                                          className="w-full h-auto object-contain max-h-[300px] block" 
                                          alt="Shared Asset" 
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x200?text=Asset+Permission+Required";
                                          }}
                                        />
                                     </div>
                                  ) : (
                                     <a href={parsed.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-black/10 rounded-xl hover:bg-black/20 transition-all">
                                        <i className="fa-solid fa-file-circle-check text-xl"></i>
                                        <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">{parsed.fileName || "Download Attachment"}</span>
                                     </a>
                                  )}
                               </div>
                            ) : parsed.text}
                          </div>
                          <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-300 italic px-2`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>

            <div className="relative bg-white border-t border-slate-100 p-4 md:p-8 shrink-0">
               {showEmojiPicker && (
                  <div className="absolute bottom-full mb-4 left-4 p-4 bg-white rounded-[24px] shadow-2xl border border-slate-100 grid grid-cols-5 gap-2 w-[220px] z-50 animate-slideUp">
                     {POPULAR_EMOJIS.map(emoji => <button key={emoji} onClick={() => addEmoji(emoji)} className="w-8 h-8 md:w-10 md:h-10 text-lg hover:scale-125 transition-transform flex items-center justify-center">{emoji}</button>)}
                  </div>
               )}
               <div className="flex items-center gap-4 md:gap-8 grow px-2 md:px-0">
                  <div className="flex gap-4 md:gap-5 text-slate-300 text-xl md:text-2xl shrink-0 rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-3 shadow-sm">
                    <i className={`fa-regular fa-face-smile cursor-pointer ${showEmojiPicker ? "text-teal-600" : "hover:text-[#003366]"}`} onClick={() => setShowEmojiPicker(!showEmojiPicker)}></i>
                    <i className={`fa-solid fa-paperclip cursor-pointer ${uploadingFile ? "animate-spin text-teal-600" : "hover:text-[#003366]"}`} onClick={() => fileInputRef.current?.click()}></i>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </div>
                  <form onSubmit={(e) => sendMessage(e)} className="grow flex items-center gap-3 md:gap-4">
                     <input type="text" className="grow bg-slate-50 border border-slate-100 rounded-[28px] md:rounded-[32px] px-5 py-4 md:px-8 md:py-5 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-teal-100 transition-all placeholder:text-slate-300 shadow-sm" placeholder="Message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                     <button type="submit" className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-[20px] md:rounded-[24px] shadow-2xl transition-all ${newMessage.trim() ? "bg-[#003366] text-white" : "bg-slate-50 text-slate-200"}`}>
                       <i className="fa-solid fa-paper-plane text-base md:text-xl"></i>
                     </button>
                  </form>
               </div>
            </div>
          </>
        ) : (
          <div className="grow flex flex-col items-center justify-center p-12 text-center bg-slate-50/20">
             <i className="fa-solid fa-comment-dots text-7xl md:text-8xl text-slate-100 mb-8"></i>
             <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter">Hub Terminal.</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
