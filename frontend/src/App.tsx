import { Routes, Route, useNavigate } from "react-router-dom";
// import Sender from "./Sender";
// import Receiver from "./Receiver";
import { useState } from "react";
import Room from "./Room";

export const App = () => {
  const [roomName, setRoomName] = useState<string>("");
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    navigate(`/room/${encodeURIComponent(roomName)}`, { state: { roomName } });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter Room Name"
            />
            <button onClick={handleJoinRoom}>Join Room</button>
          </div>
        }
      />
      <Route path="/room/*" element={<Room roomName={roomName} />} />
    </Routes>
  );
};
