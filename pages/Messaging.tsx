import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { UserProfile, Message, Product } from "../types";
import { databases, storage } from "../lib/appwrite";
import { Query, ID } from "appwrite";
import { sendEmailPlaceholder } from "../services/notification";

/**
 * WhatsApp-style Voice Note Player
 */
const AudioPlayer: React.FC<{ duration: number; isMe: boolean }> = ({
  duration,
  isMe,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);

  const togglePlay = () => {
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      timerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsPlaying(false);
            return 100;
          }
          return prev + 100 / (duration || 5) / 10;
        });
      }, 100);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setProgress(pct);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex items-center space-x-3 min-w-[200px] py-1">
      <div className="relative">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <i
            className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"} text-lg`}
          ></i>
        </button>
      </div>

      <div className="flex-grow flex flex-col space-y-1">
        <div
          className="h-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-full relative cursor-pointer overflow-hidden"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-[#00a884] rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          ></div>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#00a884] rounded-full shadow-sm"
            style={{ left: `calc(${progress}% - 6px)` }}
          ></div>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500">
          <span>
            {isPlaying
              ? "0:0" + Math.floor(progress / 10)
              : "0:" + duration.toString().padStart(2, "0")}
          </span>
          <i className="fa-solid fa-microphone text-[8px]"></i>
        </div>
      </div>

      <div className="relative flex-shrink-0">
        <img
          src="https://ui-avatars.com/api/?name=V&background=00a884&color=fff"
          className="w-8 h-8 rounded-full opacity-40"
          alt=""
        />
        <i className="fa-solid fa-microphone absolute -bottom-1 -right-1 text-[8px] text-slate-400 bg-white dark:bg-slate-800 rounded-full p-0.5"></i>
      </div>
    </div>
  );
};

