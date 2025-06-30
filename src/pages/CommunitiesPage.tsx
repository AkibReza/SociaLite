import React, { useState, useEffect } from 'react';
import { Users, Clock, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Community {
  _id: string;
  name: string;
  description: string;
  icon: string;
  queueCount: number;
  totalMembers: number;
  isJoined: boolean;
}

const CommunitiesPage: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await api.get('/api/communities');
      setCommunities(response.data);
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const joinCommunity = async (communityId: string) => {
    setJoiningCommunity(communityId);
    try {
      await api.post(`/api/communities/${communityId}/join`);
      toast.success('Joined community! You will be matched when 10 people are ready.');
      fetchCommunities();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join community');
    } finally {
      setJoiningCommunity(null);
    }
  };

  const leaveCommunity = async (communityId: string) => {
    setJoiningCommunity(communityId);
    try {
      await api.post(`/api/communities/${communityId}/leave`);
      toast.success('Left community queue');
      fetchCommunities();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to leave community');
    } finally {
      setJoiningCommunity(null);
    }
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
            Discover Communities
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Join communities based on your interests and get matched with 9 other like-minded people for a 30-day group experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {communities.map((community, index) => (
            <motion.div
              key={community._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  {community.icon}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">
                    {community.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {community.totalMembers} total members
                  </p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                {community.description}
              </p>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock size={16} className="mr-2" />
                  <span>{community.queueCount}/10 in queue</span>
                </div>
                <div className="w-full max-w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 ml-4">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(community.queueCount / 10) * 100}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => community.isJoined ? leaveCommunity(community._id) : joinCommunity(community._id)}
                disabled={joiningCommunity === community._id}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                  community.isJoined
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                    : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600 transform hover:scale-105 shadow-lg'
                }`}
              >
                {joiningCommunity === community._id ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span>{community.isJoined ? 'Leave Queue' : 'Join Community'}</span>
                    {!community.isJoined && <ArrowRight size={18} />}
                  </>
                )}
              </button>

              {community.isJoined && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-700"
                >
                  <div className="flex items-center text-primary-600 dark:text-primary-400">
                    <Users size={16} className="mr-2" />
                    <span className="text-sm font-medium">
                      You're in the queue! {10 - community.queueCount} more people needed.
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {communities.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Users className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No Communities Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Check back later for new communities to join!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CommunitiesPage;