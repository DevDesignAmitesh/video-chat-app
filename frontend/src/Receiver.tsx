import { useEffect, useRef } from "react";

const Receiver = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // const getMedia = async () => {
  //   const media = await navigator.mediaDevices.getUserMedia({
  //     video: true,
  //     audio: true,
  //   });

  //   const videoTrack = media.getVideoTracks()[0];

  //   if (videoRef.current && videoTrack) {
  //     videoRef.current.srcObject = new MediaStream([videoTrack]);
  //   }
  // };

  const main = async () => {
    // await getMedia();

    console.log(videoRef);

    const ws = new WebSocket("ws://localhost:8080");
    const pc = new RTCPeerConnection();

    ws.onopen = async () => {
      ws.send(JSON.stringify({ type: "receiver" }));
    };

    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = new MediaStream([event.track]);
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

    ws.onmessage = async (event) => {
      const parsedData = JSON.parse(event.data);

      if (parsedData.type === "offer") {
        await pc.setRemoteDescription(parsedData.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        ws.send(JSON.stringify({ type: "answer", sdp: pc.localDescription }));
      }

      if (parsedData.type === "ice-candidate") {
        try {
          await pc.addIceCandidate(parsedData.candidate);
        } catch (err) {
          console.error("Error adding received ice candidate", err);
        }
      }
    };
  };

  useEffect(() => {
    main();
  }, [videoRef]);

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

export default Receiver;
