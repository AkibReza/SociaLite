import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageCircle, Clock, UserCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';

interface Group {
  _id: string;
  community: string;
  members: string[];
  phase: number;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

const HomePage: React.FC = () => {
  const { userProfile } = useAuth();
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeGroups: 0,
    totalConnections: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupResponse, statsResponse] = await Promise.all([
          api.get('/api/groups/current'),
          api.get('/api/stats'),
        ]);
        
        setCurrentGroup(groupResponse.data);
        setStats(statsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPhaseInfo = (phase: number) => {
    const phases = [
      { name: 'Text Chat', description: 'Get to know each other through messages', icon: MessageCircle },
      { name: 'Voice Calls', description: 'Join group audio conversations', icon: Users },
      { name: 'Video Calls', description: 'See faces and connect deeper', icon: Users },
      { name: 'Personal Chat', description: 'Private messages with group members', icon: UserCheck },
    ];
    return phases[phase - 1] || phases[0];
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome back, <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">{userProfile?.name}</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover meaningful connections through shared interests and progressive group experiences
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-gray-600 dark:text-gray-400">Total Users</p>
              </div>
              <Users className="h-10 w-10 text-primary-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeGroups}</p>
                <p className="text-gray-600 dark:text-gray-400">Active Groups</p>
              </div>
              <MessageCircle className="h-10 w-10 text-secondary-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalConnections}</p>
                <p className="text-gray-600 dark:text-gray-400">Connections Made</p>
              </div>
              <Sparkles className="h-10 w-10 text-accent-500" />
            </div>
          </div>
        </motion.div>

        {/* Current Group Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          {currentGroup ? (
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl p-8 border border-primary-200 dark:border-primary-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Current Group</h2>
                <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
                  <Clock size={20} />
                  <span className="font-semibold">{getDaysRemaining(currentGroup.expiresAt)} days left</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {currentGroup.community} Community
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {currentGroup.members.length} members in your group
                  </p>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        {React.createElement(getPhaseInfo(currentGroup.phase).icon, {
                          size: 24,
                          className: 'text-primary-600 dark:text-primary-400'
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Phase {currentGroup.phase}: {getPhaseInfo(currentGroup.phase).name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getPhaseInfo(currentGroup.phase).description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <Link
                    to="/group"
                    className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-primary-600 hover:to-accent-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Join Group Chat
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center shadow-lg">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Active Group
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Join a community to be matched with like-minded people
              </p>
              <Link
                to="/communities"
                className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-accent-600 transform hover:scale-105 transition-all duration-200 inline-block shadow-lg"
              >
                Browse Communities
              </Link>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Link
            to="/communities"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors group shadow-lg hover:shadow-xl"
          >
            <Users className="h-10 w-10 text-primary-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Communities</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Explore interests and join groups</p>
          </Link>

          <Link
            to="/group"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors group shadow-lg hover:shadow-xl"
          >
            <MessageCircle className="h-10 w-10 text-secondary-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Group Chat</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Connect with your group members</p>
          </Link>

          <Link
            to="/friends"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors group shadow-lg hover:shadow-xl"
          >
            <UserCheck className="h-10 w-10 text-accent-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Friends</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your connections</p>
          </Link>

          <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-700 shadow-lg">
            <Sparkles className="h-10 w-10 text-primary-500 mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Discover</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Find new communities to explore</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;