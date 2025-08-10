import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { setUsername, setAvatar } from '../../redux/features/userSlice';
import { RootState } from '../../redux/store';
import { getOrCreateUserId } from '../../shared/utils/user.util';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '../../shared/components/ui';

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
      dispatch(setUsername(res.data.username || ''));
      dispatch(setAvatar(res.data.avatar || ''));
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
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="username" className="text-sm font-medium">Username</label>
              <Input
                id="username"
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) => dispatch(setUsername(e.target.value))}
                required
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="avatar" className="text-sm font-medium">Avatar URL</label>
              <Input
                id="avatar"
                value={avatar}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch(setAvatar(e.target.value))}
                placeholder="https://..."
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
            {success && <div className="text-green-400 text-center">Profile saved!</div>}
            {error && <div className="text-red-400 text-center">{error}</div>}
          </form>
          {avatar && (
            <div className="mt-6 flex justify-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#667eea] shadow-lg">
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 