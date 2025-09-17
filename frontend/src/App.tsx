import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Sender from "./Sender";
import Receiver from "./Receiver";

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <Link to={"/sender"}>Sender</Link>
              <Link to={"/receiver"}>Receiver</Link>
            </div>
          }
        />
        <Route path="/sender" element={<Sender />} />
        <Route path="/receiver" element={<Receiver />} />
      </Routes>
    </BrowserRouter>
  );
};
