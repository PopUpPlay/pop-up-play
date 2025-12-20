import Home from './pages/Home';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Discover from './pages/Discover';
import VideoCall from './pages/VideoCall';
import About from './pages/About';
import BlockedUsers from './pages/BlockedUsers';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Profile": Profile,
    "Dashboard": Dashboard,
    "Chat": Chat,
    "Discover": Discover,
    "VideoCall": VideoCall,
    "About": About,
    "BlockedUsers": BlockedUsers,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};