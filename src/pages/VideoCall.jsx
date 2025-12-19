import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Video, VideoOff, Mic, MicOff, PhoneOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function VideoCall() {
  const [user, setUser] = useState(null);
  const [otherUserEmail, setOtherUserEmail] = useState(null);
  const [callId, setCallId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState('initializing'); // initializing, calling, connected, ended

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    setOtherUserEmail(userParam);
    setCallId(`call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: otherProfile } = useQuery({
    queryKey: ['otherProfile', otherUserEmail],
    queryFn: async () => {
      if (!otherUserEmail) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: otherUserEmail });
      return profiles[0] || null;
    },
    enabled: !!otherUserEmail
  });

  // Poll for signals
  const { data: signals = [] } = useQuery({
    queryKey: ['videoSignals', callId, user?.email],
    queryFn: async () => {
      if (!callId || !user?.email) return [];
      const allSignals = await base44.entities.VideoSignal.filter({
        to_email: user.email,
        call_id: callId
      }, '-created_date');
      return allSignals;
    },
    enabled: !!callId && !!user?.email && callStatus !== 'ended',
    refetchInterval: 1000
  });

  const sendSignalMutation = useMutation({
    mutationFn: async ({ signal_type, signal_data }) => {
      return base44.entities.VideoSignal.create({
        from_email: user.email,
        to_email: otherUserEmail,
        signal_type,
        signal_data: JSON.stringify(signal_data),
        call_id: callId
      });
    }
  });

  const deleteSignalMutation = useMutation({
    mutationFn: async (signalId) => {
      return base44.entities.VideoSignal.delete(signalId);
    }
  });

  // Initialize WebRTC
  useEffect(() => {
    if (!user?.email || !otherUserEmail || !callId) return;

    const initWebRTC = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create peer connection
        const config = {
          iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }]

        };
        const pc = new RTCPeerConnection(config);
        peerConnectionRef.current = pc;

        // Add local stream tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle incoming tracks
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsConnecting(false);
            setCallStatus('connected');
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignalMutation.mutate({
              signal_type: 'ice-candidate',
              signal_data: event.candidate
            });
          }
        };

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignalMutation.mutateAsync({
          signal_type: 'offer',
          signal_data: offer
        });

        setCallStatus('calling');
        setIsConnecting(false);
      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        toast.error('Failed to access camera/microphone');
        setCallStatus('ended');
      }
    };

    initWebRTC();

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [user?.email, otherUserEmail, callId]);

  // Handle incoming signals
  useEffect(() => {
    if (!signals.length || !peerConnectionRef.current) return;

    const processSignals = async () => {
      for (const signal of signals) {
        try {
          const data = JSON.parse(signal.signal_data);

          if (signal.signal_type === 'answer') {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data));
            await deleteSignalMutation.mutateAsync(signal.id);
          } else if (signal.signal_type === 'offer') {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            await sendSignalMutation.mutateAsync({
              signal_type: 'answer',
              signal_data: answer
            });
            await deleteSignalMutation.mutateAsync(signal.id);
          } else if (signal.signal_type === 'ice-candidate') {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data));
            await deleteSignalMutation.mutateAsync(signal.id);
          } else if (signal.signal_type === 'end-call') {
            setCallStatus('ended');
            await deleteSignalMutation.mutateAsync(signal.id);
          }
        } catch (error) {
          console.error('Error processing signal:', error);
        }
      }
    };

    processSignals();
  }, [signals]);

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const endCall = async () => {
    await sendSignalMutation.mutateAsync({
      signal_type: 'end-call',
      signal_data: {}
    });
    setCallStatus('ended');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  if (!user || !otherProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>);

  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-lg border-b border-slate-700 flex-shrink-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-slate-700">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <img
                src={otherProfile.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'}
                alt={otherProfile.display_name}
                className="w-10 h-10 rounded-full border-2 border-violet-400" />

              <div>
                <h2 className="text-white font-semibold">{otherProfile.display_name}</h2>
                <p className="text-xs text-slate-400">
                  {callStatus === 'initializing' && 'Initializing...'}
                  {callStatus === 'calling' && 'Calling...'}
                  {callStatus === 'connected' && 'Connected'}
                  {callStatus === 'ended' && 'Call Ended'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Video Container */}
      <main className="flex-1 relative overflow-hidden">
        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover" />


        {/* Connection Status Overlay */}
        {isConnecting &&
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
              <p className="text-white text-lg">Connecting...</p>
            </div>
          </div>
        }

        {/* Call Ended Overlay */}
        {callStatus === 'ended' &&
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <PhoneOff className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">Call Ended</h3>
              <Link to={createPageUrl('Home')}>
                <Button className="bg-purple-700 text-[#ffffff] mt-4 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 hover:bg-violet-700">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        }

        {/* Local Video (Picture-in-Picture) */}
        <motion.div
          className="absolute top-4 right-4 w-32 h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}>

          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover" />

          {!isVideoEnabled &&
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-white" />
            </div>
          }
        </motion.div>

        {/* Controls */}
        {callStatus !== 'ended' &&
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <motion.div
            className="bg-slate-800/90 backdrop-blur-lg rounded-full p-4 flex items-center gap-4 shadow-2xl"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}>

              <Button
              size="icon"
              onClick={toggleAudio}
              className={`rounded-full w-14 h-14 ${
              isAudioEnabled ?
              'bg-slate-700 hover:bg-slate-600' :
              'bg-red-500 hover:bg-red-600'}`
              }>

                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </Button>

              <Button
              size="icon"
              onClick={endCall}
              className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600">

                <PhoneOff className="w-6 h-6" />
              </Button>

              <Button
              size="icon"
              onClick={toggleVideo}
              className={`rounded-full w-14 h-14 ${
              isVideoEnabled ?
              'bg-slate-700 hover:bg-slate-600' :
              'bg-red-500 hover:bg-red-600'}`
              }>

                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>
            </motion.div>
          </div>
        }
      </main>
    </div>);

}