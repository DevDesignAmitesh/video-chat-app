import { useEffect, useRef } from "react";

const Receiver = () => {
  // remote video
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // my video
  const myVideoRef = useRef<HTMLVideoElement | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const getMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (myVideoRef.current) {
      myVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => {
      if (pcRef.current) {
        pcRef.current.addTrack(track, stream);
      }
    });
  };

  const main = async () => {
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

    pc.onnegotiationneeded = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: "offer", sdp: offer }));
    };

    const ws = new WebSocket("https://video-chat-app-z09r.onrender.com");
    // const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "receiver" }));
    };

    ws.onmessage = async (event) => {
      const parsedData = JSON.parse(event.data);

      if (parsedData.type === "offer") {
        try {
          await pc.setRemoteDescription(parsedData.sdp);
        } catch (error) {
          console.log("eror is here?");
          console.log(error);
        }
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

      if (parsedData.type === "answer") {
        try {
          await pc.setRemoteDescription(parsedData.sdp);
        } catch (error) {
          console.log("eror is here?");
          console.log(error);
        }
      }
    };
  };

  useEffect(() => {
    main();
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        style={{ height: 300, width: 400 }}
        autoPlay
        playsInline
      />
      <video
        ref={myVideoRef}
        style={{ height: 300, width: 400 }}
        autoPlay
        playsInline
      />
      <button onClick={getMedia}>join</button>
    </div>
  );
};

export default Receiver;
