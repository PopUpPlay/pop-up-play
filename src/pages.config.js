import About from './pages/About';
import AllProfiles from './pages/AllProfiles';
import BlockedUsers from './pages/BlockedUsers';
import Broadcast from './pages/Broadcast';
import OnlineMembers from './pages/OnlineMembers';
import VideoCall from './pages/VideoCall';
import Menu from './pages/Menu';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Discover from './pages/Discover';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AllProfiles": AllProfiles,
    "BlockedUsers": BlockedUsers,
    "Broadcast": Broadcast,
    "OnlineMembers": OnlineMembers,
    "VideoCall": VideoCall,
    "Menu": Menu,
    "Profile": Profile,
    "Dashboard": Dashboard,
    "Home": Home,
    "Chat": Chat,
    "Discover": Discover,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};