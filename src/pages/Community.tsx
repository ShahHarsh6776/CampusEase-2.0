import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/supabase/supabaseClient';
import { useUser } from '@/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquare, Image, Paperclip, Smile, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Slider } from '@/components/ui/slider';

interface Message {
  id: number;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  created_at: string;
  college_id: string;
  is_edited?: boolean;
  attachments?: string[];
}

const EMOJIS = ['😀', '😂', '😍', '👍', '🎉', '🙏', '😎', '😢', '🔥', '❤️'];

const Community = () => {
  const { userData } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scrollPosition, setScrollPosition] = useState(100); // For scroll slider (0-100%)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle slider position change
  const handleScrollChange = (value: number[]) => {
    setScrollPosition(value[0]);
    const scrollContainer = document.querySelector('.messages-container');
    if (scrollContainer) {
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;
      const newPosition = ((100 - value[0]) / 100) * (scrollHeight - clientHeight);
      scrollContainer.scrollTop = newPosition;
    }
  };

  // Update slider when scrolling manually
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    const scrollTop = target.scrollTop;
    const newPosition = 100 - (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollPosition(Math.max(0, Math.min(100, newPosition)));
  };

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1]?.sender_id === userData?.id) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    // Fetch initial messages
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          console.log('Realtime event received:', payload);
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          
          // If the new message is from current user, scroll to bottom
          if (newMessage.sender_id === userData?.id) {
            scrollToBottom();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) => 
            prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          setMessages((prev) => 
            prev.filter(msg => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    // Subscribe to typing events
    const typingChannel = supabase
      .channel('typing')
      .on(
        'presence',
        { event: 'sync' },
        () => {
          const state = typingChannel.presenceState();
          const typingUsers = Object.keys(state).filter(
            (userId) => userId !== userData?.id
          );
          setTypingUsers(typingUsers);
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await typingChannel.track({ user: userData?.id });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
    };
  }, [userData]);

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Scroll to bottom after loading initial messages
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userData) return;

    try {
      const messageData = {
        sender_id: userData.id,
        sender_name: `${userData.fname} ${userData.lname}`,
        sender_role: userData.role,
        content: newMessage.trim(),
        college_id: userData.user_id,
      };

      // Clear input before sending to prevent multiple submissions on refresh
      const messageContent = newMessage.trim();
      setNewMessage('');

      const { error } = await supabase.from('community_messages').insert([{
        ...messageData,
        content: messageContent
      }]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }

    // Force refresh after message is sent
    window.location.reload();
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const { error } = await supabase
        .from('community_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', userData?.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  const handleEditMessage = async (messageId: number, newContent: string) => {
    try {
      const { error } = await supabase
        .from('community_messages')
        .update({ content: newContent, is_edited: true })
        .eq('id', messageId)
        .eq('sender_id', userData?.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: 'Error',
        description: 'Failed to edit message',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-campusblue-500" />
            Community Chat
          </h1>

          <Card className="h-[60vh] sm:h-[600px] flex flex-col border-2 border-campusblue-200">
            <CardContent className="flex-1 p-2 sm:p-4 flex">
              {/* Side slider for scrolling */}
              <div className="h-full mr-2 flex items-center">
                <Slider
                  value={[scrollPosition]}
                  onValueChange={handleScrollChange}
                  orientation="vertical"
                  min={0}
                  max={100}
                  step={1}
                  className="h-full"
                />
              </div>
              
              {/* Messages container with ScrollArea */}
              <ScrollArea className="h-full flex-1">
                <div 
                  className="messages-container pr-4 space-y-4"
                  style={{ 
                    minHeight: 0, 
                    maxHeight: '100%', 
                    overflowY: 'auto',
                    paddingRight: '16px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E0 #EDF2F7'
                  }}
                  onScroll={handleScroll}
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-campusblue-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${
                              message.sender_id === userData?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] sm:max-w-[70%] rounded-lg p-3 break-words shadow-md ${
                                message.sender_id === userData?.id
                                  ? 'bg-campusblue-500 text-white'
                                  : message.sender_role === 'faculty' || message.sender_role === 'admin'
                                  ? 'bg-yellow-100'
                                  : 'bg-gray-100'
                              }`}
                              style={{
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Avatar className="h-6 w-6 shrink-0">
                                  <AvatarFallback>
                                    {message.sender_name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-semibold truncate">{message.sender_name}</span>
                                <span className="text-xs opacity-75 truncate">({message.college_id})</span>
                                {message.sender_role === 'faculty' && (
                                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                                    Faculty
                                  </span>
                                )}
                                {message.sender_role === 'admin' && (
                                  <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-line break-words">{message.content}</p>
                              {message.is_edited && (
                                <span className="text-xs opacity-75">(edited)</span>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs opacity-75">
                                  {format(new Date(message.created_at), 'h:mm a')}
                                </p>
                                {message.sender_id === userData?.id && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => handleEditMessage(message.id, prompt('Edit message:', message.content) || message.content)}>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {typingUsers.length > 0 && (
                        <div className="text-sm text-gray-500 italic">
                          {typingUsers.length === 1
                            ? 'Someone is typing...'
                            : `${typingUsers.length} people are typing...`}
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            <form onSubmit={handleSendMessage} className="p-2 sm:p-4 border-t">
              <div className="flex gap-2 items-end">
                <div className="flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                          <Image className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Send Image</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={() => alert('File upload coming soon!')}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowEmojiPicker((v) => !v)}>
                          <Smile className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Emoji</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {showEmojiPicker && (
                    <div className="absolute bottom-16 left-4 bg-white border rounded shadow-lg p-2 flex flex-wrap gap-1 z-50">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="text-2xl hover:bg-gray-100 rounded"
                          onClick={() => {
                            setNewMessage((msg) => msg + emoji);
                            setShowEmojiPicker(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type your message..."
                  className="flex-1 min-w-0"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button type="submit" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Community;