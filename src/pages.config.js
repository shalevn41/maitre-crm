import AdminDashboard from './pages/AdminDashboard';
import AdminRestaurants from './pages/AdminRestaurants';
import AdminSettings from './pages/AdminSettings';
import AdminTemplates from './pages/AdminTemplates';
import Automations from './pages/Automations';
import Billing from './pages/Billing';
import CRMIntegration from './pages/CRMIntegration';
import Campaigns from './pages/Campaigns';
import CustomerSignup from './pages/CustomerSignup';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Feedback from './pages/Feedback';
import Home from './pages/Home';
import Landing from './pages/Landing';
import LandingPageBuilder from './pages/LandingPageBuilder';
import Profile from './pages/Profile';
import PublicFeedback from './pages/PublicFeedback';
import Register from './pages/Register';
import RestaurantSettings from './pages/RestaurantSettings';
import StripeIntegration from './pages/StripeIntegration';
import Templates from './pages/Templates';
import WaiterIncentives from './pages/WaiterIncentives';
import WaiterProfile from './pages/WaiterProfile';
import Waiters from './pages/Waiters';
import WaitersReports from './pages/WaitersReports';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdminRestaurants": AdminRestaurants,
    "AdminSettings": AdminSettings,
    "AdminTemplates": AdminTemplates,
    "Automations": Automations,
    "Billing": Billing,
    "CRMIntegration": CRMIntegration,
    "Campaigns": Campaigns,
    "CustomerSignup": CustomerSignup,
    "Customers": Customers,
    "Dashboard": Dashboard,
    "Feedback": Feedback,
    "Home": Home,
    "Landing": Landing,
    "LandingPageBuilder": LandingPageBuilder,
    "Profile": Profile,
    "PublicFeedback": PublicFeedback,
    "Register": Register,
    "RestaurantSettings": RestaurantSettings,
    "StripeIntegration": StripeIntegration,
    "Templates": Templates,
    "WaiterIncentives": WaiterIncentives,
    "WaiterProfile": WaiterProfile,
    "Waiters": Waiters,
    "WaitersReports": WaitersReports,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};