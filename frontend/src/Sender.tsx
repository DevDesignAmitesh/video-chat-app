import { useEffect, useRef } from "react";

const Sender = () => {
  // my video
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // remote video
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const getMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => {
      pcRef.current?.addTrack(track, stream);
    });
  };

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

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]!;
      }
    };

    pc.onnegotiationneeded = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      wsRef.current?.send(JSON.stringify({ type: "offer", sdp: offer }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current?.send(
          JSON.stringify({ type: "ice-candidate", candidate: event.candidate })
        );
      }
    };
    const ws = new WebSocket("https://video-chat-app-z09r.onrender.com");
    // const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "sender" }));
    };

    ws.onmessage = async (event) => {
      const parsedData = JSON.parse(event.data);

      if (parsedData.type === "answer") {
        await pc.setRemoteDescription(parsedData.sdp);
      }

      if (parsedData.type === "offer") {
        try {
          await pc.setRemoteDescription(parsedData.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify({ type: "answer", sdp: answer }));
        } catch (error) {
          console.log("eror is here?");
          console.log(error);
        }
      }

      if (parsedData.type === "ice-candidate") {
        try {
          await pc.addIceCandidate(parsedData.candidate);
        } catch (err) {
          console.log("Error adding ICE candidate", err);
        }
      }
    };
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        style={{ height: 300, width: 400 }}
        muted
        autoPlay
        playsInline
      />
      <video
        ref={remoteVideoRef}
        style={{ height: 300, width: 400 }}
        muted
        autoPlay
        playsInline
      />
      <button onClick={getMedia}>Join</button>
    </div>
  );
};

export default Sender;
