export const WS_URL =
  import.meta.env.PROD
    ? "https://video-chat-app-z09r.onrender.com"
    : "ws://localhost:8080";

console.log(WS_URL);
