import About from './pages/About';
import BlockedUsers from './pages/BlockedUsers';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Home from './pages/Home';
import OnlineMembers from './pages/OnlineMembers';
import Profile from './pages/Profile';
import VideoCall from './pages/VideoCall';
import Menu from './pages/Menu';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "BlockedUsers": BlockedUsers,
    "Chat": Chat,
    "Dashboard": Dashboard,
    "Discover": Discover,
    "Home": Home,
    "OnlineMembers": OnlineMembers,
    "Profile": Profile,
    "VideoCall": VideoCall,
    "Menu": Menu,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};