import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Monitor, Users, Copy, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Lightweight peer-to-peer meeting room.
 * Uses Supabase Realtime "broadcast" channel as a signalling transport
 * and a star topology (each peer connects to every other peer with RTCPeerConnection).
 * Supports: audio mute, video off, screen share, leave, copy link, in-room chat.
 */

interface RemotePeer {
  id: string;
  name: string;
  pc: RTCPeerConnection;
  stream: MediaStream;
}

interface ChatMsg {
  from: string;
  name: string;
  text: string;
  ts: number;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function MeetingRoom() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RemotePeer>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const [peers, setPeers] = useState<RemotePeer[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [joined, setJoined] = useState(false);

  const myName = profile?.full_name || user?.email?.split("@")[0] || "Guest";

  const refreshPeers = () => setPeers(Array.from(peersRef.current.values()));

  const createPeerConnection = (peerId: string, peerName: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const remoteStream = new MediaStream();

    localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));

    pc.ontrack = (ev) => {
      ev.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      refreshPeers();
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        channelRef.current?.send({
          type: "broadcast",
          event: "ice",
          payload: { to: peerId, from: user!.id, candidate: ev.candidate },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        peersRef.current.delete(peerId);
        refreshPeers();
      }
    };

    peersRef.current.set(peerId, { id: peerId, name: peerName, pc, stream: remoteStream });
    refreshPeers();
    return pc;
  };

