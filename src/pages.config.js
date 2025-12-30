import About from './pages/About';
import AccessCodeManager from './pages/AccessCodeManager';
import AllProfiles from './pages/AllProfiles';
import BlockedUsers from './pages/BlockedUsers';
import Broadcast from './pages/Broadcast';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import EnterAccessCode from './pages/EnterAccessCode';
import Menu from './pages/Menu';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import SubscriptionSettings from './pages/SubscriptionSettings';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import VideoCall from './pages/VideoCall';
import Home from './pages/Home';
import OnlineMembers from './pages/OnlineMembers';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AccessCodeManager": AccessCodeManager,
    "AllProfiles": AllProfiles,
    "BlockedUsers": BlockedUsers,
    "Broadcast": Broadcast,
    "Chat": Chat,
    "Dashboard": Dashboard,
    "EnterAccessCode": EnterAccessCode,
    "Menu": Menu,
    "Pricing": Pricing,
    "Profile": Profile,
    "SubscriptionSettings": SubscriptionSettings,
    "SubscriptionSuccess": SubscriptionSuccess,
    "VideoCall": VideoCall,
    "Home": Home,
    "OnlineMembers": OnlineMembers,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};