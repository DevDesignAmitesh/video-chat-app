// Room.tsx
import { useEffect, useRef, useState } from "react";

const WS_URL = "ws://localhost:8080";

const Room = ({ roomName }: { roomName: string }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const [name] = useState(() => prompt("Enter your name") || "Guest");
  const [streams, setStreams] = useState<
    { name: string; stream: MediaStream }[]
  >([]);

  const main = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = localStream;

    setStreams((s) => [...s, { name, stream: localStream }]);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = async () => {
      ws.send(JSON.stringify({ type: "join", room: roomName, name }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log(data);

      if (data.type === "participants") {
        // create offer for every other user
        for (const participant of data.participants) {
          if (participant !== name && !peersRef.current[participant]) {
            createPeerConnection(participant, true, localStream, undefined);
          }
        }
      }

      if (data.type === "offer") {
        createPeerConnection(data.from, false, localStream, data.sdp);
      }

      if (data.type === "answer") {
        try {
          console.log(data);

          await peersRef.current[data.from]?.setRemoteDescription(data.sdp);
        } catch (error) {
          console.log("data.from");
          console.log(data.from);
          console.log("data.from");
          console.log("yaha prr hai nooooooooooo");
          console.log(data);
          console.log("yaha prr hai nooooooooooo");
          console.log(error);
        }
      }

      if (data.type === "ice-candidate") {
        await peersRef.current[data.from]?.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    };

    const createPeerConnection = async (
      otherName: string,
      isInitiator: boolean,
      localStream: MediaStream,
      remoteOffer: RTCSessionDescriptionInit | undefined
    ) => {
      console.log(localStream);
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
      console.log("otherName");
      console.log(otherName);
      console.log("otherName");
      peersRef.current[otherName] = pc;

      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        setStreams((s) => {
          if (s.find((x) => x.name === otherName)) return s;
          return [...s, { name: otherName, stream: remoteStream! }];
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: event.candidate,
              from: name,
              to: otherName,
              room: roomName,
            })
          );
        }
      };

      if (isInitiator) {
        pc.onnegotiationneeded = async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(
            JSON.stringify({
              type: "offer",
              sdp: offer,
              from: name,
              to: otherName,
              room: roomName,
            })
          );
        };
      } else if (remoteOffer) {
        try {
          await pc.setRemoteDescription(remoteOffer);
        } catch (error) {
          console.log("yaha prr hai helloooooo");
          console.log(error);
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(
          JSON.stringify({
            type: "answer",
            sdp: answer,
            from: name,
            to: otherName,
            room: roomName,
          })
        );
      }
    };
  };

  useEffect(() => {
    main();
  }, [roomName, name]);

  return (
    <div>
      <h1>Room: {roomName}</h1>
      {streams.map((user, idx) => (
        <div key={idx}>
          <video
            autoPlay
            playsInline
            ref={(el) => {
              if (el && user.stream) el.srcObject = user.stream;
            }}
            width={300}
          />
          <p>{user.name}</p>
        </div>
      ))}
    </div>
  );
};

export default Room;
