import About from './pages/About';
import AccessCodeManager from './pages/AccessCodeManager';
import BlockedUsers from './pages/BlockedUsers';
import Broadcast from './pages/Broadcast';
import Chat from './pages/Chat';
import EnterAccessCode from './pages/EnterAccessCode';
import Home from './pages/Home';
import Menu from './pages/Menu';
import OnlineMembers from './pages/OnlineMembers';
import Pricing from './pages/Pricing';
import SubscriptionSettings from './pages/SubscriptionSettings';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import VideoCall from './pages/VideoCall';
import AllProfiles from './pages/AllProfiles';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AccessCodeManager": AccessCodeManager,
    "BlockedUsers": BlockedUsers,
    "Broadcast": Broadcast,
    "Chat": Chat,
    "EnterAccessCode": EnterAccessCode,
    "Home": Home,
    "Menu": Menu,
    "OnlineMembers": OnlineMembers,
    "Pricing": Pricing,
    "SubscriptionSettings": SubscriptionSettings,
    "SubscriptionSuccess": SubscriptionSuccess,
    "VideoCall": VideoCall,
    "AllProfiles": AllProfiles,
    "Profile": Profile,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};