import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authService } from '@/shared/services';
import { setAuthenticated, setUser } from '@/redux/features/userSlice';


export default function OAuthCallback() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=oauth_failed');
        return;
      }

      if (token) {
        try {
          // Store the token
          authService.handleOAuthCallback(token);
          
          // Get user data
          const user = await authService.getCurrentUser();
          dispatch(setUser(user));
          dispatch(setAuthenticated(true));

          // Navigate to home or profile completion
          if (!user.fullName) {
            navigate('/complete-profile');
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error('Failed to handle OAuth callback:', error);
          navigate('/login?error=oauth_failed');
        }
      } else {
        navigate('/login?error=no_token');
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-pink-700">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
        <p className="text-white text-lg mt-4">Completing authentication...</p>
      </div>
    </div>
  );
}
