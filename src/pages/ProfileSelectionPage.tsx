import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { editUser } from "@/backend/accounts/user";
import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { Heading1, Paragraph } from "@/components/utils/Text";
import { useBackendUrl } from "@/hooks/auth/useBackendUrl";
import { useAuthStore } from "@/stores/auth";
import { uploadAvatar, saveProfileToVercel, deleteAvatar } from "@/utils/uploadAvatar";

const PROFILE_ICONS = [
  Icons.USER,
  Icons.STAR,
  Icons.CIRCLE_QUESTION,
  Icons.BOOKMARK,
  Icons.RISING_STAR,
  Icons.FIRE,
  Icons.CLAPPER_BOARD,
  Icons.FILM,
  Icons.PLAY,
  Icons.HEART,
  Icons.BELL,
  Icons.DOWNLOAD,
  Icons.UPLOAD,
  Icons.SEARCH,
  Icons.HOME,
  Icons.MENU,
  Icons.SETTINGS,
  Icons.LOGOUT,
];

const PROFILE_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Yellow", value: "#FBBF24" },
  { name: "Purple", value: "#A855F7" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Gray", value: "#6B7280" },
];

export function ProfileSelectionPage() {
  const navigate = useNavigate();
  const [selectedIcon, setSelectedIcon] = useState(Icons.USER);
  const [colorOne, setColorOne] = useState("#3B82F6");
  const [colorTwo, setColorTwo] = useState("#EC4899");
  const [loading, setLoading] = useState(false);

  const backendUrl = useBackendUrl();
  const account = useAuthStore((s) => s.account);
  const updateProfile = useAuthStore((s) => s.setAccountProfile);

  // Photo upload & pending states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }

    setUploadError(null);
    setPendingFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
  };

  const handleRemovePhoto = () => {
    setPendingFile(null);
    setPreviewUrl(null);
    setPhotoUrl(undefined);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!account || !backendUrl) return;

    setLoading(true);
    setUploadError(null);
    try {
      let finalPhotoUrl = photoUrl;

      // Perform upload only when Finish editing/Continue to Setup is clicked
      if (pendingFile) {
        try {
          const url = await uploadAvatar(pendingFile, account.seed);
          finalPhotoUrl = `${url}?t=${Date.now()}`;
        } catch (uploadErr: any) {
          console.error("Failed to upload photo:", uploadErr);
          setUploadError(uploadErr.message || "Failed to upload photo. Please try again.");
          setLoading(false);
          return;
        }
      }
      if (account.profile?.photoUrl && !finalPhotoUrl) {
        try {
          await deleteAvatar(account.profile.photoUrl);
        } catch (e) {
          console.error("Failed to delete old avatar file:", e);
        }
      }

      const newProfile = {
        icon: selectedIcon,
        colorA: colorOne,
        colorB: colorTwo,
        photoUrl: finalPhotoUrl,
      };

      await editUser(backendUrl, account, {
        profile: newProfile,
      });
      updateProfile(newProfile);

      try {
        await saveProfileToVercel(account.seed, account.nickname, newProfile);
      } catch (vercelErr) {
        console.error("Failed to sync profile to Vercel onboarding:", vercelErr);
      }

      navigate("/onboarding");
    } catch (err) {
      console.error("Failed to save profile", err);
    } finally {
      setLoading(false);
    }
  };

  const displayPhotoUrl = previewUrl || photoUrl;

  return (
    <div
      className="min-h-screen bg-background-main flex flex-col items-center justify-start py-12 px-4 relative overflow-x-hidden"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, var(--tw-gradient-from), var(--tw-gradient-to) 800px)",
      }}
    >
      {/* Background blurs */}
      <div className="fixed top-0 -right-48 rotate-[32deg] w-[50rem] h-[15rem] rounded-[70rem] bg-background-accentA blur-[100px] pointer-events-none opacity-25" />
      <div className="fixed top-0 right-48 rotate-[32deg] w-[50rem] h-[15rem] rounded-[70rem] bg-background-accentB blur-[100px] pointer-events-none opacity-25" />

      <div className="relative z-10 w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Heading1>Create Your Profile</Heading1>
          <Paragraph>
            Choose a photo or icon and colors for your profile. You can change
            these anytime in settings.
          </Paragraph>
        </div>

        {/* Profile Preview */}
        <div className="flex justify-center">
          <div className="relative">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden"
              style={
                displayPhotoUrl
                  ? undefined
                  : { background: `linear-gradient(135deg, ${colorOne}, ${colorTwo})` }
              }
            >
              {displayPhotoUrl ? (
                <img
                  src={displayPhotoUrl}
                  alt="Profile preview"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <Icon icon={selectedIcon} className="text-6xl text-white" />
              )}
            </div>
            {/* Upload overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center transition-all backdrop-blur-sm disabled:opacity-50"
              title="Upload photo"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Upload Photo Option */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full flex items-center gap-3 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all px-4 py-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {displayPhotoUrl ? (
              <>
                <img
                  src={displayPhotoUrl}
                  alt="Uploaded"
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
                <span className="text-sm text-white/80">Change photo</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 text-white/50 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-white/60">
                  Upload photo from device
                </span>
                <span className="ml-auto text-xs text-white/30">
                  JPG, PNG, WebP · Max 5MB
                </span>
              </>
            )}
          </button>

          {displayPhotoUrl && !loading && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove photo
            </button>
          )}

          {uploadError && (
            <p className="text-xs text-red-400">{uploadError}</p>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {displayPhotoUrl ? (
          /* ── Selected Profile Photo Preview ── */
          <div className="flex flex-col items-center space-y-4 py-6 bg-black/20 p-4 rounded-xl border border-white/5">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-green-500/50 shadow-lg">
              <img src={displayPhotoUrl} alt="Cropped preview" className="w-full h-full object-cover" />
            </div>
            {pendingFile ? (
              <p className="text-sm font-semibold text-purple-400 text-center">
                New photo selected! Press &quot;Continue to Setup&quot; below to save and upload.
              </p>
            ) : (
              <p className="text-sm font-bold text-green-400 text-center">
                Profile photo set successfully!
              </p>
            )}
          </div>
        ) : (
          /* ── Default Color & Icon Pickers ── */
          <>
            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30 uppercase tracking-widest">
                or choose icon & colors
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Icon Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">User Icon</h3>
              <div className="grid grid-cols-6 gap-3">
                {PROFILE_ICONS.map((icon) => (
                  <button
                    type="button"
                    key={icon}
                    onClick={() => setSelectedIcon(icon)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedIcon === icon
                        ? "border-pill-highlight bg-pill-highlight/20"
                        : "border-dropdown-border hover:border-pill-highlight/50"
                    }`}
                  >
                    <Icon icon={icon} className="text-2xl" />
                  </button>
                ))}
              </div>
            </div>

            {/* Color One Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Profile Color One</h3>
              <div className="grid grid-cols-6 gap-3">
                {PROFILE_COLORS.map((color) => (
                  <button
                    type="button"
                    key={color.value}
                    onClick={() => setColorOne(color.value)}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      colorOne === color.value
                        ? "border-white scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Color Two Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Profile Color Two</h3>
              <div className="grid grid-cols-6 gap-3">
                {PROFILE_COLORS.map((color) => (
                  <button
                    type="button"
                    key={color.value}
                    onClick={() => setColorTwo(color.value)}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      colorTwo === color.value
                        ? "border-white scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-center pt-6 pb-12">
          <Button
            theme="purple"
            onClick={handleSave}
            className="px-12"
            loading={loading}
          >
            Continue to Setup
          </Button>
        </div>
      </div>
    </div>
  );
}
