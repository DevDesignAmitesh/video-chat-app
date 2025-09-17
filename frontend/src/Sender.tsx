import { useEffect, useRef, useState } from "react";

const Sender = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [pcg, setPc] = useState<RTCPeerConnection | null>(null);

  const getMedia = async (pc: RTCPeerConnection) => {
    const media = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const videoTrack = media.getVideoTracks()[0];

    if (videoRef.current && videoTrack) {
      videoRef.current.srcObject = new MediaStream([videoTrack]);
    }

    media.getTracks().forEach((track) => {
      pc.addTrack(track);
    });
  };

  const main = async () => {
    const ws = new WebSocket("ws://localhost:8080");
    const pc = new RTCPeerConnection();
    setPc(pc);

    await getMedia(pc);

    console.log(videoRef);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "sender" }));
    };

    pc.ontrack = (event) => {
      if (videoRef.current) {
        if (!videoRef.current.srcObject) {
          videoRef.current.srcObject = new MediaStream();
        }
        (videoRef.current.srcObject as MediaStream).addTrack(event.track);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(
          JSON.stringify({
            type: "ice-candidate",
            candidate: event.candidate,
          })
        );
      }
    };

    pc.onnegotiationneeded = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      ws.send(JSON.stringify({ type: "offer", sdp: pc.localDescription }));
    };

    ws.onmessage = async (event) => {
      const parsedData = JSON.parse(event.data);

      if (parsedData.type === "answer") {
        await pc.setRemoteDescription(parsedData.sdp);
      }

      if (parsedData.type === "ice-candidate") {
        await pc.addIceCandidate(parsedData.candidate);
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
        muted
        autoPlay
        playsInline
      />
    </div>
  );
};

export default Sender;
