import { isAllowedExtensionVersion } from "@/backend/extension/compatibility";
import { extensionInfo } from "@/backend/extension/messaging";

export type ExtensionStatus =
  | "unknown"
  | "failed"
  | "disallowed"
  | "noperms"
  | "outdated"
  | "success";

export async function getExtensionState(): Promise<ExtensionStatus> {
  const info = await extensionInfo();
  if (!info) return "unknown"; // can't talk to extension
  if (!info.success) return "failed"; // extension failed to respond
  if (!isAllowedExtensionVersion(info.version)) return "outdated"; // extension is too old
  if (!info.allowed) return "disallowed"; // extension is installed but not enabled for this page
  if (!info.hasPermission) return "noperms"; // extension needs to grant permissions
  return "success"; // all good
}
