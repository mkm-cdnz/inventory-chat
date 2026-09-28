import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, FlipHorizontal, AlertCircle } from 'lucide-react';

interface LiveCameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export const LiveCameraCapture: React.FC<LiveCameraCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: 'environment' | 'user') => {
    setLoading(true);
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      // Fallback without facingMode constraint if initial attempt failed
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
        }
      } catch (fallbackErr: any) {
        setCameraError(
          fallbackErr.message || 'Unable to access camera. Please check browser permissions.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopCamera();
    onCapture(dataUrl);
    onClose();
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#2c3e50] text-white rounded-[12px] overflow-hidden max-w-xl w-full border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 bg-[#1e293b] flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#3498db]" />
            <span className="text-xs font-semibold tracking-wide">
              Point Camera at Chip, Board, or Connector
            </span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded text-[#ecf0f1] hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Video Area */}
        <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 space-y-2">
              <RefreshCw className="w-6 h-6 text-[#3498db] animate-spin" />
              <span className="text-xs text-[#ecf0f1]">Initializing camera...</span>
            </div>
          )}

          {cameraError ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs text-[#ecf0f1] max-w-xs mx-auto">{cameraError}</p>
              <label className="inline-block px-3 py-1.5 bg-[#3498db] text-white text-xs font-semibold rounded cursor-pointer hover:bg-[#2980b9]">
                Choose photo from files instead
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const b64 = ev.target?.result as string;
                        stopCamera();
                        onCapture(b64);
                        onClose();
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Reticle / Focus Target */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-dashed border-[#3498db]/70 rounded-[12px] flex items-center justify-center">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-[#3498db] absolute top-10 left-10" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-[#3498db] absolute top-10 right-10" />
                  <div className="w-4 h-4 border-b-2 border-l-2 border-[#3498db] absolute bottom-10 left-10" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-[#3498db] absolute bottom-10 right-10" />
                  <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                    Align text or IC pins
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Shutter & Controls */}
        <div className="p-4 bg-[#1e293b] flex items-center justify-between">
          <button
            onClick={toggleCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#ecf0f1] hover:bg-white/10 rounded transition cursor-pointer"
            title="Flip Camera"
          >
            <FlipHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Flip Camera</span>
          </button>

          <button
            onClick={capturePhoto}
            disabled={!stream || !!cameraError}
            className="w-14 h-14 rounded-full border-4 border-white bg-[#3498db] hover:bg-[#2980b9] active:scale-95 flex items-center justify-center shadow-lg transition cursor-pointer disabled:opacity-50"
            title="Capture & Search Internet"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>

          <label className="text-xs text-[#3498db] hover:underline cursor-pointer font-medium">
            Upload file
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const b64 = ev.target?.result as string;
                    stopCamera();
                    onCapture(b64);
                    onClose();
                  };
                  reader.readAsDataURL(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
