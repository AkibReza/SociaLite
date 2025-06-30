import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, Users, Clock, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
  };
  content: string;
  createdAt: string;
}

interface Group {
  _id: string;
  community: string;
  members: Array<{
    _id: string;
    name: string;
    isOnline: boolean;
  }>;
  phase: number;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

const GroupPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { socket } = useSocket();
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGroupData();
  }, []);

  useEffect(() => {
    if (socket && group) {
      socket.join(group._id);
      
      socket.on('new_message', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      socket.on('member_status_update', (data: { userId: string; isOnline: boolean }) => {
        setGroup(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            members: prev.members.map(member =>
              member._id === data.userId ? { ...member, isOnline: data.isOnline } : member
            ),
          };
        });
      });

      return () => {
        socket.leave(group._id);
        socket.off('new_message');
        socket.off('member_status_update');
      };
    }
  }, [socket, group]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupData = async () => {
    try {
      const [groupResponse, messagesResponse] = await Promise.all([
        api.get('/api/groups/current'),
        api.get('/api/groups/current/messages'),
      ]);
      
      setGroup(groupResponse.data);
      setMessages(messagesResponse.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('You are not currently in any group');
      } else {
        toast.error('Failed to load group data');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !group) return;

    setSending(true);
    try {
      await api.post(`/api/groups/${group._id}/messages`, {
        content: newMessage.trim(),
      });
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getPhaseInfo = (phase: number) => {
    const phases = [
      { name: 'Text Chat', description: 'Get to know each other through messages', unlocked: true },
      { name: 'Voice Calls', description: 'Join group audio conversations', unlocked: phase >= 2 },
      { name: 'Video Calls', description: 'See faces and connect deeper', unlocked: phase >= 3 },
      { name: 'Personal Chat', description: 'Private messages with group members', unlocked: phase >= 4 },
    ];
    return phases;
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Users className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            No Active Group
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Join a community to be matched with other members
          </p>
          <a
            href="/communities"
            className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-accent-600 transition-all"
          >
            Browse Communities
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Group Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {group.community} Group
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {group.members.length} members • {getDaysRemaining(group.expiresAt)} days remaining
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
                <Clock size={20} />
                <span className="font-semibold">Phase {group.phase}/4</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  disabled={group.phase < 2}
                  className={`p-2 rounded-lg transition-colors ${
                    group.phase >= 2
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  title={group.phase >= 2 ? 'Start voice call' : 'Voice calls unlock in Phase 2'}
                >
                  <Phone size={18} />
                </button>
                
                <button
                  disabled={group.phase < 3}
                  className={`p-2 rounded-lg transition-colors ${
                    group.phase >= 3
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  title={group.phase >= 3 ? 'Start video call' : 'Video calls unlock in Phase 3'}
                >
                  <Video size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.sender._id === userProfile?._id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender._id === userProfile?._id
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {message.sender._id !== userProfile?._id && (
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        {message.sender.name}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender._id === userProfile?._id
                          ? 'text-white/70'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={sendMessage} className="flex items-center space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={sending || !group.isActive}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim() || !group.isActive}
                className="p-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full hover:from-primary-600 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {sending ? <LoadingSpinner size="sm" /> : <Send size={18} />}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 hidden lg:block">
          {/* Phase Progress */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Group Progress
            </h3>
            <div className="space-y-3">
              {getPhaseInfo(group.phase).map((phase, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    phase.unlocked
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
                      : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      phase.unlocked
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                    }`}
                  >
                    {phase.unlocked ? (
                      <span className="text-sm font-bold">{index + 1}</span>
                    ) : (
                      <Lock size={14} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        phase.unlocked
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {phase.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {phase.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Members ({group.members.length})
            </h3>
            <div className="space-y-2">
              {group.members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                        member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.name}
                      {member._id === userProfile?._id && (
                        <span className="text-xs text-gray-500 ml-1">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {member.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;