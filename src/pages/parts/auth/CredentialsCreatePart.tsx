import { useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { Trans, useTranslation } from "react-i18next";
import { useAsyncFn } from "react-use";

import { generatePassphraseFromCredentials } from "@/backend/accounts/crypto";
import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import {
  LargeCard,
  LargeCardButtons,
  LargeCardText,
} from "@/components/layout/LargeCard";
import { MwLink } from "@/components/text/Link";
import { AuthInputBox } from "@/components/text-inputs/AuthInputBox";
import { useAuth } from "@/hooks/auth/useAuth";
import { useBackendUrl } from "@/hooks/auth/useBackendUrl";
import { useAuthStore } from "@/stores/auth";
import { useBookmarkStore } from "@/stores/bookmarks";
import { useProgressStore } from "@/stores/progress";

interface CredentialsCreatePartProps {
  hasCaptcha?: boolean;
  onNext?: (data: {
    username: string;
    password: string;
    mnemonic: string;
    nickname: string;
  }) => void;
}

export function CredentialsCreatePart(props: CredentialsCreatePartProps) {
  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, restore, importData } = useAuth();
  const progressItems = useProgressStore((store) => store.items);
  const bookmarkItems = useBookmarkStore((store) => store.bookmarks);
  const backendUrl = useBackendUrl();
  const { t: _t } = useTranslation();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const setAccountNickname = useAuthStore((s) => s.setAccountNickname);
  const setAccountUsername = useAuthStore((s) => s.setAccountUsername);

  const [result, execute] = useAsyncFn(
    async (
      inputNickname: string,
      inputUsername: string,
      inputPassword: string,
      inputConfirmPassword: string,
    ) => {
      // Validate inputs
      const validatedNickname = inputNickname.trim();
      if (validatedNickname.length < 2)
        throw new Error("Nickname must be at least 2 characters");

      const validatedUsername = inputUsername.trim();
      if (validatedUsername.length < 3)
        throw new Error("Username must be at least 3 characters");

      if (inputPassword.length < 6)
        throw new Error("Password must be at least 6 characters");

      if (inputPassword !== inputConfirmPassword)
        throw new Error("Passwords do not match");

      if (!backendUrl) throw new Error("No backend URL configured");

      // Get recaptcha token if needed
      let recaptchaToken: string | undefined;
      if (props.hasCaptcha) {
        recaptchaToken = executeRecaptcha
          ? await executeRecaptcha()
          : undefined;
        if (!recaptchaToken) throw new Error("Captcha verification failed");
      }

      // Generate passphrase from username and password
      const mnemonic = await generatePassphraseFromCredentials(
        validatedUsername,
        inputPassword,
      );

      // Register the account
      // Attempt to get a friendly device name from User Agent
      let deviceName = "Unknown Device";
      const ua = navigator.userAgent;
      if (ua.indexOf("Windows") !== -1) deviceName = "Windows PC";
      else if (ua.indexOf("Mac") !== -1) deviceName = "Macintosh";
      else if (ua.indexOf("Linux") !== -1) deviceName = "Linux PC";
      else if (ua.indexOf("Android") !== -1) deviceName = "Android Device";
      else if (ua.indexOf("iPhone") !== -1) deviceName = "iPhone";
      else if (ua.indexOf("iPad") !== -1) deviceName = "iPad";

      // Append browser logic if needed or just use the generic name + UA snippet?
      // The user wants "Android Samsung S8". This info is often in the UA for Android.
      // Simple extraction:
      if (ua.includes("Android")) {
        const match = ua.match(/Android\s([0-9.]+);.*;\s(.+)\sBuild/);
        if (match && match[2]) {
          deviceName = match[2]; // Model name theoretically
        }
      }

      const account = await register({
        mnemonic,
        userData: {
          device: deviceName,
          profile: {
            colorA: "#E50914",
            colorB: "#B20710",
            icon: "user",
          },
        },
        recaptchaToken,
      });

      if (!account) throw new Error("Username is already taken.");

      await importData(account, progressItems, bookmarkItems);
      await restore(account);

      // Store nickname and username locally
      setAccountNickname(validatedNickname);
      setAccountUsername(validatedUsername);

      props.onNext?.({
        nickname: validatedNickname,
        username: validatedUsername,
        password: inputPassword,
        mnemonic,
      });
    },
    [
      props,
      register,
      restore,
      backendUrl,
      executeRecaptcha,
      progressItems,
      bookmarkItems,
      importData,
      setAccountNickname,
      setAccountUsername,
    ],
  );

  return (
    <LargeCard>
      <LargeCardText title="Create Account">
        Create your NEXUS account to start watching.
      </LargeCardText>
      <div className="space-y-4">
        <AuthInputBox
          label="Nickname"
          value={nickname}
          autoComplete="nickname"
          name="nickname"
          onChange={setNickname}
          placeholder="Enter your nickname"
        />
        <AuthInputBox
          label="Username"
          value={username}
          autoComplete="username"
          name="username"
          onChange={setUsername}
          placeholder="Choose a username"
        />

        {/* Password with show/hide toggle */}
        <div className="relative">
          <AuthInputBox
            label="Password"
            value={password}
            autoComplete="new-password"
            name="password"
            onChange={setPassword}
            placeholder="Choose a password (min 6 characters)"
            passwordToggleable={false}
          />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
          >
            <Icon icon={showPassword ? Icons.EYE_SLASH : Icons.EYE} />
          </button>
        </div>

        {/* Confirm Password with show/hide toggle */}
        <div className="relative">
          <AuthInputBox
            label="Confirm Password"
            value={confirmPassword}
            autoComplete="new-password"
            name="confirmPassword"
            onChange={setConfirmPassword}
            placeholder="Confirm your password"
            passwordToggleable={false}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
          >
            <Icon icon={showConfirmPassword ? Icons.EYE_SLASH : Icons.EYE} />
          </button>
        </div>

        {result.error && !result.loading ? (
          <p className="text-authentication-errorText">
            {result.error.message}
          </p>
        ) : null}
      </div>

      <LargeCardButtons>
        <Button
          theme="purple"
          loading={result.loading}
          onClick={() => execute(nickname, username, password, confirmPassword)}
        >
          Create Account
        </Button>
      </LargeCardButtons>
      <p className="text-center mt-6">
        <Trans i18nKey="auth.hasAccount">
          <MwLink to="/login">.</MwLink>
        </Trans>
      </p>
    </LargeCard>
  );
}
