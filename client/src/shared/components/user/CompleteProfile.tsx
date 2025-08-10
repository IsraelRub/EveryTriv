import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '@/redux/store';
import { authService } from '@/shared/services';
import { setUser } from '@/redux/features/userSlice';
import { Button } from '../ui';


export default function CompleteProfile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    avatar: user?.avatar || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updatedUser = await authService.completeProfile(formData);
      dispatch(setUser(updatedUser));
      navigate('/');
    } catch (error) {
      setError('Failed to update profile. Please try again.');
      console.error('Profile completion error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-pink-700 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="glass-morphism p-8 rounded-lg">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">Complete Your Profile</h2>
            <p className="text-slate-300 mt-2">
              Add some details to personalize your experience
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-slate-300 mb-2">
                Avatar URL (optional)
              </label>
              <input
                id="avatar"
                type="url"
                value={formData.avatar}
                onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/your-avatar.jpg"
              />
            </div>

            {formData.avatar && (
              <div className="text-center">
                <img
                  src={formData.avatar}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full mx-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Complete Profile'
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                className="flex-1 text-slate-300 hover:text-white"
                disabled={loading}
              >
                Skip for Now
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              You can always update your profile later in the settings
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
