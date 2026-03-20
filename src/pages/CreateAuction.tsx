import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Bid = {
  id: number;
  bidder: string;
  amount: number;
  time: string;
};

type Chat = {
  id: number;
  sender: string;
  message: string;
  time: string;
};

export default function AuctionRoom() {
  const navigate = useNavigate();

  const role = localStorage.getItem("role") || "MEMBER";
  const username = localStorage.getItem("loggedInEmail") || "Guest";

  const [auctionStatus, setAuctionStatus] = useState("LIVE");

  const [currentPlayer] = useState({
    name: "Neymar Jr",
    role: "Forward",
    team: "Brazil",
    basePrice: 5000,
  });

  const [highestBid, setHighestBid] = useState(5000);
  const [highestBidder, setHighestBidder] = useState("None");

  const [bidAmount, setBidAmount] = useState("");

  const [bids, setBids] = useState<Bid[]>([
    { id: 1, bidder: "Team A", amount: 6000, time: "10:01 AM" },
    { id: 2, bidder: "Team B", amount: 7000, time: "10:02 AM" },
  ]);

  const [messages, setMessages] = useState<Chat[]>([
    { id: 1, sender: "Admin", message: "Auction started!", time: "10:00 AM" },
  ]);

  const [chatInput, setChatInput] = useState("");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  const placeBid = () => {
    const amount = Number(bidAmount);

    if (!amount || amount <= highestBid) {
      alert("Bid must be higher than current highest bid.");
      return;
    }

    const newBid: Bid = {
      id: Date.now(),
      bidder: username,
      amount,
      time: new Date().toLocaleTimeString(),
    };

    setBids((prev) => [newBid, ...prev]);
    setHighestBid(amount);
    setHighestBidder(username);

    setBidAmount("");
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage: Chat = {
      id: Date.now(),
      sender: username,
      message: chatInput,
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setChatInput("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Player Auction Room
            </h1>
            <p className="text-sm text-slate-600">
              Status: <span className="font-semibold text-green-600">{auctionStatus}</span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Current Player */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <div className="bg-white p-5 rounded-3xl shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Player</p>
            <p className="text-xl font-bold">{currentPlayer.name}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Role</p>
            <p className="text-xl font-bold">{currentPlayer.role}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Base Price</p>
            <p className="text-xl font-bold">{currentPlayer.basePrice}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Highest Bid</p>
            <p className="text-xl font-bold text-green-600">{highestBid}</p>
            <p className="text-xs text-slate-500">By {highestBidder}</p>
          </div>
        </div>

        {/* Bid Section */}
        {role !== "ADMIN" && (
          <div className="bg-white p-6 rounded-3xl shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold mb-3">Place Bid</h2>

            <div className="flex gap-3">
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter bid amount"
                className="border border-slate-300 rounded-xl px-4 py-2 w-full"
              />

              <button
                onClick={placeBid}
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700"
              >
                Place Bid
              </button>
            </div>
          </div>
        )}

        {/* Admin Controls */}
        {role === "ADMIN" && (
          <div className="bg-white p-6 rounded-3xl shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold mb-3">Admin Controls</h2>

            <div className="flex gap-3">
              <button
                onClick={() => setAuctionStatus("LIVE")}
                className="bg-green-600 text-white px-4 py-2 rounded-xl"
              >
                Start Auction
              </button>

              <button
                onClick={() => setAuctionStatus("CLOSED")}
                className="bg-red-600 text-white px-4 py-2 rounded-xl"
              >
                Close Auction
              </button>
            </div>
          </div>
        )}

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Bid History */}
          <div className="bg-white p-6 rounded-3xl shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold mb-4">Bid History</h2>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  className="flex justify-between border-b pb-2 text-sm"
                >
                  <span>{bid.bidder}</span>
                  <span className="font-semibold">{bid.amount}</span>
                  <span className="text-slate-500">{bid.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold mb-4">Live Chat</h2>

            <div className="space-y-2 max-h-[250px] overflow-y-auto mb-3">
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="font-semibold">{msg.sender}: </span>
                  {msg.message}
                  <span className="text-xs text-slate-400 ml-2">
                    {msg.time}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type message..."
                className="border border-slate-300 rounded-xl px-4 py-2 w-full"
              />

              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl"
              >
                Send
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}