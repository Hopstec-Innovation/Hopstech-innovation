import { useEffect, useRef, useState } from "react";
import { Send, ShieldCheck, Clock3 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function MessagesPage() {
  const [content, setContent] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();
  const thread = trpc.chat.getClientThread.useQuery(undefined, { refetchInterval: 3000 });
  const send = trpc.chat.sendClientMessage.useMutation({
    onSuccess: result => {
      setContent("");
      void utils.chat.getClientThread.invalidate();
      toast.success(result.assigned ? "Sent to an available Hopstec teammate" : "Message queued for the next available teammate");
    },
    onError: error => toast.error(error.message),
  });
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread.data?.messages.length]);

  const status = thread.data?.teamStatus;
  return <DashboardLayout>
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#07101c]">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-300">Secure client channel</p><h1 className="mt-1 text-2xl font-semibold text-white">Hopstec Team</h1></div>
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${status === "online" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-100"}`}>
            {status === "online" ? <><span className="h-2 w-2 rounded-full bg-emerald-400" />Available now</> : <><Clock3 size={14} />Queued for the team</>}
          </div>
        </div>
      </header>
      <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="mb-8 flex gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/[.05] p-4 text-sm text-slate-300"><ShieldCheck className="mt-0.5 shrink-0 text-cyan-300" size={18}/><p>Messages enter the Hopstec operations queue and are assigned to an available teammate. Your contact remains “Hopstec Team”; private staff details are never exposed.</p></div>
          {thread.isLoading && <p className="text-sm text-slate-500">Loading conversation…</p>}
          {!thread.isLoading && !thread.data?.messages.length && <div className="py-20 text-center"><h2 className="text-xl font-medium text-white">Start a conversation</h2><p className="mt-2 text-sm text-slate-400">Ask a question, request a quotation, or discuss an active delivery.</p></div>}
          {thread.data?.messages.map(message => <div key={message.id} className={`flex ${message.fromTeam ? "justify-start" : "justify-end"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-3 ${message.fromTeam ? "rounded-tl-sm border border-white/10 bg-slate-900 text-slate-200" : "rounded-tr-sm bg-emerald-300 text-slate-950"}`}><p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p><p className={`mt-1 text-[11px] ${message.fromTeam ? "text-slate-500" : "text-slate-700"}`}>{message.fromTeam ? "Hopstec Team · " : "You · "}{new Date(message.createdAt).toLocaleString()}</p></div></div>)}
          <div ref={endRef}/>
        </div>
      </section>
      <form className="border-t border-white/10 bg-[#091321] p-4" onSubmit={event => { event.preventDefault(); if (content.trim()) send.mutate({ content: content.trim() }); }}><div className="mx-auto flex max-w-5xl gap-3"><textarea aria-label="Message Hopstec Team" value={content} onChange={e => setContent(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (content.trim()) send.mutate({ content: content.trim() }); } }} placeholder="Type your message…" className="min-h-12 flex-1 resize-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"/><button aria-label="Send message" disabled={!content.trim() || send.isPending} className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-300 text-slate-950 disabled:opacity-40"><Send size={19}/></button></div></form>
    </main>
  </DashboardLayout>;
}
