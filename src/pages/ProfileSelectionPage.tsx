import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { editUser } from "@/backend/accounts/user";
import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { Heading1, Paragraph } from "@/components/utils/Text";
import { useBackendUrl } from "@/hooks/auth/useBackendUrl";
import { SubPageLayout } from "@/pages/layouts/SubPageLayout";
import { useAuthStore } from "@/stores/auth";

const PROFILE_ICONS = [
  Icons.USER, // cat
  Icons.STAR, // star
  Icons.CIRCLE_QUESTION, // question
  Icons.BOOKMARK, // bookmark
  Icons.RISING_STAR, // rising star
  Icons.FIRE, // fire
  Icons.CLAPPER_BOARD, // clapper
  Icons.FILM, // film
  Icons.PLAY, // play
  Icons.HEART, // heart
  Icons.BELL, // bell
  Icons.DOWNLOAD, // download
  Icons.UPLOAD, // upload
  Icons.SEARCH, // search
  Icons.HOME, // home
  Icons.MENU, // menu
  Icons.SETTINGS, // settings
  Icons.LOGOUT, // logout
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

  const handleSave = async () => {
    if (!account || !backendUrl) return;

    setLoading(true);
    try {
      const newProfile = {
        icon: selectedIcon,
        colorA: colorOne,
        colorB: colorTwo,
      };

      await editUser(backendUrl, account, {
        profile: newProfile,
      });
      updateProfile(newProfile);
      navigate("/onboarding");
    } catch (err) {
      console.error("Failed to save profile", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubPageLayout>
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <Heading1>Create Your Profile</Heading1>
            <Paragraph>
              Choose an icon and colors for your profile. You can change these
              anytime in settings.
            </Paragraph>
          </div>

          {/* Profile Preview */}
          <div className="flex justify-center">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colorOne}, ${colorTwo})`,
              }}
            >
              <Icon icon={selectedIcon} className="text-6xl text-white" />
            </div>
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
                  className={`p-4 rounded-lg border-2 transition-all ${selectedIcon === icon
                    ? "border-pill-highlight bg-pill-highlight/20"
                    : "border-dropdown-border hover:border-pill-highlight/50"
                    }`}
                >
                  <Icon icon={icon} className="text-2xl" />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Profile Color One</h3>
            <div className="grid grid-cols-6 gap-3">
              {PROFILE_COLORS.map((color) => (
                <button
                  type="button"
                  key={color.value}
                  onClick={() => setColorOne(color.value)}
                  className={`h-12 rounded-lg border-2 transition-all ${colorOne === color.value
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
                  className={`h-12 rounded-lg border-2 transition-all ${colorTwo === color.value
                    ? "border-white scale-110"
                    : "border-transparent hover:scale-105"
                    }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-6">
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
    </SubPageLayout>
  );
}
