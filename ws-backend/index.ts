import { WebSocket, WebSocketServer } from "ws";

const server = new WebSocketServer({ port: 8080 });

let sender: WebSocket | null = null;
let receiver: WebSocket | null = null;
console.log("running");

server.on("connection", (ws) => {
  console.log("connection done");

  ws.on("message", (data) => {
    const parsedData = JSON.parse(data.toString());
    console.log(parsedData);

    if (parsedData.type === "sender") {
      sender = ws;
    }

    if (parsedData.type === "receiver") {
      receiver = ws;
    }

    if (parsedData.type === "offer") {
      if (ws !== sender) {
        sender?.send(
          JSON.stringify({ type: parsedData.type, sdp: parsedData.sdp })
        );
        return;
      }

      receiver?.send(
        JSON.stringify({ type: parsedData.type, sdp: parsedData.sdp })
      );
      return;
    }

    if (parsedData.type === "answer") {
      if (ws !== receiver) {
        receiver?.send(
          JSON.stringify({ type: parsedData.type, sdp: parsedData.sdp })
        );

        return;
      }

      sender?.send(
        JSON.stringify({ type: parsedData.type, sdp: parsedData.sdp })
      );
      return;
    }

    if (parsedData.type === "ice-candidate") {
      if (ws === receiver) {
        sender?.send(
          JSON.stringify({
            type: parsedData.type,
            candidate: parsedData.candidate,
          })
        );
        return;
      }
      if (ws === sender) {
        receiver?.send(
          JSON.stringify({
            type: parsedData.type,
            candidate: parsedData.candidate,
          })
        );
        return;
      }
    }
  });
});
