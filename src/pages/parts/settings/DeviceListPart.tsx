import { Globe, Laptop, Monitor, Smartphone, Tv } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAsyncFn } from "react-use";

import { SessionResponse } from "@/backend/accounts/auth";
import { base64ToBuffer, decryptData } from "@/backend/accounts/crypto";
import { removeSession } from "@/backend/accounts/sessions";
import { Button } from "@/components/buttons/Button";
import { Loading } from "@/components/layout/Loading";
import { SettingsCard } from "@/components/layout/SettingsCard";
import { SecondaryLabel } from "@/components/text/SecondaryLabel";
import { Heading2 } from "@/components/utils/Text";
import { useBackendUrl } from "@/hooks/auth/useBackendUrl";
import { useAuthStore } from "@/stores/auth";

export const signOutAllDevices = () => {
  const buttons = document.querySelectorAll(".logout-button");

  buttons.forEach((button) => {
    (button as HTMLElement).click();
  });
};

function getDeviceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("tv") || n.includes("smart tv"))
    return <Tv className="w-5 h-5" />;
  if (
    n.includes("android") ||
    n.includes("mobile") ||
    n.includes("phone") ||
    n.includes("samsung") ||
    n.includes("pixel")
  )
    return <Smartphone className="w-5 h-5" />;
  if (n.includes("ios") || n.includes("iphone") || n.includes("ipad"))
    return <Smartphone className="w-5 h-5" />;
  if (
    n.includes("mac") ||
    n.includes("windows") ||
    n.includes("linux") ||
    n.includes("desktop") ||
    n.includes("pc")
  )
    return <Monitor className="w-5 h-5" />;
  if (
    n.includes("chrome") ||
    n.includes("firefox") ||
    n.includes("safari") ||
    n.includes("edge")
  )
    return <Globe className="w-5 h-5" />;
  return <Laptop className="w-5 h-5" />;
}

export function Device(props: {
  name: string;
  id: string;
  isCurrent?: boolean;
  onRemove?: () => void;
  icon?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const url = useBackendUrl();
  const token = useAuthStore((s) => s.account?.token);
  const [result, exec] = useAsyncFn(async () => {
    if (!token) throw new Error("No token present");
    if (!url) throw new Error("No backend set");
    await removeSession(url, token, props.id);
    props.onRemove?.();
  }, [url, token, props.id]);

  return (
    <SettingsCard
      className="flex justify-between items-center"
      paddingClass="px-6 py-4"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/5 rounded-full text-white/80">
          {props.icon || <Laptop className="w-5 h-5" />}
        </div>
        <div className="font-medium">
          <SecondaryLabel>
            {props.isCurrent
              ? `${t("settings.account.devices.deviceNameLabel")} (Current)`
              : t("settings.account.devices.deviceNameLabel")}
          </SecondaryLabel>
          <p className="text-white flex items-center gap-2">{props.name}</p>
        </div>
      </div>
      {!props.isCurrent ? (
        <Button
          theme="danger"
          className="logout-button"
          loading={result.loading}
          onClick={exec}
        >
          {t("settings.account.devices.removeDevice")}
        </Button>
      ) : null}
    </SettingsCard>
  );
}

export function DeviceListPart(props: {
  loading?: boolean;
  error?: boolean;
  sessions: SessionResponse[];
  onChange?: () => void;
}) {
  const { t } = useTranslation();
  const seed = useAuthStore((s) => s.account?.seed);
  const sessions = props.sessions;
  const currentSessionId = useAuthStore((s) => s.account?.sessionId);

  const deviceListSorted = useMemo(() => {
    if (!seed) return [];

    // Decrypt all sessions
    const allDevices = sessions.map((session) => {
      let decryptedName: string;
      try {
        decryptedName = decryptData(session.device, base64ToBuffer(seed));
      } catch (error) {
        console.warn(
          `Failed to decrypt device name for session ${session.id}:`,
          error,
        );
        decryptedName = t("settings.account.devices.unknownDevice");
      }
      return {
        current: session.id === currentSessionId,
        id: session.id,
        name: decryptedName,
      };
    });

    // Deduplicate logic: Keep the current session, or the first one found for a given name
    const uniqueDevicesMap = new Map<string, (typeof allDevices)[0]>();

    allDevices.forEach((device) => {
      // Simple normalization for deduplication key
      const key = device.name.trim();

      if (!uniqueDevicesMap.has(key)) {
        uniqueDevicesMap.set(key, device);
      } else if (device.current) {
        // If the existing one isn't current, but this one IS, replace it
        uniqueDevicesMap.set(key, device);
      }
    });

    let list = Array.from(uniqueDevicesMap.values());

    list = list.sort((a, b) => {
      if (a.current) return -1;
      if (b.current) return 1;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [seed, sessions, currentSessionId, t]);

  if (!seed) return null;

  return (
    <div>
      <Heading2 border className="mt-0 mb-9">
        {t("settings.account.devices.title")}
      </Heading2>
      {props.loading ? (
        <Loading />
      ) : props.error && deviceListSorted.length === 0 ? (
        <p>{t("settings.account.devices.failed")}</p>
      ) : (
        <div className="space-y-5">
          {deviceListSorted.map((session) => (
            <Device
              name={session.name}
              id={session.id}
              key={session.id}
              isCurrent={session.current}
              onRemove={props.onChange}
              icon={getDeviceIcon(session.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
