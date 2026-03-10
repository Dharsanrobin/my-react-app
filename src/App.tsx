import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import CreateAuction from "./pages/CreateAuction";
import AuctionsDetails from "./pages/AuctionsDetails";
import Members from "./pages/Members";
import CreateTour from "./pages/CreateTour";
import AddPlayers from "./pages/AddPlayers";
import AuthLogin from "./pages/AuthLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import Standing from "./pages/Standing";
import MemberDashboard from "./pages/MemberDashboard";

export default function App() {
  return (
    <Routes>
      {/* Public login page */}
      <Route path="/auth" element={<AuthLogin />} />

      {/* Protected pages */}
      <Route element={<ProtectedRoute />}>
        {/* Admin dashboard */}
        <Route path="/" element={<Home />} />

        {/* Member dashboard */}
        <Route path="/member-dashboard" element={<MemberDashboard />} />

        <Route path="/CreateAuction" element={<CreateAuction />} />
        <Route path="/AuctionsDetails" element={<AuctionsDetails />} />
        <Route path="/Members" element={<Members />} />
        <Route path="/CreateTour" element={<CreateTour />} />
        <Route path="/AddPlayers" element={<AddPlayers />} />
        <Route path="/Standing" element={<Standing />} />

        {/* old login inside dashboard */}
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
}