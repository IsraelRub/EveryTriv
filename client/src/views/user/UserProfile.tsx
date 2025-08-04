import { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { setUsername, setAvatar, setUser } from '../../redux/features/userSlice';
import { RootState } from '../../redux/store';
import { getOrCreateUserId } from '../../shared/services/user.util';

export default function UserProfile() {
  const [userId] = useState(() => getOrCreateUserId());
  const username = useAppSelector((state: RootState) => state.user.username);
  const avatar = useAppSelector((state: RootState) => state.user.avatar);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch user profile if exists
    axios.get(`/user/profile?userId=${userId}`).then(res => {
      dispatch(setUser({
        username: res.data.username || '',
        avatar: res.data.avatar || '',
      }));
    }).catch(() => {});
  }, [userId, dispatch]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await axios.post('/user/profile', { userId, username, avatar });
      setSuccess(true);
    } catch (err: unknown) {
      setError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/10 rounded-xl shadow-xl p-8 mt-10">
      <h2 className="text-2xl font-bold text-white mb-4">User Profile</h2>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <label className="text-white">Username
          <input
            className="rounded-lg px-4 py-2 text-lg border border-blue-400 w-full mt-1"
            value={username}
            onChange={e => dispatch(setUsername(e.target.value))}
            required
          />
        </label>
        <label className="text-white">Avatar URL
          <input
            className="rounded-lg px-4 py-2 text-lg border border-blue-400 w-full mt-1"
            value={avatar}
            onChange={e => dispatch(setAvatar(e.target.value))}
            placeholder="https://..."
          />
        </label>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 shadow-md"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        {success && <div className="text-green-400">Profile saved!</div>}
        {error && <div className="text-red-400">{error}</div>}
      </form>
      {avatar && (
        <div className="mt-4 flex justify-center">
          <img src={avatar} alt="avatar" className="w-24 h-24 rounded-full border-4 border-blue-400 shadow-lg" />
        </div>
      )}
    </div>
  );
} 