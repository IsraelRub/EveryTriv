import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeView from './views/home';
import UserProfile from './views/user';

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/profile" element={<UserProfile />} />
      </Routes>
    </Router>
  );
}
