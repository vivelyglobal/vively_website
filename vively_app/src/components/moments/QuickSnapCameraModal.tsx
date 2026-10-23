import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Camera, RefreshCw, Zap, ZapOff, Image as ImageIcon, 
  RotateCcw, ArrowRight, Check, Lock, Globe, Users, AlertCircle 
} from 'lucide-react';
import { Campaign, UserProfile, MomentPrivacy, Moment } from '../../types';

interface QuickSnapCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  campaigns: Campaign[];
  moments: Moment[];
  onShareMoment: (momentData: {
    photoUrl: string;
    campaignId: string;
    campaignTitle: string;
    campaignBrand: string;
    snapNumber: number;
    milestone: string;
    note: string;
    privacy: MomentPrivacy;
  }) => void;
  onNotify: (msg: string, type?: 'success' | 'info' | 'exp') => void;
}

export const QuickSnapCameraModal: React.FC<QuickSnapCameraModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  campaigns,
  moments,
  onShareMoment,
  onNotify,
}) => {
  // Stages: 'camera' -> 'preview' -> 'details'
  const [stage, setStage] = useState<'camera' | 'preview' | 'details'>('camera');
  
  // Camera stream state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashEnabled, setFlashEnabled] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(true);
  
  // Captured image & post details
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [milestone, setMilestone] = useState<string>('Product received');
  const [note, setNote] = useState<string>('');
  const [privacy, setPrivacy] = useState<MomentPrivacy>('community');

  // Stop camera stream safely
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start live camera stream
  const startCamera = async (mode: 'environment' | 'user') => {
    setIsCameraStarting(true);
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this device/browser.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraStarting(false);
    } catch (err: any) {
      console.warn('Camera stream failed:', err);
      setIsCameraStarting(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings or select a photo from your gallery.'
          : 'Live camera is unavailable on this device. You can choose a photo from your gallery.'
      );
    }
  };

  // Open camera when modal opens in 'camera' stage
  useEffect(() => {
    if (isOpen && stage === 'camera') {
      startCamera(facingMode);
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, stage, facingMode]);

  // Handle snap count helper for 3-snap rule
  const currentUserId = userProfile.id || 'my-user';
  const getSnapsCountForCampaign = (campId: string) => {
    return moments.filter(
      (m) =>
        (m.creatorId === currentUserId ||
          m.creatorUsername === (userProfile.displayName ? `@${userProfile.displayName}` : '@creator')) &&
        m.campaignId === campId
    ).length;
  };

  // Eligible campaigns list (real campaigns from database/state)
  const userEligibleCampaigns = campaigns;

  // Set default selected campaign when moving to details
  useEffect(() => {
    if (stage === 'details' && !selectedCampaignId) {
      const firstAvailable = userEligibleCampaigns.find((c) => getSnapsCountForCampaign(c.id) < 3);
      if (firstAvailable) {
        setSelectedCampaignId(firstAvailable.id);
      } else if (userEligibleCampaigns[0]) {
        setSelectedCampaignId(userEligibleCampaigns[0].id);
      }
    }
  }, [stage, selectedCampaignId, userEligibleCampaigns]);

  // Flip front / rear camera
  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Toggle flash / torch
  const handleToggleFlash = async () => {
    const nextFlash = !flashEnabled;
    setFlashEnabled(nextFlash);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: nextFlash }],
          });
        } catch {
          // torch constraint not supported on this device
        }
      }
    }
  };

  // Capture photo from live video stream
  const handleCaptureShutter = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    
    // Stop live stream to save battery and memory
    stopCameraStream();
    setCapturedPhotoUrl(dataUrl);
    setStage('preview');
  };

  // Pick file from gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onNotify('Please select a valid image file.', 'info');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        stopCameraStream();
        setCapturedPhotoUrl(reader.result as string);
        setStage('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  // Retake photo: return to camera
  const handleRetake = () => {
    setCapturedPhotoUrl('');
    setStage('camera');
  };

  // Continue to details step
  const handleContinueToDetails = () => {
    if (!capturedPhotoUrl) return;
    setStage('details');
  };

  // Share Moment submission
  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedPhotoUrl) {
      onNotify('Please capture or choose a photo first.', 'info');
      return;
    }

    if (!selectedCampaignId) {
      onNotify('Please link a campaign to this Moment.', 'info');
      return;
    }

    const snapsCount = getSnapsCountForCampaign(selectedCampaignId);
    if (snapsCount >= 3) {
      onNotify('Maximum 3 snaps reached for this campaign participation.', 'info');
      return;
    }

    const selectedCamp = userEligibleCampaigns.find((c) => c.id === selectedCampaignId);
    const campaignTitle = selectedCamp?.title || 'Brand UGC Campaign';
    const campaignBrand = selectedCamp?.brandName || 'Vively Brand';

    onShareMoment({
      photoUrl: capturedPhotoUrl,
      campaignId: selectedCampaignId,
      campaignTitle,
      campaignBrand,
      snapNumber: snapsCount + 1,
      milestone,
      note: note.trim().slice(0, 160),
      privacy,
    });

    // Reset and close
    setStage('camera');
    setCapturedPhotoUrl('');
    setNote('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Hidden file picker input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main Container */}
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col bg-zinc-950 text-white overflow-hidden sm:rounded-3xl sm:h-[94vh] sm:border sm:border-white/10 shadow-2xl">
        
        {/* ===================================================================== */}
        {/* STAGE 1: IMMEDIATE FULL-SCREEN LIVE CAMERA (LOCKET INSPIRED)           */}
        {/* ===================================================================== */}
        {stage === 'camera' && (
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* Top Bar: Flash toggle & Close button */}
            <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
              {/* Flash / Torch Toggle */}
              <button
                type="button"
                onClick={handleToggleFlash}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  flashEnabled ? 'bg-amber-400 text-black' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
                aria-label="Toggle Flash"
              >
                {flashEnabled ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
              </button>

              {/* Minimal "Quick Snap" badge */}
              <div className="text-xs font-bold tracking-wider text-white/80 uppercase">
                Quick Snap
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Camera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Camera Viewfinder */}
            <div className="relative flex-1 w-full overflow-hidden bg-black flex items-center justify-center">
              {/* Live Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isCameraStarting ? 'opacity-0' : 'opacity-100'
                } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Loading spinner while stream starts */}
              {isCameraStarting && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-black">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span className="text-xs text-zinc-400">Opening camera...</span>
                </div>
              )}

              {/* Camera Error / Permission Fallback View */}
              {cameraError && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/95 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-amber-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 max-w-xs">
                    <h3 className="font-bold text-sm text-white">Camera Unavailable</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {cameraError}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-full bg-white text-zinc-950 text-xs font-bold shadow-lg hover:bg-zinc-200 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Choose from Gallery</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar (Locket Layout): Gallery | Shutter | Flip Camera */}
            <div className="relative z-20 flex items-center justify-around py-6 px-6 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
              {/* Gallery / File Picker Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                aria-label="Upload from gallery"
                title="Choose from photo library"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Large Circular Shutter Button */}
              <button
                type="button"
                onClick={handleCaptureShutter}
                disabled={isCameraStarting || !!cameraError}
                className="w-20 h-20 rounded-full border-4 border-white p-1 flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:opacity-40 disabled:pointer-events-none group shadow-[0_0_24px_rgba(255,255,255,0.25)]"
                aria-label="Capture Photo"
              >
                <div className="w-full h-full rounded-full bg-white group-hover:bg-zinc-200 transition-colors" />
              </button>

              {/* Flip Camera Button */}
              <button
                type="button"
                onClick={handleSwitchCamera}
                disabled={isCameraStarting || !!cameraError}
                className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-30"
                aria-label="Switch Camera (Front/Rear)"
                title="Switch Front/Rear Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* STAGE 2: PHOTO PREVIEW AFTER CAPTURE                                  */}
        {/* ===================================================================== */}
        {stage === 'preview' && (
          <div className="relative w-full h-full flex flex-col justify-between p-4">
            {/* Header: Close / Retake */}
            <div className="flex items-center justify-between z-10">
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Preview (Occupies most of the screen) */}
            <div className="flex-1 my-3 rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-lg">
              <img
                src={capturedPhotoUrl}
                alt="Captured Moment"
                className="w-full h-full object-contain max-h-[68vh]"
              />
            </div>

            {/* Action Bar: Retake & Continue */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs tracking-wide transition-all cursor-pointer"
              >
                Change Photo
              </button>
              <button
                type="button"
                onClick={handleContinueToDetails}
                className="flex-1 py-3 rounded-full bg-white text-zinc-950 font-bold text-xs tracking-wide shadow-lg hover:bg-zinc-200 transition-all cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* STAGE 3: ADD DETAILS & LINK CAMPAIGN (3-SNAP LIMIT ENFORCEMENT)       */}
        {/* ===================================================================== */}
        {stage === 'details' && (
          <div className="relative w-full h-full flex flex-col justify-between overflow-y-auto no-scrollbar p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setStage('preview')}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer mr-1"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <h3 className="font-extrabold text-base text-white">
                  Add Moment Details
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleShareSubmit} className="space-y-4 flex-1">
              {/* Photo Thumbnail Banner */}
              <div className="relative rounded-2xl overflow-hidden h-28 bg-black border border-white/10 flex items-center justify-center group">
                <img
                  src={capturedPhotoUrl}
                  alt="Moment"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRetake}
                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white hover:bg-black/90 transition-all cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* 1. LINKED CAMPAIGN (3-SNAP LIMIT) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Linked Campaign</span>
                  <span className="text-[11px] text-purple-300 font-semibold">
                    {selectedCampaignId
                      ? `${getSnapsCountForCampaign(selectedCampaignId)} of 3 snaps used`
                      : 'Max 3 snaps per campaign'}
                  </span>
                </div>

                {userEligibleCampaigns.length > 0 ? (
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/10 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer"
                  >
                    {userEligibleCampaigns.map((camp) => {
                      const count = getSnapsCountForCampaign(camp.id);
                      const isMaxReached = count >= 3;
                      return (
                        <option
                          key={camp.id}
                          value={camp.id}
                          disabled={isMaxReached}
                          className="bg-zinc-900 text-white"
                        >
                          {camp.brandName} — {camp.title} ({isMaxReached ? 'Limit reached: 3 of 3 snaps used' : `Snap ${count + 1} of 3`})
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
                    No eligible campaigns yet. Join a campaign to start sharing Moments.
                  </div>
                )}
              </div>

              {/* 2. MILESTONE SELECTION (OPTIONAL HELP) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block">
                  Milestone (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Product received',
                    'Product testing',
                    'Filming review',
                    'Restaurant visit',
                    'Salon styling',
                    'Campaign completed',
                  ].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMilestone(m)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                        milestone === m
                          ? 'bg-white text-zinc-950 font-bold'
                          : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. OPTIONAL NOTE (MAX 160 CHARS) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Note (Optional)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    {note.length}/160
                  </span>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 160))}
                  placeholder="e.g. Finally received my package! ♡"
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-white/15 bg-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                />
              </div>

              {/* 4. PRIVACY */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block">
                  Visibility
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'community' as MomentPrivacy, label: 'Vively Community', icon: Globe },
                    { id: 'friends' as MomentPrivacy, label: 'Creator Friends', icon: Users },
                    { id: 'private' as MomentPrivacy, label: 'Only Me', icon: Lock },
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSelected = privacy === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPrivacy(p.id)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                          isSelected
                            ? 'border-white bg-white text-zinc-950 font-bold'
                            : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SHARE MOMENT BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!selectedCampaignId || getSnapsCountForCampaign(selectedCampaignId) >= 3}
                  className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-extrabold text-xs tracking-wide shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  Share Moment
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
