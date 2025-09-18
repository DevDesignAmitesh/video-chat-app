import { useEffect, useRef } from "react";

const Sender = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
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

  const handleCall = async () => {
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

    await getMedia();

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
  };

  useEffect(() => {
    const ws = new WebSocket("https://video-chat-app-z09r.onrender.com");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "sender" }));
    };

    ws.onmessage = async (event) => {
      const parsedData = JSON.parse(event.data);

      if (parsedData.type === "answer") {
        await pcRef.current?.setRemoteDescription(parsedData.sdp);
      }

      if (parsedData.type === "ice-candidate") {
        try {
          await pcRef.current?.addIceCandidate(parsedData.candidate);
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
        muted
        autoPlay
        playsInline
      />
      <button onClick={handleCall}>Join</button>
    </div>
  );
};

export default Sender;
