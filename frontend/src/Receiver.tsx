import { useEffect, useRef } from "react";

const Receiver = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
        {
          urls: "turn:relay1.expressturn.com:3480",
          username: "000000002073456016",
          credential: "gQbzPfO/mKNu6qA2SsyooQ6Abnk=",
        },
      ],
    });
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current?.send(
          JSON.stringify({ type: "ice-candidate", candidate: event.candidate })
        );
      }
    };

    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0]!;
      }
    };

    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "receiver" }));
    };

    ws.onmessage = async (event) => {
      const parsedData = JSON.parse(event.data);

      if (parsedData.type === "offer") {
        await pc.setRemoteDescription(parsedData.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", sdp: answer }));
      }

      if (parsedData.type === "ice-candidate") {
        try {
          await pc.addIceCandidate(parsedData.candidate);
        } catch (err) {
          console.error("Error adding ICE candidate", err);
        }
      }
    };
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        style={{ height: 300, width: 400 }}
        autoPlay
        playsInline
      />
    </div>
  );
};

export default Receiver;
