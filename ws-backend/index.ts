import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

const rooms: Map<string, { name: string; ws: WebSocket }[]> = new Map(); // roomName -> [{ name, ws }]

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg.toString());
    console.log(data)

    if (data.type === "join") {
      if (!rooms.has(data.room)) {
        rooms.set(data.room, []);
      }
      rooms.get(data.room)?.push({ name: data.name, ws });

      // notify all about new participant
      rooms.get(data.room)?.forEach((user) => {
        user.ws.send(
          JSON.stringify({
            type: "participants",
            participants: rooms.get(data.room)?.map((u) => u.name),
          })
        );
      });
    }

    if (["offer", "answer", "ice-candidate"].includes(data.type)) {
      // forward only to the target user
      const targetUser = rooms.get(data.room)?.find((u) => u.name === data.to);
      if (targetUser) {
        targetUser.ws.send(JSON.stringify(data));
      }
    }
  });

  ws.on("close", () => {
    rooms.forEach((users, room) => {
      rooms.set(
        room,
        users.filter((u) => u.ws !== ws)
      );
    });
  });
});

console.log("Signaling server running on ws://localhost:8080");