const Messaging: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chattingWith, setChattingWith] = useState<UserProfile | null>(null);
  const [contextProduct, setContextProduct] = useState<Product | null>(null);
  const [conversations, setConversations] = useState<
    { user: UserProfile; lastMsg: string; time: string; unread: number }[]
  >([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(
    null,
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingInterval = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  // Load chats and partners
  useEffect(() => {
    const loadData = async () => {
      const params = new URLSearchParams(location.search);
      const sellerId = params.get("seller");
      const productId = params.get("product");

      if (!user) return;

      try {
        // Load all messages for the user
        const [sentMessages, receivedMessages] = await Promise.all([
          databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            "messages",
            [Query.equal("senderId", user.userId)],
          ),
          databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            "messages",
            [Query.equal("receiverId", user.userId)],
          ),
        ]);

        const allMessages = [
          ...sentMessages.documents,
          ...receivedMessages.documents,
        ].map((m: any) => ({
          ...m,
          reactions:
            typeof m.reactions === "string"
              ? JSON.parse(m.reactions || "{}")
              : m.reactions || {},
        })) as unknown as Message[];

        // Mark as read when focusing a chat
        const messagesToUpdate = allMessages.filter((m: Message) => {
          return (
            m.senderId !== user.userId &&
            chattingWith &&
            m.senderId === chattingWith.userId &&
            !m.isRead
          );
        });

        // Update read status in database
        for (const msg of messagesToUpdate) {
          await databases.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            "messages",
            msg.$id,
            { isRead: true },
          );
        }

        // Filter out messages from blocked users
        const filteredMessages = allMessages.filter((m: Message) => {
          if (user.blockedUserIds?.includes(m.senderId)) return false;
          return true;
        });

        setMessages(filteredMessages);

        // Get unique chat partners
        const chatPartners = new Set<string>();
        filteredMessages.forEach((m: Message) => {
          const partnerId =
            m.senderId === user.userId ? m.receiverId : m.senderId;
          if (
            partnerId &&
            partnerId !== user.userId &&
            !user.blockedUserIds?.includes(partnerId)
          ) {
            chatPartners.add(partnerId);
          }
        });

        if (
          sellerId &&
          sellerId !== user.userId &&
          !user.blockedUserIds?.includes(sellerId)
        )
          chatPartners.add(sellerId);

        // Load profiles for chat partners
        const convos: any[] = [];
        for (const partnerId of chatPartners) {
          try {
            const profile = await databases.getDocument(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              "profiles",
              partnerId,
            );
            const thread = filteredMessages.filter(
              (m: Message) =>
                (m.senderId === partnerId && m.receiverId === user.userId) ||
                (m.senderId === user.userId && m.receiverId === partnerId),
            );
            const last = thread.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )[0];
            convos.push({
              user: profile,
              lastMsg:
                last?.type === "audio"
                  ? "🎤 Voice message"
                  : last?.text || "New chat",
              time: last
                ? new Date(last.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "",
              unread: filteredMessages.filter(
                (m: Message) => m.senderId === partnerId && !m.isRead,
              ).length,
            });
          } catch (error) {
            console.warn(`Error loading profile for ${partnerId}:`, error);
            // Add placeholder for missing user
            convos.push({
              user: {
                userId: partnerId,
                name: "Unknown User",
                email: "",
                avatarUrl: `https://ui-avatars.com/api/?name=Unknown&background=random`,
              } as UserProfile,
              lastMsg: "Chat Error",
              time: "",
              unread: 0,
            });
          }
        }
        setConversations(convos.sort((a, b) => b.unread - a.unread));

        // Load chatting with user
        if (sellerId) {
          try {
            const found = await databases.getDocument(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              "profiles",
              sellerId,
            );
            setChattingWith(found as unknown as UserProfile);
          } catch (error) {
            console.error("Error loading chatting user:", error);
            // Fallback for current chat user
            setChattingWith({
              userId: sellerId,
              name: "Unknown User",
              email: "",
              avatarUrl: `https://ui-avatars.com/api/?name=Unknown&background=random`,
            } as UserProfile);
          }
        }

        // Load context product
        if (productId) {
          try {
            const foundProduct = await databases.getDocument(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              "products",
              productId,
            );
            setContextProduct(foundProduct as unknown as Product);
          } catch (error) {
            console.error("Error loading product:", error);
          }
        }
      } catch (error) {
        console.error("Error loading messaging data:", error);
      }
    };

    loadData();
  }, [location, user, chattingWith]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chattingWith, isTyping]);

  const toggleBlockUser = async () => {
    if (!user || !chattingWith) return;
    if (
      window.confirm(
        `Are you sure you want to block ${chattingWith.name}? You will no longer see their messages.`,
      )
    ) {
      try {
        const blocked = user.blockedUserIds || [];
        await databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "profiles",
          user.userId,
          {
            blockedUserIds: [...new Set([...blocked, chattingWith.userId])],
          },
        );
        refreshUser();
        setChattingWith(null);
        navigate("/messages");
      } catch (error) {
        console.error("Error blocking user:", error);
      }
    }
  };

  const toggleTranscription = () => {
    if (isTranscribing) {
      recognitionRef.current?.stop();
      setIsTranscribing(false);
    } else {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert(
          "Speech recognition not supported in this browser. Please use Chrome or Safari.",
        );
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-NG";

      recognition.onstart = () => {
        setIsTranscribing(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setNewMessage((prev) =>
            prev.trim() ? `${prev.trim()} ${transcript}` : transcript,
          );
        }
        setIsTranscribing(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error);
        setIsTranscribing(false);
      };

      recognition.onend = () => {
        setIsTranscribing(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user || !chattingWith) return;

    try {
      const msg = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "messages",
        ID.unique(),
        {
          conversationId: [user.userId, chattingWith.userId].sort().join("_"),
          senderId: user.userId,
          receiverId: chattingWith.userId,
          type: "text",
          text: newMessage,
          isRead: false,
          reactions: JSON.stringify({}),
        },
      );

      setMessages((prev) => [...prev, msg as unknown as Message]);

      sendEmailPlaceholder(
        chattingWith.email,
        `New Message from ${user.name}`,
        `Hello ${chattingWith.name.split(" ")[0]},\n\nYou have received a new message on the UI DLC Marketplace from ${user.name}.\n\nMessage preview: "${newMessage.substring(0, 50)}${newMessage.length > 50 ? "..." : ""}"\n\nLogin to the marketplace to reply.`,
      );

      setNewMessage("");

      // Simulated reply removed for production
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      const message = messages.find((m) => m.$id === messageId);
      if (!message) return;

      const reactions = { ...(message.reactions || {}) };
      const users = reactions[emoji] ? [...reactions[emoji]] : [];
      if (users.includes(user.userId)) {
        reactions[emoji] = users.filter((uid) => uid !== user.userId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...users, user.userId];
      }

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "messages",
        messageId,
        { reactions: JSON.stringify(reactions) },
      );

      setMessages((prev) =>
        prev.map((m) => (m.$id === messageId ? { ...m, reactions } : m)),
      );
      setShowEmojiPickerFor(null);
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = window.setInterval(
      () => setRecordingTime((prev) => prev + 1),
      1000,
    );
  };

  const stopRecording = async (send: boolean) => {
    setIsRecording(false);
    if (recordingInterval.current) clearInterval(recordingInterval.current);
    if (send && user && chattingWith) {
      const conversationId = [user.userId, chattingWith.userId].sort().join("_");
      try {
        const msg = await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "messages",
          ID.unique(),
          {
            conversationId,
            senderId: user.userId,
            receiverId: chattingWith.userId,
            type: "audio",
            duration: recordingTime,
            audioUrl: "#",
            isRead: false,
            reactions: JSON.stringify({}),
          },
        );
        setMessages((prev) => [...prev, msg as unknown as Message]);

        sendEmailPlaceholder(
          chattingWith.email,
          `New Voice Message from ${user.name}`,
          `Hello ${chattingWith.name.split(" ")[0]},\n\nYou have received a new voice note on the UI DLC Marketplace from ${user.name}.\n\nDuration: 0:${recordingTime.toString().padStart(2, "0")}\n\nLogin to the marketplace to listen.`,
        );
      } catch (error) {
        console.error("Error sending voice message:", error);
      }
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    const today = new Date().toLocaleDateString([], {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toLocaleDateString([], {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    msgs.forEach((m) => {
      const date = new Date(m.createdAt).toLocaleDateString([], {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      let label = date;
      if (date === today) label = "TODAY";
      else if (date === yesterday) label = "YESTERDAY";

      if (!groups[label]) groups[label] = [];
      groups[label].push(m);
    });
    return groups;
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex bg-[#f0f2f5] dark:bg-slate-950 overflow-hidden shadow-xl relative border border-slate-200 dark:border-slate-800">
      <div className="w-[30%] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 h-full hidden md:flex">
        <div className="h-16 px-4 bg-[#f0f2f5] dark:bg-slate-900 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "")}&background=1e40af&color=fff`}
            className="w-10 h-10 rounded-full"
            alt=""
          />
          <div className="flex items-center space-x-6 text-[#54656f] dark:text-slate-400">
            <button title="Communities">
              <i className="fa-solid fa-users text-lg"></i>
            </button>
            <button title="Status">
              <i className="fa-solid fa-circle-notch text-lg"></i>
            </button>
            <button title="New Chat">
              <i className="fa-solid fa-message text-lg"></i>
            </button>
            <button title="Menu">
              <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
            </button>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-sm"></i>
            <input
              type="text"
              placeholder="Search or start new chat"
              className="w-full bg-[#f0f2f5] dark:bg-slate-800 rounded-lg py-1.5 pl-10 pr-4 text-sm focus:outline-none dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800/50">
          {conversations
            .filter((c) =>
              c.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .map((convo, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setChattingWith(convo.user);
                  navigate(`/messages?seller=${convo.user.userId}`);
                }}
                className={`w-full h-18 px-4 py-3 flex items-center space-x-4 transition-colors hover:bg-[#f5f6f6] dark:hover:bg-slate-800 ${chattingWith?.userId === convo.user.userId ? "bg-[#f0f2f5] dark:bg-slate-800" : ""}`}
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(convo.user.name)}&background=random`}
                  className="w-12 h-12 rounded-full"
                  alt=""
                />
                <div className="flex-grow text-left overflow-hidden border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-semibold text-slate-800 dark:text-white text-base">
                      {convo.user.name}
                    </span>
                    <span
                      className={`text-[11px] tabular-nums ${convo.unread > 0 ? "text-[#00a884] font-bold" : "text-slate-400"}`}
                    >
                      {convo.time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm truncate text-slate-500 dark:text-slate-400 max-w-[85%]">
                      {convo.lastMsg}
                    </p>
                    {convo.unread > 0 &&
                      chattingWith?.userId !== convo.user.userId && (
                        <span className="bg-[#00a884] text-white text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                          {convo.unread}
                        </span>
                      )}
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      <div className="flex-grow flex flex-col h-full bg-[#efeae2] dark:bg-slate-950 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "url(https://i.pinimg.com/originals/ab/ab/60/abab600fbc38c205acc25104732aa4ca.jpg)",
            backgroundSize: "400px",
          }}
        ></div>

        {chattingWith ? (
          <div className="flex flex-col h-full z-10">
            <div className="h-16 px-4 bg-[#f0f2f5] dark:bg-slate-900 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center space-x-3 cursor-pointer">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(chattingWith.name)}&background=random`}
                  className="w-10 h-10 rounded-full"
                  alt=""
                />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white leading-none">
                    {chattingWith.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {isTyping ? (
                      <span className="text-[#00a884] font-bold">
                        typing...
                      </span>
                    ) : (
                      "online"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-[#54656f] dark:text-slate-400">
                <button
                  onClick={toggleBlockUser}
                  className="text-rose-500 hover:text-rose-700"
                  title="Block User"
                >
                  <i className="fa-solid fa-ban text-lg"></i>
                </button>
                <button
                  title="Video Call"
                  onClick={() =>
                    alert("Video calls are coming in the next update!")
                  }
                >
                  <i className="fa-solid fa-video text-lg"></i>
                </button>
                <button
                  title="Voice Call"
                  onClick={() =>
                    alert("Voice calls are coming in the next update!")
                  }
                >
                  <i className="fa-solid fa-phone text-lg"></i>
                </button>
                <div className="w-[1px] h-6 bg-slate-300 dark:bg-slate-800 mx-2"></div>
                <button title="Search Chat">
                  <i className="fa-solid fa-magnifying-glass text-lg"></i>
                </button>
                <button title="More Options">
                  <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
                </button>
              </div>
            </div>

            {contextProduct && (
              <div className="mx-12 my-3 bg-white dark:bg-slate-900 p-2 rounded-lg border-l-4 border-l-[#00a884] shadow-sm flex items-center space-x-3 transition-all">
                <img
                  src={contextProduct.imageUrls[0]}
                  className="w-10 h-10 rounded object-cover"
                  alt=""
                />
                <div className="flex-grow text-left">
                  <p className="text-[10px] text-[#00a884] font-bold uppercase tracking-widest leading-none mb-1">
                    Inquiry
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {contextProduct.name}
                  </p>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white pr-2">
                  ₦{contextProduct.price.toLocaleString()}
                </p>
              </div>
            )}

            <div
              ref={scrollRef}
              className="flex-grow p-4 md:px-12 overflow-y-auto space-y-4 scroll-smooth"
            >
              {Object.entries(groupMessagesByDate(messages)).map(
                ([date, msgs]) => (
                  <div key={date} className="space-y-4">
                    <div className="flex justify-center my-6">
                      <span className="px-3 py-1.5 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 rounded-lg shadow-sm uppercase tracking-wider">
                        {date}
                      </span>
                    </div>
                    {msgs.map((msg) => {
                      const isMe = msg.senderId === user?.userId;
                      return (
                        <div
                          key={msg.$id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fadeIn group`}
                        >
                          <div
                            className={`relative max-w-[85%] md:max-w-[65%] px-3 py-2 rounded-lg shadow-sm ${isMe ? "bg-[#dcf8c6] dark:bg-emerald-900/40 rounded-tr-none" : "bg-white dark:bg-slate-800 rounded-tl-none"}`}
                          >
                            <div
                              className={`absolute top-0 w-2 h-3 ${isMe ? "-right-2 bg-[#dcf8c6] dark:bg-emerald-900/40" : "-left-2 bg-white dark:bg-slate-800"}`}
                              style={{
                                clipPath: isMe
                                  ? "polygon(0 0, 0 100%, 100% 0)"
                                  : "polygon(100% 0, 100% 100%, 0 0)",
                              }}
                            ></div>

                            {msg.type === "text" ? (
                              <p className="text-[14.5px] text-[#111b21] dark:text-slate-100 break-words pr-8">
                                {msg.text}
                              </p>
                            ) : (
                              <AudioPlayer
                                duration={msg.duration || 5}
                                isMe={isMe}
                              />
                            )}

                            <button
                              onClick={() =>
                                setShowEmojiPickerFor(
                                  showEmojiPickerFor === msg.$id
                                    ? null
                                    : msg.$id,
                                )
                              }
                              className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-10" : "-right-10"} opacity-0 group-hover:opacity-100 transition-all text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 p-2`}
                            >
                              <i className="fa-regular fa-face-smile"></i>
                            </button>

                            {showEmojiPickerFor === msg.$id && (
                              <div
                                className={`absolute -top-12 ${isMe ? "right-0" : "left-0"} bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 rounded-full shadow-2xl flex gap-1 z-50 animate-bounceIn`}
                              >
                                {QUICK_EMOJIS.map((e) => (
                                  <button
                                    key={e}
                                    onClick={() => handleReaction(msg.$id, e)}
                                    className="w-8 h-8 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-transform active:scale-150 transform"
                                  >
                                    {e}
                                  </button>
                                ))}
                              </div>
                            )}

                            {msg.reactions &&
                              Object.entries(msg.reactions).length > 0 && (
                                <div
                                  className={`absolute -bottom-3 ${isMe ? "left-2" : "right-2"} flex gap-0.5 z-20`}
                                >
                                  {Object.entries(msg.reactions).map(
                                    ([emoji, uids]) => (
                                      <button
                                        key={emoji}
                                        onClick={() =>
                                          handleReaction(msg.$id, emoji)
                                        }
                                        className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 px-1.5 py-0.5 rounded-full text-[10px] shadow-sm flex items-center gap-1 transition-transform hover:scale-110"
                                      >
                                        {emoji}{" "}
                                        <span className="text-[9px] text-slate-500 dark:text-slate-400">
                                          {uids.length}
                                        </span>
                                      </button>
                                    ),
                                  )}
                                </div>
                              )}

                            <div
                              className={`flex items-center justify-end mt-1 space-x-1 ${msg.type === "audio" ? "mt-2" : ""}`}
                            >
                              {msg.type === "audio" && (
                                <i className="fa-solid fa-microphone text-[9px] text-slate-400 mr-0.5"></i>
                              )}
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                                {new Date(msg.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                              {isMe && (
                                <span
                                  className={
                                    msg.isRead
                                      ? "text-[#53bdeb]"
                                      : "text-slate-400 dark:text-slate-600"
                                  }
                                >
                                  <i
                                    className={`fa-solid ${msg.isRead ? "fa-check-double" : "fa-check-double"} text-[11px]`}
                                  ></i>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ),
              )}
            </div>

            <div className="px-4 py-2 bg-[#f0f2f5] dark:bg-slate-900 flex items-center space-x-3 flex-shrink-0">
              {isRecording ? (
                <div className="w-full flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-4">
                    <i className="fa-solid fa-microphone text-rose-500 animate-pulse"></i>
                    <span className="text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-400">
                      0:{recordingTime.toString().padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => stopRecording(false)}
                      className="text-slate-400 font-bold text-xs uppercase hover:text-rose-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => stopRecording(true)}
                      className="w-10 h-10 bg-[#00a884] text-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <i className="fa-solid fa-paper-plane text-xs"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex space-x-4 text-[#54656f] dark:text-slate-400">
                    <button>
                      <i className="fa-regular fa-face-smile text-2xl"></i>
                    </button>
                    <button>
                      <i className="fa-solid fa-plus text-xl"></i>
                    </button>
                  </div>

                  <form
                    onSubmit={handleSendMessage}
                    className="flex-grow flex items-center space-x-3"
                  >
                    <div className="flex-grow relative">
                      <input
                        type="text"
                        placeholder="Type a message"
                        className="w-full bg-white dark:bg-slate-800 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none placeholder:text-slate-400 dark:text-white"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={toggleTranscription}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 transition-colors ${isTranscribing ? "text-rose-500" : "text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"}`}
                        title="Voice-to-Text"
                      >
                        <i
                          className={`fa-solid ${isTranscribing ? "fa-circle-dot animate-pulse" : "fa-microphone-lines"}`}
                        ></i>
                      </button>
                    </div>

                    <div className="flex-shrink-0">
                      {newMessage.trim() ? (
                        <button
                          type="submit"
                          className="w-12 h-12 bg-[#00a884] text-white rounded-full flex items-center justify-center shadow-sm transition active:scale-95"
                        >
                          <i className="fa-solid fa-paper-plane text-lg"></i>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onMouseDown={startRecording}
                          onTouchStart={startRecording}
                          className="w-12 h-12 text-[#54656f] dark:text-slate-400 rounded-full flex items-center justify-center transition active:scale-95"
                        >
                          <i className="fa-solid fa-microphone text-2xl"></i>
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-20 text-center bg-[#f0f2f5] dark:bg-slate-950 h-full z-10">
            <div className="w-64 h-64 opacity-40 mb-10">
              <img
                src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae5F2j.png"
                className="w-full grayscale"
                alt="WhatsApp Desktop"
              />
            </div>
            <h3 className="text-3xl font-light text-slate-800 dark:text-white mb-4">
              UI DLC Marketplace Web
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md font-medium leading-relaxed">
              Send and receive messages with students and sellers on the DLC
              campus. Safe deals start with a conversation.
            </p>
            <div className="mt-20 flex items-center text-slate-400 dark:text-slate-600 text-xs">
              <i className="fa-solid fa-lock mr-2"></i>
              End-to-end encrypted
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
