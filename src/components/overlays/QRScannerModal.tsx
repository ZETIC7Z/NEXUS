import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";

import { Button } from "@/components/buttons/Button";
import { Heading2 } from "@/components/utils/Text";
import { Modal, ModalCard, useModal } from "@/components/overlays/Modal";
import { useAuthStore } from "@/stores/auth";
import { getQRSession, claimQRSession } from "@/utils/qrSession";

interface QRScannerModalProps {
  id: string;
  close: () => void;
}

type PairingStatus = "scanning" | "confirm" | "loading" | "success" | "error";

export function QRScannerModal(props: QRScannerModalProps) {
  const { isShown } = useModal(props.id);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [useUploadMode, setUseUploadMode] = useState(false);

  // Pairing workflow states
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [targetDevice, setTargetDevice] = useState<string | null>(null);
  const [pairingStatus, setPairingStatus] = useState<PairingStatus>("scanning");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const account = useAuthStore((s) => s.account);
  const backendUrl = useAuthStore((s) => s.backendUrl);

  const handleScannedSession = useCallback(
    async (sid: string) => {
      setPairingStatus("loading");
      try {
        const session = await getQRSession(sid);
        if (!session || session.status !== "pending") {
          throw new Error("Session is invalid or has already been used.");
        }
        setSessionId(sid);
        setTargetDevice(session.requestDevice || "Another Device");
        setPairingStatus("confirm");
      } catch (err: any) {
        setPairingStatus("error");
        setErrorMessage(err.message || "Failed to load session details.");
      }
    },
    [],
  );

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch {
        // ignore stop errors
      }
      html5QrCodeRef.current = null;
    }
    setScannerActive(false);
  }, []);

  const startCameraScanner = useCallback(async () => {
    setScannerError(null);
    setPairingStatus("scanning");
    setSessionId(null);
    setTargetDevice(null);
    setUseUploadMode(false);

    // Give the DOM a tick to render #qr-reader
    await new Promise((r) => setTimeout(r, 150));

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          if (decodedText.includes("/qr-login/")) {
            const parts = decodedText.split("/qr-login/");
            const sid = parts[parts.length - 1]?.split("?")[0]?.trim();
            if (sid) {
              await stopScanner();
              handleScannedSession(sid);
            }
          }
        },
        () => {
          // qr scan miss - no-op
        },
      );
      setScannerActive(true);
    } catch (err: any) {
      console.error("Camera scanner start error:", err);
      setScannerError(
        err.message?.includes("Permission") || err.message?.includes("permission")
          ? "Camera access denied. Please allow camera access in your browser settings, or use the image upload option below."
          : err.message ||
              "Failed to access camera. Please try image upload instead.",
      );
    }
  }, [stopScanner, handleScannedSession]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      setScannerError(null);
      setPairingStatus("loading");
      try {
        const html5QrCode = new Html5Qrcode("qr-reader-hidden");
        const result = await html5QrCode.scanFile(file, false);
        if (result.includes("/qr-login/")) {
          const parts = result.split("/qr-login/");
          const sid = parts[parts.length - 1]?.split("?")[0]?.trim();
          if (sid) {
            handleScannedSession(sid);
            return;
          }
        }
        throw new Error("No valid NEXUS QR code found in the image.");
      } catch (err: any) {
        setPairingStatus("scanning");
        setScannerError(err.message || "Could not read QR code from image.");
      }
    },
    [handleScannedSession],
  );

  const handleConfirmPairing = async () => {
    if (!sessionId) {
      setPairingStatus("error");
      setErrorMessage("Session ID is missing. Please scan the QR code again.");
      return;
    }
    if (!account) {
      setPairingStatus("error");
      setErrorMessage("You are not logged in. Please log in first to authorize another device.");
      return;
    }

    setPairingStatus("loading");

    try {
      const authData = {
        token: account.token,
        userId: account.userId,
        sessionId: account.sessionId,
        seed: account.seed,
        backendUrl: backendUrl ?? "",
        account: {
          nickname: account.nickname,
          profile: {
            colorA: account.profile?.colorA || "#3B82F6",
            colorB: account.profile?.colorB || "#EC4899",
            icon: account.profile?.icon || "user",
            photoUrl: account.profile?.photoUrl,
          },
        },
      };
      await claimQRSession(sessionId, authData);
      setPairingStatus("success");
    } catch (err: any) {
      setPairingStatus("error");
      setErrorMessage(err.message || "Failed to authorize device pairing.");
    }
  };

  const resetScanner = () => {
    setScannerError(null);
    setSessionId(null);
    setTargetDevice(null);
    setErrorMessage("");
    setUseUploadMode(false);
    setPairingStatus("scanning");
    startCameraScanner();
  };

  // Start/stop scanner based on modal visibility
  useEffect(() => {
    if (
      isShown &&
      pairingStatus === "scanning" &&
      !scannerActive &&
      !scannerError &&
      !useUploadMode
    ) {
      startCameraScanner();
    }
    if (!isShown) {
      stopScanner();
      // Reset state when modal closes
      setScannerError(null);
      setSessionId(null);
      setTargetDevice(null);
      setErrorMessage("");
      setUseUploadMode(false);
      setPairingStatus("scanning");
    }
  }, [isShown]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal id={props.id}>
      <ModalCard>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Heading2 className="!mt-0 !mb-0">Scan QR Login</Heading2>
          <button
            type="button"
            onClick={props.close}
            className="text-white/40 hover:text-white transition-colors text-2xl font-light leading-none"
          >
            ×
          </button>
        </div>

        {/* Hidden element for file-based QR scanning */}
        <div id="qr-reader-hidden" className="hidden" />

        {/* ── Scanning State ── */}
        {pairingStatus === "scanning" && (
          <div className="flex flex-col items-center gap-4">
            {!useUploadMode ? (
              <>
                <p className="text-xs text-white/50 text-center">
                  Point your camera at the QR code on the other device's landing
                  page.
                </p>
                {scannerError ? (
                  <div className="w-full text-center space-y-4 py-4">
                    <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-xl">
                      📷
                    </div>
                    <p className="text-red-400 text-sm px-2">{scannerError}</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      <Button theme="secondary" onClick={startCameraScanner}>
                        Retry Camera
                      </Button>
                      <Button
                        theme="purple"
                        onClick={() => setUseUploadMode(true)}
                      >
                        Upload QR Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-3">
                    {/* Camera viewport */}
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
                      <div id="qr-reader" className="w-full h-full" />
                      {/* Scanning laser line animation */}
                      {scannerActive && (
                        <div className="absolute inset-x-4 h-0.5 top-1/2 bg-purple-500/70 shadow-[0_0_12px_#a855f7] animate-scan-laser pointer-events-none rounded-full" />
                      )}
                      {/* Corner guides */}
                      {scannerActive && (
                        <>
                          <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-purple-400 rounded-tl-lg" />
                          <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-purple-400 rounded-tr-lg" />
                          <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-purple-400 rounded-bl-lg" />
                          <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-purple-400 rounded-br-lg" />
                        </>
                      )}
                      {!scannerActive && !scannerError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseUploadMode(true)}
                      className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors underline"
                    >
                      Can&apos;t use camera? Upload a QR image instead
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Upload mode */
              <div className="w-full space-y-4">
                <p className="text-xs text-white/50 text-center">
                  Take a screenshot of the QR code and upload it here to log in.
                </p>
                <label
                  htmlFor="qr-image-upload"
                  className="flex flex-col items-center justify-center w-full aspect-square rounded-2xl border-2 border-dashed border-purple-500/40 hover:border-purple-500/80 bg-purple-500/5 hover:bg-purple-500/10 cursor-pointer transition-all group"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    📷
                  </div>
                  <p className="text-sm text-white/60 font-semibold">
                    Click to upload QR image
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    PNG, JPG, or screenshot
                  </p>
                  <input
                    id="qr-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {scannerError && (
                  <p className="text-red-400 text-xs text-center">
                    {scannerError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setUseUploadMode(false);
                    setScannerError(null);
                    startCameraScanner();
                  }}
                  className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors underline"
                >
                  Use camera instead
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Loading State ── */}
        {pairingStatus === "loading" && (
          <div className="text-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-white/60">
              Processing login pairing request...
            </p>
          </div>
        )}

        {/* ── Confirm Pairing State ── */}
        {pairingStatus === "confirm" && (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto text-3xl">
              💻
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black text-white">
                Authorize Device Pairing?
              </p>
              <p className="text-sm text-white/60 px-4">
                Are you sure you want to log in to:
                <br />
                <span className="text-purple-400 font-bold block mt-1">
                  {targetDevice}
                </span>
              </p>
            </div>
            <div className="flex gap-3 px-4">
              <Button
                theme="secondary"
                onClick={props.close}
                className="flex-1"
              >
                No, Cancel
              </Button>
              <Button
                theme="purple"
                onClick={handleConfirmPairing}
                className="flex-1"
              >
                Yes, Authorize
              </Button>
            </div>
          </div>
        )}

        {/* ── Success State ── */}
        {pairingStatus === "success" && (
          <div className="text-center py-8 space-y-5">
            {/* Animated pulsing checkmark */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-25" />
              <div className="absolute inset-2 rounded-full border-2 border-green-400/50 animate-ping opacity-20 [animation-delay:300ms]" />
              <div className="w-24 h-24 bg-green-500/15 border-2 border-green-400 rounded-full flex items-center justify-center text-green-400 text-5xl font-black shadow-[0_0_40px_rgba(74,222,128,0.35)]">
                ✓
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-black text-green-400">Login Successful!</p>
              <p className="text-sm text-white/50">
                Successfully authorized:
              </p>
              <p className="text-base font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5 inline-block">
                {targetDevice || "Another Device"}
              </p>
            </div>
            <p className="text-xs text-white/40">
              That device is now logged in. You can close this scanner.
            </p>
            <Button theme="purple" onClick={props.close} className="w-full">
              Close Scanner
            </Button>
          </div>
        )}

        {/* ── Error State ── */}
        {pairingStatus === "error" && (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500 text-3xl">
              ✗
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black text-red-400">Failed to Pair</p>
              <p className="text-sm text-red-400/80 px-4">{errorMessage}</p>
            </div>
            <div className="flex gap-3">
              <Button
                theme="secondary"
                onClick={resetScanner}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button theme="purple" onClick={props.close} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </ModalCard>
    </Modal>
  );
}
