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

export default function App() {
  return (
    <Routes>
      {/* Public login page */}
      <Route path="/auth" element={<AuthLogin />} />

      {/* Dashboard pages protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/CreateAuction" element={<CreateAuction />} />
        <Route path="/AuctionsDetails" element={<AuctionsDetails />} />
        <Route path="/Members" element={<Members />} />
        <Route path="/CreateTour" element={<CreateTour />} />
        <Route path="/AddPlayers" element={<AddPlayers />} />

        {/* old login inside dashboard */}
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
}
