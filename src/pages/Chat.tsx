import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  MessageSquare, Send, Plus, Hash, Loader2, Paperclip, Image as ImageIcon,
  FileText, Video, Trash2, Pencil, X, Check, MoreVertical, Download, Shield, Wrench, User as UserIcon, Users,
} from "lucide-react";

interface Conversation {
  id: number;
  type: string;
  name: string | null;
  created_at: string;
  last_message?: string;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  sender_name?: string;
}

interface DirUser {
  id: string;
  full_name: string | null;
  roles: string[];
}

const ROLE_META: Record<string, { label: string; icon: any; color: string }> = {
  super_admin: { label: "Admins", icon: Shield, color: "text-red-400" },
  manager: { label: "Managers", icon: Shield, color: "text-orange-400" },
  security_analyst: { label: "Security", icon: Shield, color: "text-yellow-400" },
  technician: { label: "Technicians", icon: Wrench, color: "text-blue-400" },
  client: { label: "Clients", icon: UserIcon, color: "text-green-400" },
};
const ROLE_ORDER = ["super_admin", "manager", "security_analyst", "technician", "client"];

const BUCKET = "chat-attachments";

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allUsers, setAllUsers] = useState<DirUser[]>([]);
  const [showDirectory, setShowDirectory] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data: parts } = await supabase
      .from("conversation_participants").select("conversation_id").eq("user_id", user.id);
    if (!parts || parts.length === 0) { setConversations([]); setLoading(false); return; }
    const ids = parts.map(p => p.conversation_id);
    const { data: convos } = await supabase.from("conversations").select("*").in("id", ids).order("created_at", { ascending: false });
    if (convos) {
      const enriched = await Promise.all(convos.map(async (c: any) => {
        const { data: participants } = await supabase.from("conversation_participants").select("user_id").eq("conversation_id", c.id);
        const otherIds = (participants || []).filter((p: any) => p.user_id !== user.id).map((p: any) => p.user_id);
        let displayName = c.name;
        if (c.type === "direct" && otherIds.length > 0) {
          const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", otherIds[0]).maybeSingle();
          displayName = prof?.full_name || "Unknown User";
        }
        const { data: lastMsg } = await supabase.from("messages").select("content,file_type,is_deleted")
          .eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1);
        const lm = lastMsg?.[0];
        const preview = lm?.is_deleted ? "🗑️ message removed" : (lm?.content || (lm?.file_type ? `📎 ${lm.file_type}` : ""));
        return { ...c, name: displayName, last_message: preview };
      }));
      setConversations(enriched);
    }
    setLoading(false);
  }, [user]);

  const resolveUrls = useCallback(async (msgs: Message[]) => {
    const paths = msgs.filter(m => m.file_url && !signedUrls[m.file_url]).map(m => m.file_url!);
    if (paths.length === 0) return;
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((d: any, i: number) => { if (d.signedUrl) map[paths[i]] = d.signedUrl; });
      setSignedUrls(prev => ({ ...prev, ...map }));
    }
  }, [signedUrls]);

  const loadMessages = useCallback(async (convoId: number) => {
    const { data } = await supabase.from("messages").select("*")
      .eq("conversation_id", convoId).order("created_at", { ascending: true }).limit(200);
    if (data) {
      const senderIds = [...new Set(data.map((m: any) => m.sender_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", senderIds);
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.full_name]));
      const enriched = data.map((m: any) => ({ ...m, sender_name: profileMap[m.sender_id] || "Unknown" }));
      setMessages(enriched);
      resolveUrls(enriched);
      setTimeout(scrollToBottom, 100);
    }
  }, [resolveUrls]);

  const loadUsers = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("id, full_name");
    if (data) {
      const usersWithRoles = await Promise.all(
        data.filter((p: any) => p.id !== user.id).map(async (p: any) => {
          const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", p.id);
          return { ...p, roles: (r || []).map((x: any) => x.role) };
        })
      );
      setAllUsers(usersWithRoles);
    }
  }, [user]);

  useEffect(() => { loadConversations(); loadUsers(); }, [loadConversations, loadUsers]);
  useEffect(() => { if (activeConvo) loadMessages(activeConvo); }, [activeConvo, loadMessages]);

  useEffect(() => {
    const channel = supabase.channel("chat-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.conversation_id === activeConvo) {
          (async () => {
            const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", msg.sender_id).maybeSingle();
            const withName = { ...msg, sender_name: prof?.full_name || "Unknown" };
            setMessages(prev => prev.some(x => x.id === msg.id) ? prev : [...prev, withName]);
            if (msg.file_url) resolveUrls([withName]);
            setTimeout(scrollToBottom, 100);
          })();
        }
        loadConversations();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.conversation_id === activeConvo) {
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvo, loadConversations, resolveUrls]);

  const sendMessage = async (extra?: { file_url?: string; file_type?: string; content?: string }) => {
    const content = extra?.content ?? newMessage.trim();
    if ((!content && !extra?.file_url) || !activeConvo || !user) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConvo, sender_id: user.id,
      content: content || null, file_url: extra?.file_url || null, file_type: extra?.file_type || null,
    });
    if (error) toast({ title: "Send failed", description: error.message, variant: "destructive" });
    else setNewMessage("");
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeConvo) return;
    if (file.size > 25 * 1024 * 1024) { toast({ title: "File too large", description: "Max 25MB", variant: "destructive" }); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${activeConvo}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); setUploading(false); return; }
    const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "document";
    await sendMessage({ file_url: path, file_type: kind, content: file.name });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startDirectChat = async (targetUserId: string) => {
    if (!user) return;
    const { data: myConvos } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id);
    const { data: theirConvos } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", targetUserId);
    if (myConvos && theirConvos) {
      const myIds = new Set(myConvos.map((c: any) => c.conversation_id));
      const shared = theirConvos.filter((c: any) => myIds.has(c.conversation_id));
      for (const s of shared) {
        const { data: conv } = await supabase.from("conversations").select("type").eq("id", s.conversation_id).maybeSingle();
        if (conv?.type === "direct") { setActiveConvo(s.conversation_id); setShowDirectory(false); loadConversations(); return; }
      }
    }
    const { data: newConvo, error } = await supabase.from("conversations").insert({ type: "direct", created_by: user.id }).select().single();
    if (error || !newConvo) { toast({ title: "Failed", description: error?.message, variant: "destructive" }); return; }
    await supabase.from("conversation_participants").insert([
      { conversation_id: newConvo.id, user_id: user.id, role: "admin" },
      { conversation_id: newConvo.id, user_id: targetUserId, role: "member" },
    ]);
    setActiveConvo(newConvo.id);
    setShowDirectory(false);
    loadConversations();
  };

  const unsendMessage = async (msgId: number) => {
    setMenuOpenId(null);
    const { error } = await supabase.from("messages").update({ is_deleted: true, content: null, file_url: null }).eq("id", msgId);
    if (error) toast({ title: "Failed to unsend", description: error.message, variant: "destructive" });
  };

  const saveEdit = async (msgId: number) => {
    if (!editText.trim()) return;
    const { error } = await supabase.from("messages").update({ content: editText.trim(), is_edited: true }).eq("id", msgId);
    if (error) toast({ title: "Edit failed", description: error.message, variant: "destructive" });
    setEditingId(null); setEditText("");
  };

  const clearMyMessages = async () => {
    if (!activeConvo || !user) return;
    if (!confirm("Clear all your messages in this chat? This cannot be undone.")) return;
    const { error } = await supabase.from("messages")
      .update({ is_deleted: true, content: null, file_url: null })
      .eq("conversation_id", activeConvo).eq("sender_id", user.id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else loadMessages(activeConvo);
  };

  const activeConversation = conversations.find(c => c.id === activeConvo);
  const filteredUsers = allUsers.filter(u => (u.full_name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 rounded-xl border border-border overflow-hidden bg-card">
      {/* Sidebar */}
      <div className="w-72 border-r border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-primary flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> MESSAGES
          </h2>
          <button onClick={() => setShowDirectory(!showDirectory)}
            className={`p-1.5 rounded-lg transition ${showDirectory ? "bg-primary text-primary-foreground" : "hover:bg-muted/50 text-muted-foreground hover:text-primary"}`}
            title="New chat">
            {showDirectory ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {showDirectory ? (
          <div className="flex-1 overflow-y-auto p-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people..."
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-mono mb-3 focus:outline-none focus:border-primary/50" />
            <p className="text-[10px] text-muted-foreground font-mono px-2 mb-2 flex items-center gap-1">
              <Users className="w-3 h-3" /> {allUsers.length} people in system
            </p>
            {ROLE_ORDER.map(role => {
              const meta = ROLE_META[role];
              const users = filteredUsers.filter(u => u.roles.includes(role) &&
                !ROLE_ORDER.slice(0, ROLE_ORDER.indexOf(role)).some(r => u.roles.includes(r)));
              if (users.length === 0) return null;
              const Icon = meta.icon;
              return (
                <div key={role} className="mb-3">
                  <p className={`text-[10px] font-mono px-2 mb-1 uppercase tracking-wider flex items-center gap-1 ${meta.color}`}>
                    <Icon className="w-3 h-3" /> {meta.label} · {users.length}
                  </p>
                  {users.map(u => (
                    <button key={u.id} onClick={() => startDirectChat(u.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted/50 transition text-left">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-[10px] font-bold text-foreground`}>
                        {(u.full_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-foreground">{u.full_name || "Unknown"}</p>
                        <p className={`text-[9px] font-mono ${meta.color}`}>{meta.label.slice(0, -1)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <p className="text-xs text-muted-foreground text-center p-4">No users found.</p>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-20"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No chats yet.<br />Click + to browse people.
              </div>
            ) : conversations.map(c => (
              <button key={c.id} onClick={() => setActiveConvo(c.id)}
                className={`w-full flex items-center gap-2 p-3 border-b border-border/50 text-left transition hover:bg-muted/30
                  ${activeConvo === c.id ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center shrink-0">
                  {c.type === "group" ? <Hash className="w-4 h-4 text-primary" /> :
                    <span className="text-xs font-bold text-foreground">{(c.name || "?")[0].toUpperCase()}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{c.name || "Chat"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.last_message || "No messages yet"}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConvo ? (
          <>
            <div className="p-3 border-b border-border flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">{(activeConversation?.name || "?")[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{activeConversation?.name || "Chat"}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{activeConversation?.type === "group" ? "Group chat" : "Direct message"}</p>
              </div>
              <button onClick={clearMyMessages} title="Clear my messages"
                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-background/50 to-background">
              {messages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                const signed = msg.file_url ? signedUrls[msg.file_url] : null;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                    <div className="relative max-w-[75%]">
                      <div className={`${isMe ? "bg-primary/15 border-primary/30" : "bg-muted/40 border-border"} border rounded-2xl px-3 py-2 shadow-sm`}>
                        {!isMe && <p className="text-[10px] text-primary font-mono mb-1 font-bold">{msg.sender_name}</p>}

                        {msg.is_deleted ? (
                          <p className="text-sm italic text-muted-foreground">🗑️ This message was unsent</p>
                        ) : editingId === msg.id ? (
                          <div className="flex gap-1">
                            <input value={editText} onChange={e => setEditText(e.target.value)} autoFocus
                              onKeyDown={e => e.key === "Enter" && saveEdit(msg.id)}
                              className="flex-1 bg-background border border-primary/50 rounded px-2 py-1 text-sm" />
                            <button onClick={() => saveEdit(msg.id)} className="p-1 rounded bg-primary text-primary-foreground"><Check className="w-3 h-3" /></button>
                            <button onClick={() => { setEditingId(null); setEditText(""); }} className="p-1 rounded bg-muted"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <>
                            {signed && msg.file_type === "image" && (
                              <a href={signed} target="_blank" rel="noreferrer">
                                <img src={signed} alt={msg.content || "image"} className="rounded-lg max-h-64 mb-1 border border-border" />
                              </a>
                            )}
                            {signed && msg.file_type === "video" && (
                              <video src={signed} controls className="rounded-lg max-h-64 mb-1 border border-border" />
                            )}
                            {signed && msg.file_type === "audio" && (
                              <audio src={signed} controls className="mb-1 w-full" />
                            )}
                            {signed && (msg.file_type === "document" || !msg.file_type) && msg.file_url && (
                              <a href={signed} target="_blank" rel="noreferrer" download
                                className="flex items-center gap-2 p-2 mb-1 rounded-lg bg-background/60 border border-border hover:border-primary/50 transition">
                                <FileText className="w-5 h-5 text-primary shrink-0" />
                                <span className="text-xs truncate flex-1">{msg.content || "Document"}</span>
                                <Download className="w-3 h-3 text-muted-foreground" />
                              </a>
                            )}
                            {msg.content && !(msg.file_url && (msg.file_type === "document")) && (
                              <p className="text-sm text-foreground whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                          </>
                        )}

                        <p className="text-[9px] text-muted-foreground mt-1 text-right">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {msg.is_edited && !msg.is_deleted && " · edited"}
                        </p>
                      </div>

                      {isMe && !msg.is_deleted && editingId !== msg.id && (
                        <div className="absolute -top-2 -left-8 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => setMenuOpenId(menuOpenId === msg.id ? null : msg.id)}
                            className="p-1 rounded-full bg-card border border-border hover:border-primary/50 shadow">
                            <MoreVertical className="w-3 h-3 text-muted-foreground" />
                          </button>
                          {menuOpenId === msg.id && (
                            <div className="absolute right-0 top-6 z-10 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                              {msg.content && !msg.file_url && (
                                <button onClick={() => { setEditingId(msg.id); setEditText(msg.content || ""); setMenuOpenId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left">
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>
                              )}
                              <button onClick={() => unsendMessage(msg.id)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-destructive/10 text-destructive text-left">
                                <Trash2 className="w-3 h-3" /> Unsend
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-border bg-card">
              <div className="flex gap-2 items-end">
                <input ref={fileRef} type="file" onChange={handleFileUpload} className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.csv,.xlsx" />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition disabled:opacity-50"
                  title="Attach file">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </button>
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type a message... (Shift+Enter for new line)"
                  rows={1}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none max-h-32 focus:outline-none focus:border-primary/50" />
                <button onClick={() => sendMessage()} disabled={sending || (!newMessage.trim())}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Images</span>
                <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Videos</span>
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Docs</span>
                <span className="ml-auto">Max 25 MB</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground p-6">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-1">Start a conversation</h3>
              <p className="text-sm font-mono mb-4">Message anyone in the system — admins, technicians or clients. Share files, edit and unsend.</p>
              <button onClick={() => setShowDirectory(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-mono">
                <Plus className="w-4 h-4" /> Browse People
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
