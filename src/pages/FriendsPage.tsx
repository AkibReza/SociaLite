import React, { useState, useEffect } from 'react';
import { UserCheck, MessageCircle, UserPlus, Search } from 'lucide-react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Friend {
  _id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeen: string;
}

interface FriendRequest {
  _id: string;
  from: {
    _id: string;
    name: string;
    email: string;
  };
  to: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

const FriendsPage: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFriendsData();
  }, []);

  const fetchFriendsData = async () => {
    try {
      const [friendsResponse, requestsResponse] = await Promise.all([
        api.get('/api/friends'),
        api.get('/api/friends/requests'),
      ]);
      
      setFriends(friendsResponse.data);
      setFriendRequests(requestsResponse.data);
    } catch (error) {
      console.error('Error fetching friends data:', error);
      toast.error('Failed to load friends data');
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      await api.post(`/api/friends/requests/${requestId}/${action}`);
      toast.success(`Friend request ${action}ed`);
      fetchFriendsData();
    } catch (error) {
      toast.error(`Failed to ${action} friend request`);
    }
  };

  const startChat = (friendId: string) => {
    // This would typically open a chat modal or navigate to a chat page
    toast.success('Chat feature coming soon!');
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = friendRequests.filter(req => req.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
            Your Network
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Manage your friendships and connections
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-8">
          <button
            className={`flex-1 py-3 px-6 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'friends'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-primary-500'
            }`}
            onClick={() => setActiveTab('friends')}
          >
            <UserCheck size={18} />
            <span>Friends ({friends.length})</span>
          </button>
          <button
            className={`flex-1 py-3 px-6 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'requests'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-primary-500'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            <UserPlus size={18} />
            <span>Requests ({pendingRequests.length})</span>
          </button>
        </div>

        {activeTab === 'friends' && (
          <div>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Search friends..."
              />
            </div>

            {/* Friends List */}
            <div className="space-y-4">
              {filteredFriends.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {searchTerm ? 'No friends found' : 'No friends yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm 
                      ? 'Try adjusting your search terms'
                      : 'Connect with people from your groups to build your network'
                    }
                  </p>
                </motion.div>
              ) : (
                filteredFriends.map((friend, index) => (
                  <motion.div
                    key={friend._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {friend.name.charAt(0).toUpperCase()}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                              friend.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {friend.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {friend.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {friend.isOnline ? 'Online now' : `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => startChat(friend._id)}
                        className="bg-gradient-to-r from-primary-500 to-accent-500 text-white p-3 rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 flex items-center space-x-2"
                      >
                        <MessageCircle size={18} />
                        <span className="hidden sm:inline">Chat</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No pending requests
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Friend requests will appear here when you receive them
                </p>
              </motion.div>
            ) : (
              pendingRequests.map((request, index) => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {request.from.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.from.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {request.from.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => respondToRequest(request._id, 'accept')}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToRequest(request._id, 'reject')}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;