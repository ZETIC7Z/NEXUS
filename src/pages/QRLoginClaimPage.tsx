import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { claimQRSession, getQRSession } from "@/utils/qrSession";
import { Heading1, Paragraph } from "@/components/utils/Text";
import { Button } from "@/components/buttons/Button";

export function QRLoginClaimPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "confirm" | "success" | "error">("loading");
  const [requestDevice, setRequestDevice] = useState("Another Device");
  const [errorMsg, setErrorMsg] = useState("");

  const account = useAuthStore((s) => s.account);
  const backendUrl = useAuthStore((s) => s.backendUrl);

  useEffect(() => {
    if (!sessionId) return;

    const loadSession = async () => {
      try {
        const session = await getQRSession(sessionId);
        if (!session) {
          setStatus("error");
          setErrorMsg("This login request could not be found or has expired.");
          return;
        }

        if (session.status !== "pending") {
          setStatus("error");
          setErrorMsg("This login request has already been claimed or has expired.");
          return;
        }

        setRequestDevice(session.requestDevice || "Another Device");

        // Check if user is logged in on this device
        if (!account) {
          setStatus("error");
          setErrorMsg("Please log in on this device first to authorize another device.");
          return;
        }

        setStatus("confirm");
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message || "Failed to load authorization session.");
      }
    };

    loadSession();
  }, [sessionId, account]);

  const handleAuthorize = async () => {
    if (!sessionId || !account) return;
    setStatus("loading");

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
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to authorize device pairing.");
    }
  };

  const handleCancel = () => {
    navigate("/discover");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[#0d0d0f] border border-white/10 rounded-2xl p-8 shadow-2xl">
        {status === "loading" && (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <Heading1 className="!text-xl">Processing Request...</Heading1>
            <Paragraph>Connecting your devices securely.</Paragraph>
          </div>
        )}

        {status === "confirm" && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto text-purple-500 text-2xl">
              💻
            </div>
            <div className="space-y-2">
              <Heading1 className="!text-xl text-white">Authorize Device Pairing?</Heading1>
              <Paragraph className="text-white/60 px-4">
                Are you sure you want to log in to:
                <br />
                <span className="text-purple-400 font-bold block mt-1">{requestDevice}</span>
              </Paragraph>
            </div>
            <div className="flex gap-3 px-4">
              <Button theme="secondary" onClick={handleCancel} className="flex-1">
                No, Cancel
              </Button>
              <Button theme="purple" onClick={handleAuthorize} className="flex-1">
                Yes, Authorize
              </Button>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto text-green-500 text-3xl">
              ✓
            </div>
            <Heading1 className="!text-xl text-green-400">Success!</Heading1>
            <Paragraph>
              The other device is now logged in. You can close this window.
            </Paragraph>
            <Button theme="purple" onClick={() => navigate("/discover")} className="w-full">
              Go to Home
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500 text-3xl">
              ✗
            </div>
            <Heading1 className="!text-xl text-red-400">Pairing Failed</Heading1>
            <Paragraph>{errorMsg}</Paragraph>
            <div className="space-y-2">
              {!account && sessionId && (
                <Button
                  theme="purple"
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/qr-login/${sessionId}`)}`)}
                  className="w-full"
                >
                  Log In to Authorize
                </Button>
              )}
              <Button theme="secondary" onClick={() => navigate("/discover")} className="w-full">
                Go to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
