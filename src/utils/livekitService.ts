import { Room, RoomEvent, Track, RemoteTrack, LocalTrack, RemoteParticipant } from "livekit-client";

export interface LiveKitTokenResponse {
  token: string;
  url: string;
  roomName: string;
}

export async function requestLiveKitToken(
  roomName: string,
  participantIdentity: string,
  participantName: string
): Promise<LiveKitTokenResponse> {
  const response = await fetch("/api/livekit/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomName,
      participantIdentity,
      participantName
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "خطا در دریافت توکن برقراری ارتباط زنده LiveKit");
  }

  return response.json();
}

export interface LiveKitCallCallbacks {
  onRemoteVideoTrack?: (track: RemoteTrack, el: HTMLVideoElement | null) => void;
  onRemoteAudioTrack?: (track: RemoteTrack, el: HTMLAudioElement | null) => void;
  onLocalVideoTrack?: (track: LocalTrack, el: HTMLVideoElement | null) => void;
  onPartnerMuteChange?: (isMuted: boolean, isCameraOff: boolean) => void;
  onConnectionStatusChange?: (status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected') => void;
  onParticipantDisconnected?: (participant: RemoteParticipant) => void;
  onError?: (err: any) => void;
}

export class LiveKitCallSession {
  private room: Room | null = null;
  private callbacks: LiveKitCallCallbacks = {};
  private remoteVideoEl: HTMLVideoElement | null = null;
  private remoteAudioEl: HTMLAudioElement | null = null;
  private localVideoEl: HTMLVideoElement | null = null;
  public isConnected: boolean = false;

  constructor(callbacks: LiveKitCallCallbacks) {
    this.callbacks = callbacks;
  }

  public setVideoElements(remoteVideo: HTMLVideoElement | null, localVideo: HTMLVideoElement | null, remoteAudio: HTMLAudioElement | null) {
    this.remoteVideoEl = remoteVideo;
    this.localVideoEl = localVideo;
    this.remoteAudioEl = remoteAudio;

    // Attach existing tracks if already subscribed
    if (this.room) {
      this.room.remoteParticipants.forEach(participant => {
        participant.trackPublications.forEach(pub => {
          if (pub.track) {
            if (pub.track.kind === Track.Kind.Video && this.remoteVideoEl) {
              pub.track.attach(this.remoteVideoEl);
            } else if (pub.track.kind === Track.Kind.Audio && this.remoteAudioEl) {
              pub.track.attach(this.remoteAudioEl);
            }
          }
        });
      });

      const localCamPub = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (localCamPub?.track && this.localVideoEl) {
        localCamPub.track.attach(this.localVideoEl);
      }
    }
  }

