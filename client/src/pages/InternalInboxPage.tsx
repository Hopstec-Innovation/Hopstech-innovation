import { useEffect, useState } from "react";
import { Clock3 as ArchiveClock, Inbox, MessageSquare, Send, UserCheck, Paperclip, FileText, X } from "lucide-react";
import InternalLayout from "@/components/internal/InternalLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function InternalInboxPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const utils = trpc.useUtils();
  const inbox = trpc.chat.listInbox.useQuery(undefined, { refetchInterval: 3000 });
  useEffect(() => { if (!selected && inbox.data?.[0]) setSelected(inbox.data[0].id); }, [selected, inbox.data]);
  const thread = trpc.chat.getStaffThread.useQuery({ conversationId: selected! }, { enabled: !!selected, refetchInterval: 1000 });
  const refresh = () => { void utils.chat.listInbox.invalidate(); if (selected) void utils.chat.getStaffThread.invalidate({ conversationId: selected }); };
  const claim = trpc.chat.claim.useMutation({ onSuccess: () => { toast.success("Conversation assigned to you"); refresh(); } });
  const snooze = trpc.chat.snooze.useMutation({ onSuccess: () => { toast.success("Conversation tucked away for 30 minutes"); refresh(); } });
  const typing = trpc.chat.setStaffTyping.useMutation();
  const send = trpc.chat.sendStaffReply.useMutation({ onSuccess: () => { setReply(""); setFiles([]); if (selected) typing.mutate({ conversationId: selected, typing: false }); refresh(); }, onError: e => toast.error(e.message) });
  useEffect(() => {
    if (!selected) return;
    if (!reply) { typing.mutate({ conversationId: selected, typing: false }); return; }
    typing.mutate({ conversationId: selected, typing: true });
    const timer = window.setTimeout(() => typing.mutate({ conversationId: selected, typing: false }), 2200);
    return () => window.clearTimeout(timer);
  }, [reply, selected]);
  const handleReply = async () => {
    if (!selected || (!reply.trim() && !files.length)) return;
    const attachments = await Promise.all(files.map(file => new Promise<{ fileName: string; contentType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "image/png" | "image/jpeg"; base64: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
      reader.onload = () => resolve({ fileName: file.name, contentType: file.type as "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "image/png" | "image/jpeg", base64: String(reader.result).split(",")[1] || "" });
      reader.readAsDataURL(file);
    })));
    send.mutate({ conversationId: selected, content: reply.trim(), attachments });
  };
  const waiting = inbox.data?.filter(row => row.status === "waiting").length || 0;
  const unread = inbox.data?.reduce((sum, row) => sum + row.unread, 0) || 0;

  return <InternalLayout title="Team inbox">
    <div className="ops-heading"><div><p className="ops-eyebrow">Client communications</p><h1>One queue. Clear ownership.</h1><p>New chats route to an available teammate. Claim, answer, or tuck a conversation away without losing it.</p></div><div className="flex gap-2"><span className="ops-private">{waiting} waiting</span><span className="ops-private">{unread} unread</span></div></div>
    <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-white/10 bg-[#091321] lg:grid-cols-[360px_1fr]">
      <aside className="border-b border-white/10 lg:border-b-0 lg:border-r"><div className="border-b border-white/10 p-4"><h2 className="font-medium text-white">Incoming requests</h2><p className="mt-1 text-xs text-slate-500">Refreshes automatically every 3 seconds</p></div><div className="max-h-[650px] overflow-y-auto p-2">
        {!inbox.isLoading && !inbox.data?.length && <div className="p-10 text-center text-slate-500"><Inbox className="mx-auto mb-3"/><p>No conversations yet.</p></div>}
        {inbox.data?.map(row => <button key={row.id} onClick={() => setSelected(row.id)} className={`mb-2 w-full rounded-xl border p-4 text-left ${selected === row.id ? "border-emerald-300/35 bg-emerald-300/[.08]" : "border-white/5 bg-white/[.025] hover:border-white/15"}`}><div className="flex items-center justify-between gap-2"><strong className="truncate text-sm text-white">{row.clientName}</strong>{row.unread > 0 && <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-xs font-bold text-slate-950">{row.unread}</span>}</div><p className="mt-1 truncate text-xs text-slate-400">{row.latestMessage}</p><div className="mt-3 flex items-center justify-between text-[11px] text-slate-500"><span className="capitalize">{row.status.replace("_", " ")}</span><span>{row.assignee?.name || "Unassigned"}</span></div></button>)}
      </div></aside>
      <section className="flex min-h-[650px] flex-col">{!selected ? <div className="grid flex-1 place-items-center text-slate-500"><div className="text-center"><MessageSquare className="mx-auto mb-3"/><p>Select a conversation</p></div></div> : <><header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4"><div><h2 className="font-medium text-white">{thread.data?.client?.firstName || "Client"}</h2></div><div className="flex gap-2"><button className="ops-button" onClick={() => claim.mutate({ conversationId: selected })}><UserCheck size={14}/>Claim</button><button className="ops-button" onClick={() => snooze.mutate({ conversationId: selected, minutes: 30 })}><ArchiveClock size={14}/>Tuck 30m</button></div></header><div className="flex-1 space-y-4 overflow-y-auto p-5">{thread.data?.messages.map(message => <div key={message.id} className={`flex ${message.fromTeam ? "justify-end" : "justify-start"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-3 ${message.fromTeam ? "rounded-tr-sm bg-emerald-300 text-slate-950" : "rounded-tl-sm border border-white/10 bg-slate-950 text-slate-200"}`}><p className="whitespace-pre-wrap text-sm">{message.content}</p>{message.attachments?.map((file, index) => <a key={file.fileUrl} href={`/api/chat-files/${message.id}/${index}`} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-lg border border-current/20 px-3 py-2 text-xs underline"><FileText size={14}/>{file.fileName}</a>)}<p className="mt-1 text-[11px] opacity-60">{message.fromTeam ? message.senderName || "Hopstec Team" : thread.data?.client?.firstName} · {new Date(message.createdAt).toLocaleString()}</p></div></div>)}{thread.data?.clientTyping && <div className="flex items-center gap-2 text-sm text-slate-400"><span className="flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300"/><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300 [animation-delay:120ms]"/><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300 [animation-delay:240ms]"/></span>{thread.data?.client?.firstName || "Client"} is typing…</div>}</div><form className="border-t border-white/10 p-4" onSubmit={e => { e.preventDefault(); void handleReply(); }}>{files.length > 0 && <div className="mb-2 flex flex-wrap gap-2">{files.map(file => <span key={file.name} className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"><FileText size={13}/>{file.name}<button type="button" onClick={() => setFiles(items => items.filter(item => item !== file))}><X size={13}/></button></span>)}</div>}<div className="flex gap-3"><label className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-xl border border-white/10 text-slate-300"><Paperclip size={18}/><input className="sr-only" type="file" multiple accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg" onChange={event => { const next = Array.from(event.target.files || []); if (next.some(file => file.size > 7 * 1024 * 1024)) return toast.error("Each file must be smaller than 7 MB"); setFiles(next.slice(0, 3)); }}/></label><textarea value={reply} onChange={e => setReply(e.target.value)} placeholder={thread.data?.canReply ? "Reply as Hopstec Team…" : "Claim this conversation to reply"} disabled={!thread.data?.canReply} className="min-h-12 flex-1 resize-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-40"/><button aria-label="Send reply" disabled={(!reply.trim() && !files.length) || send.isPending || !thread.data?.canReply} className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-300 text-slate-950 disabled:opacity-40"><Send size={18}/></button></div></form></>}</section>
    </div>
  </InternalLayout>;
}
