import { useState } from 'react';
import { Send, MessageSquare, User, Clock } from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { ConversationListSkeleton, MessageThreadSkeleton } from '../components/ui/skeletons';
import { ButtonSpinner } from '../components/ui/loading-spinner';

const MessagesPage = () => {
  const [messageContent, setMessageContent] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

  const { data: messages, isLoading } = trpc.clientPortal.getMessages.useQuery({
    limit: 50,
    offset: 0,
  });

  const utils = trpc.useUtils();

  const sendMessageMutation = trpc.clientPortal.sendMessage.useMutation({
    onSuccess: () => {
      toast.success('Message sent successfully!');
      setMessageContent('');
      utils.clientPortal.getMessages.invalidate();
      utils.clientPortal.getDashboardStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  const markReadMutation = trpc.clientPortal.markMessageRead.useMutation({
    onSuccess: () => {
      utils.clientPortal.getMessages.invalidate();
      utils.clientPortal.getDashboardStats.invalidate();
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    sendMessageMutation.mutate({
      content: messageContent.trim(),
      recipientId: 1, // Admin user ID - in real app, this would be dynamic
    });
  };

  const handleMessageClick = (messageId: number, isRead: boolean) => {
    setSelectedConversation(messageId);
    if (!isRead) {
      markReadMutation.mutate({ messageId });
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row">
          {/* Messages List */}
          <div className="lg:w-1/3 border-r border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-800">
              <h1 className="text-2xl font-bold text-white mb-2">Messages</h1>
              <p className="text-gray-400 text-sm">Communicate with the team</p>
            </div>

            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-4">
                  <ConversationListSkeleton />
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="p-4 space-y-2">
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => handleMessageClick(message.id, message.isRead)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg transition-all",
                        selectedConversation === message.id
                          ? "bg-blue-600/20 border border-blue-500/50"
                          : "bg-slate-900 hover:bg-slate-800 border border-slate-800",
                        !message.isRead && "border-blue-500/30"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-400" />
                          </div>
                          <span className={cn(
                            "font-medium",
                            !message.isRead ? "text-white" : "text-gray-400"
                          )}>
                            {message.senderName || 'Hopstec Team'}
                          </span>
                        </div>
                        {!message.isRead && (
                          <Badge className="bg-blue-500 text-white border-0 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                            •
                          </Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm line-clamp-2 mb-2",
                        !message.isRead ? "text-gray-300" : "text-gray-500"
                      )}>
                        {message.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(message.createdAt)}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <MessageSquare className="h-16 w-16 text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
                  <p className="text-gray-400 text-center text-sm">
                    Start a conversation with the team
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Message Thread / Compose */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Hopstec Team</h2>
                      <p className="text-sm text-gray-400">Online</p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    {messages
                      ?.filter((m) => m.id === selectedConversation)
                      .map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white text-sm">
                                {message.senderName || 'Hopstec Team'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-slate-900 rounded-lg p-3">
                              <p className="text-gray-300 text-sm">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>

                <div className="p-6 border-t border-slate-800">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <Input
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Type your reply..."
                      className="bg-slate-900 border-slate-800 text-white flex-1"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={sendMessageMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <Card className="bg-slate-900 border-slate-800 max-w-md w-full">
                  <CardHeader>
                    <CardTitle className="text-white">Send a Message</CardTitle>
                    <CardDescription className="text-gray-400">
                      Start a conversation with the Hopstec team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSendMessage} className="space-y-4">
                      <Textarea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Type your message here..."
                        className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <>
                            <ButtonSpinner className="mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default MessagesPage;

