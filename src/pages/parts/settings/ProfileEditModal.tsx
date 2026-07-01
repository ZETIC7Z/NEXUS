import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/buttons/Button";
import { ColorPicker } from "@/components/form/ColorPicker";
import { IconPicker } from "@/components/form/IconPicker";
import { Modal, ModalCard } from "@/components/overlays/Modal";
import { UserIcons } from "@/components/UserIcon";
import { Heading2 } from "@/components/utils/Text";
import { useAuthStore } from "@/stores/auth";
import { uploadAvatar, saveProfileToVercel, deleteAvatar } from "@/utils/uploadAvatar";

export interface ProfileEditModalProps {
  id: string;
  close?: () => void;
  colorA: string;
  setColorA: (s: string) => void;
  colorB: string;
  setColorB: (s: string) => void;
  userIcon: UserIcons;
  setUserIcon: (s: UserIcons) => void;
}

export function ProfileEditModal(props: ProfileEditModalProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pending photo states
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingRemove, setPendingRemove] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const setAccountPhotoUrl = useAuthStore((s) => s.setAccountPhotoUrl);
  const currentPhotoUrl = useAuthStore(
    (s) => s.account?.profile?.photoUrl ?? null,
  );

  const displayPhotoUrl = pendingRemove 
    ? null 
    : (previewUrl ?? currentPhotoUrl ?? null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }

    setUploadError(null);
    setPendingFile(file);
    setPendingRemove(false);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
  };

  const handleRemovePhoto = () => {
    setPendingFile(null);
    setPendingRemove(true);
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancel = () => {
    setPendingFile(null);
    setPendingRemove(false);
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    props.close?.();
  };

  const handleFinishEditing = async () => {
    setUploading(true);
    setUploadError(null);
    try {
      const account = useAuthStore.getState().account;
      if (!account) throw new Error("No account found");

      let finalPhotoUrl: string | undefined = currentPhotoUrl ?? undefined;

      if (pendingFile) {
        const url = await uploadAvatar(pendingFile, account.seed);
        finalPhotoUrl = `${url}?t=${Date.now()}`;
        setAccountPhotoUrl(finalPhotoUrl);
        setPreviewUrl(finalPhotoUrl);
      } else if (pendingRemove) {
        if (currentPhotoUrl) {
          try {
            await deleteAvatar(currentPhotoUrl);
          } catch (e) {
            console.error("Failed to delete old avatar file:", e);
          }
        }
        setAccountPhotoUrl(undefined);
        setPreviewUrl(null);
        finalPhotoUrl = undefined;
      }

      // Save profile JSON on Vercel
      await saveProfileToVercel(account.seed, account.nickname, {
        colorA: props.colorA,
        colorB: props.colorB,
        icon: props.userIcon,
        photoUrl: finalPhotoUrl,
      });

      setPendingFile(null);
      setPendingRemove(false);
      props.close?.();
    } catch (err: any) {
      console.error("Failed to finish editing profile:", err);
      setUploadError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal id={props.id}>
      <ModalCard>
        <div className="flex justify-between items-center mb-9">
          <Heading2 className="!mt-0 !mb-0">
            {t("settings.account.profile.title")}
          </Heading2>
          <Avatar
            profile={{
              colorA: props.colorA,
              colorB: props.colorB,
              icon: props.userIcon,
              photoUrl: displayPhotoUrl || undefined,
            }}
            iconClass="text-2xl"
            sizeClass="w-12 h-12"
          />
        </div>

        <div className="space-y-6">
          {/* ── Upload Photo Section ── */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white/80">Upload Photo</p>
            <div className="flex items-center gap-3">
              {/* Clickable upload area */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="relative flex items-center gap-3 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all px-4 py-3 flex-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                    <span className="text-sm text-white/60">Uploading…</span>
                  </>
                ) : displayPhotoUrl ? (
                  <>
                    <img
                      src={displayPhotoUrl}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
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
                      Upload from device
                    </span>
                  </>
                )}
              </button>

              {/* Remove button (only shown if photo is set) */}
              {displayPhotoUrl && !uploading && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="flex-shrink-0 text-xs text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-300/50 rounded-lg px-3 py-2 transition-colors"
                >
                  Remove
                </button>
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

            {/* Error message */}
            {uploadError && (
              <p className="text-xs text-red-400 mt-1">{uploadError}</p>
            )}

            <p className="text-xs text-white/30">
              JPG, PNG, GIF or WebP · Max 5MB
            </p>
          </div>

          {displayPhotoUrl ? (
            /* ── Profile Photo Preview Circle & Info ── */
            <div className="flex flex-col items-center space-y-4 py-6 bg-black/20 p-4 rounded-xl border border-white/5">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-purple-500 shadow-lg">
                <img src={displayPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              {pendingFile ? (
                <p className="text-sm font-semibold text-purple-400 text-center">
                  New photo selected! Press &quot;Finish editing&quot; below to save and upload.
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
                  or choose
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <ColorPicker
                label={t("settings.account.profile.firstColor")}
                value={props.colorA}
                onInput={props.setColorA}
              />
              <ColorPicker
                label={t("settings.account.profile.secondColor")}
                value={props.colorB}
                onInput={props.setColorB}
              />
              <IconPicker
                label={t("settings.account.profile.userIcon")}
                value={props.userIcon}
                onInput={props.setUserIcon}
              />
            </>
          )}
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <Button theme="secondary" className="!px-10" onClick={handleCancel} disabled={uploading}>
            Cancel
          </Button>
          <Button theme="purple" className="!px-10" onClick={handleFinishEditing} loading={uploading}>
            {t("settings.account.profile.finish")}
          </Button>
        </div>
      </ModalCard>
    </Modal>
  );
}
