import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import AuctionDetails from "../pages/AuctionsDetails";
import Login from "../pages/Login";
import CreateAuction from "../pages/CreateAuction";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/auctions/:id", element: <AuctionDetails /> },
  { path: "/create", element: <CreateAuction /> },
]);