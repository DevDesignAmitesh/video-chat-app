import { WebSocket, WebSocketServer } from "ws";

const server = new WebSocketServer({ port: 8080 });

let sender: WebSocket | null = null;
let receiver: WebSocket | null = null;

server.on("connection", (ws) => {
  ws.on("message", (data) => {
    const parsedData = JSON.parse(data.toString());

    if (parsedData.type === "sender") {
      sender = ws;
    }

    if (parsedData.type === "receiver") {
      receiver = ws;
    }

    if (parsedData.type === "offer") {
      if (ws !== sender) {
        return;
      }

      receiver?.send(
        JSON.stringify({ type: parsedData.type, sdp: parsedData.sdp })
      );
    }

    if (parsedData.type === "answer") {
      if (ws !== receiver) {
        return;
      }

      sender?.send(
        JSON.stringify({ type: parsedData.type, sdp: parsedData.sdp })
      );
    }

    if (parsedData.type === "ice-candidate") {
      if (ws === receiver) {
        sender?.send(
          JSON.stringify({ type: parsedData.type, sdp: parsedData.sdp })
        );
        return;
      }
      if (ws === sender) {
        receiver?.send(
          JSON.stringify({ type: parsedData.type, sdp: parsedData.sdp })
        );
        return;
      }
    }
  });
});