  public async join({
    roomName,
    identity,
    name,
    callType,
    remoteVideoEl,
    localVideoEl,
    remoteAudioEl
  }: {
    roomName: string;
    identity: string;
    name: string;
    callType: 'audio' | 'video';
    remoteVideoEl?: HTMLVideoElement | null;
    localVideoEl?: HTMLVideoElement | null;
    remoteAudioEl?: HTMLAudioElement | null;
  }): Promise<Room> {
    if (remoteVideoEl !== undefined) this.remoteVideoEl = remoteVideoEl;
    if (localVideoEl !== undefined) this.localVideoEl = localVideoEl;
    if (remoteAudioEl !== undefined) this.remoteAudioEl = remoteAudioEl;

    this.callbacks.onConnectionStatusChange?.('connecting');

    // 1. Fetch Token from backend
    const { token, url } = await requestLiveKitToken(roomName, identity, name);

    // 2. Initialize LiveKit Room with optimal adaptive settings
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true
      },
      videoCaptureDefaults: {
        resolution: {
          width: 1280,
          height: 720,
          frameRate: 30
        }
      }
    });

    this.room = room;

    // Set up Room Events
    room.on(RoomEvent.Connected, () => {
      this.isConnected = true;
      this.callbacks.onConnectionStatusChange?.('connected');
    });

    room.on(RoomEvent.Reconnecting, () => {
      this.callbacks.onConnectionStatusChange?.('reconnecting');
    });

    room.on(RoomEvent.Reconnected, () => {
      this.callbacks.onConnectionStatusChange?.('connected');
    });

    room.on(RoomEvent.Disconnected, () => {
      this.isConnected = false;
      this.callbacks.onConnectionStatusChange?.('disconnected');
    });

    // Remote Track Subscribed
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Video) {
        if (this.remoteVideoEl) {
          track.attach(this.remoteVideoEl);
        }
        this.callbacks.onRemoteVideoTrack?.(track, this.remoteVideoEl);
        this.checkPartnerStatus(participant);
      } else if (track.kind === Track.Kind.Audio) {
        if (this.remoteAudioEl) {
          track.attach(this.remoteAudioEl);
        }
        this.callbacks.onRemoteAudioTrack?.(track, this.remoteAudioEl);
        this.checkPartnerStatus(participant);
      }
    });

    // Remote Track Unsubscribed
    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      track.detach();
      this.checkPartnerStatus(participant);
    });

    // Remote Participant Mute/Unmute
    room.on(RoomEvent.TrackMuted, (publication, participant) => {
      this.checkPartnerStatus(participant);
    });

    room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
      this.checkPartnerStatus(participant);
    });

    // Participant Disconnected
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      this.callbacks.onParticipantDisconnected?.(participant);
    });

    // 3. Connect to LiveKit Cloud Server
    await room.connect(url, token);

    // 4. Publish Local Tracks
    try {
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (e) {
      console.warn("Could not enable microphone automatically:", e);
    }

    if (callType === 'video') {
      try {
        await room.localParticipant.setCameraEnabled(true);
        const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (camPub?.track && this.localVideoEl) {
          camPub.track.attach(this.localVideoEl);
        }
        if (camPub?.track) {
          this.callbacks.onLocalVideoTrack?.(camPub.track as LocalTrack, this.localVideoEl);
        }
      } catch (e) {
        console.warn("Could not enable camera automatically:", e);
      }
    }

    // Attach any tracks from participants who are already in the room
    room.remoteParticipants.forEach(participant => {
      participant.trackPublications.forEach(pub => {
        if (pub.track) {
          if (pub.track.kind === Track.Kind.Video && this.remoteVideoEl) {
            pub.track.attach(this.remoteVideoEl);
          } else if (pub.track.kind === Track.Kind.Audio && this.remoteAudioEl) {
            pub.track.attach(this.remoteAudioEl);
          }
        }
      });
      this.checkPartnerStatus(participant);
    });

    return room;
  }

  private checkPartnerStatus(participant?: any) {
    if (!participant && this.room) {
      participant = Array.from(this.room.remoteParticipants.values())[0];
    }
    if (!participant) return;

    const audioPub = participant.getTrackPublication(Track.Source.Microphone);
    const videoPub = participant.getTrackPublication(Track.Source.Camera);

    const isMuted = !audioPub || audioPub.isMuted || !audioPub.isEnabled;
    const isCameraOff = !videoPub || videoPub.isMuted || !videoPub.isEnabled;

    this.callbacks.onPartnerMuteChange?.(isMuted, isCameraOff);
  }

  public async setMicrophoneEnabled(enabled: boolean) {
    if (this.room) {
      await this.room.localParticipant.setMicrophoneEnabled(enabled);
    }
  }

  public async setCameraEnabled(enabled: boolean) {
    if (this.room) {
      await this.room.localParticipant.setCameraEnabled(enabled);
      if (enabled) {
        const camPub = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (camPub?.track && this.localVideoEl) {
          camPub.track.attach(this.localVideoEl);
        }
        if (camPub?.track) {
          this.callbacks.onLocalVideoTrack?.(camPub.track as LocalTrack, this.localVideoEl);
        }
      } else {
        const camPub = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (camPub?.track && this.localVideoEl) {
          camPub.track.detach(this.localVideoEl);
        }
      }
    }
  }

  public async leave() {
    this.isConnected = false;
    if (this.room) {
      try {
        if (this.remoteVideoEl) {
          this.room.remoteParticipants.forEach(p => {
            p.trackPublications.forEach(pub => {
              if (pub.track && this.remoteVideoEl) pub.track.detach(this.remoteVideoEl);
            });
          });
        }
        if (this.remoteAudioEl) {
          this.room.remoteParticipants.forEach(p => {
            p.trackPublications.forEach(pub => {
              if (pub.track && this.remoteAudioEl) pub.track.detach(this.remoteAudioEl);
            });
          });
        }
        if (this.localVideoEl) {
          const camPub = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camPub?.track) camPub.track.detach(this.localVideoEl);
        }
        await this.room.disconnect();
      } catch (e) {
        console.error("Error leaving LiveKit room:", e);
      }
      this.room = null;
    }
  }
}
