import About from './pages/About';
import AllProfiles from './pages/AllProfiles';
import BlockedUsers from './pages/BlockedUsers';
import Broadcast from './pages/Broadcast';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Home from './pages/Home';
import Menu from './pages/Menu';
import OnlineMembers from './pages/OnlineMembers';
import Profile from './pages/Profile';
import VideoCall from './pages/VideoCall';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AllProfiles": AllProfiles,
    "BlockedUsers": BlockedUsers,
    "Broadcast": Broadcast,
    "Chat": Chat,
    "Dashboard": Dashboard,
    "Discover": Discover,
    "Home": Home,
    "Menu": Menu,
    "OnlineMembers": OnlineMembers,
    "Profile": Profile,
    "VideoCall": VideoCall,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};