  useEffect(() => {
    if (!roomId || !user) return;
    let mounted = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err: any) {
        toast.error("Could not access camera/microphone: " + err.message);
        return;
      }

      const channel = supabase.channel(`meet-${roomId}`, {
        config: { broadcast: { ack: false }, presence: { key: user.id } },
      });
      channelRef.current = channel;

      // when somebody announces themselves, the existing peers create an offer
      channel.on("broadcast", { event: "hello" }, async ({ payload }) => {
        if (payload.from === user.id) return;
        const pc = createPeerConnection(payload.from, payload.name);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.send({ type: "broadcast", event: "offer", payload: { to: payload.from, from: user.id, name: myName, sdp: offer } });
      });

      channel.on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (payload.to !== user.id) return;
        const pc = createPeerConnection(payload.from, payload.name);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({ type: "broadcast", event: "answer", payload: { to: payload.from, from: user.id, sdp: answer } });
      });

      channel.on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (payload.to !== user.id) return;
        const peer = peersRef.current.get(payload.from);
        if (peer) await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      });

      channel.on("broadcast", { event: "ice" }, async ({ payload }) => {
        if (payload.to !== user.id) return;
        const peer = peersRef.current.get(payload.from);
        if (peer && payload.candidate) {
          try { await peer.pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch {}
        }
      });

      channel.on("broadcast", { event: "bye" }, ({ payload }) => {
        const peer = peersRef.current.get(payload.from);
        if (peer) {
          peer.pc.close();
          peersRef.current.delete(payload.from);
          refreshPeers();
        }
      });

      channel.on("broadcast", { event: "chat" }, ({ payload }) => {
        setChat((prev) => [...prev, payload as ChatMsg]);
      });

      await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.send({ type: "broadcast", event: "hello", payload: { from: user.id, name: myName } });
          setJoined(true);
        }
      });
    })();

    return () => {
      mounted = false;
      channelRef.current?.send({ type: "broadcast", event: "bye", payload: { from: user?.id } });
      peersRef.current.forEach((p) => p.pc.close());
      peersRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user?.id]);

  const toggleMic = () => {
    const tracks = localStreamRef.current?.getAudioTracks() || [];
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setMicOn(tracks[0]?.enabled ?? false);
  };

  const toggleCam = () => {
    const tracks = localStreamRef.current?.getVideoTracks() || [];
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setCamOn(tracks[0]?.enabled ?? false);
  };

  const toggleShare = async () => {
    if (sharing) {
      // revert to camera
      const cam = await navigator.mediaDevices.getUserMedia({ video: true });
      const newTrack = cam.getVideoTracks()[0];
      peersRef.current.forEach((p) => {
        const sender = p.pc.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(newTrack);
      });
      localStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
      localStreamRef.current?.removeTrack(localStreamRef.current.getVideoTracks()[0]);
      localStreamRef.current?.addTrack(newTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setSharing(false);
      return;
    }
    try {
      const screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      const screenTrack: MediaStreamTrack = screen.getVideoTracks()[0];
      peersRef.current.forEach((p) => {
        const sender = p.pc.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
      });
      const oldVideo = localStreamRef.current?.getVideoTracks()[0];
      if (oldVideo) {
        localStreamRef.current?.removeTrack(oldVideo);
        oldVideo.stop();
      }
      localStreamRef.current?.addTrack(screenTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setSharing(true);
      screenTrack.onended = () => toggleShare();
    } catch (e: any) {
      toast.error("Screen share cancelled");
    }
  };

  const leave = () => {
    navigate("/meetings");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Meeting link copied");
  };

  const sendChat = () => {
    if (!draft.trim() || !user) return;
    const msg: ChatMsg = { from: user.id, name: myName, text: draft.trim(), ts: Date.now() };
    channelRef.current?.send({ type: "broadcast", event: "chat", payload: msg });
    setChat((prev) => [...prev, msg]);
    setDraft("");
  };

  const tileCount = peers.length + 1;
  const gridCols = tileCount <= 1 ? "grid-cols-1" : tileCount <= 4 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-sm">Room: {roomId}</span>
          <span className="text-xs text-zinc-400 flex items-center gap-1"><Users className="w-3 h-3" />{tileCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyLink} className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs flex items-center gap-1"><Copy className="w-3 h-3" />Copy link</button>
          <button onClick={() => setChatOpen((v) => !v)} className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs flex items-center gap-1"><MessageSquare className="w-3 h-3" />Chat</button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 grid ${gridCols} gap-2 p-2 overflow-auto`}>
          <div className="relative bg-zinc-900 rounded-lg overflow-hidden aspect-video">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-xs font-mono">
              {myName} (you){!micOn && " 🔇"}
            </div>
          </div>
          {peers.map((p) => (
            <RemoteTile key={p.id} peer={p} />
          ))}
          {!joined && (
            <div className="col-span-full flex items-center justify-center text-zinc-400 font-mono text-sm">
              Connecting…
            </div>
          )}
        </div>

        {chatOpen && (
          <div className="w-72 border-l border-zinc-800 bg-zinc-900 flex flex-col">
            <div className="px-3 py-2 border-b border-zinc-800 text-sm font-mono">In-room chat</div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
              {chat.length === 0 ? (
                <p className="text-zinc-500 text-xs">No messages yet</p>
              ) : chat.map((m, i) => (
                <div key={i}>
                  <div className="text-[10px] text-zinc-500">{m.name}</div>
                  <div className="text-zinc-100">{m.text}</div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-zinc-800 flex gap-1">
              <input value={draft} onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Message…"
                className="flex-1 bg-zinc-800 rounded px-2 py-1 text-xs outline-none" />
              <button onClick={sendChat} className="px-2 rounded bg-emerald-600 text-xs">Send</button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 py-3 bg-zinc-900 border-t border-zinc-800">
        <button onClick={toggleMic} className={`p-3 rounded-full ${micOn ? "bg-zinc-700 hover:bg-zinc-600" : "bg-red-600 hover:bg-red-500"}`} title={micOn ? "Mute" : "Unmute"}>
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button onClick={toggleCam} className={`p-3 rounded-full ${camOn ? "bg-zinc-700 hover:bg-zinc-600" : "bg-red-600 hover:bg-red-500"}`} title={camOn ? "Turn camera off" : "Turn camera on"}>
          {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button onClick={toggleShare} className={`p-3 rounded-full ${sharing ? "bg-emerald-600 hover:bg-emerald-500" : "bg-zinc-700 hover:bg-zinc-600"}`} title="Share screen">
          <Monitor className="w-5 h-5" />
        </button>
        <button onClick={leave} className="p-3 rounded-full bg-red-600 hover:bg-red-500" title="Leave">
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function RemoteTile({ peer }: { peer: RemotePeer }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = peer.stream;
  }, [peer.stream]);
  return (
    <div className="relative bg-zinc-900 rounded-lg overflow-hidden aspect-video">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-xs font-mono">{peer.name}</div>
    </div>
  );
}
