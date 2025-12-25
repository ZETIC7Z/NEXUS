import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useAsyncFn, useInterval } from "react-use";

import { sendPage } from "@/backend/extension/messaging";
import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { Loading } from "@/components/layout/Loading";
import { Stepper } from "@/components/layout/Stepper";
import { CenterContainer } from "@/components/layout/ThinContainer";
import { Heading2, Paragraph } from "@/components/utils/Text";
import { MinimalPageLayout } from "@/pages/layouts/MinimalPageLayout";
import {
  useNavigateOnboarding,
  useRedirectBack,
} from "@/pages/onboarding/onboardingHooks";
import { Card, Link } from "@/pages/onboarding/utils";
import { PageTitle } from "@/pages/parts/util/PageTitle";
import { conf } from "@/setup/config";
import {
  ExtensionDetectionResult,
  detectExtensionInstall,
} from "@/utils/detectFeatures";
import { getExtensionState } from "@/utils/extension";
import type { ExtensionStatus } from "@/utils/extension";

interface BrowserInfo {
  name: string;
  emoji: string;
  violentmonkeyUrl: string;
}

function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;

  if (userAgent.includes("Firefox")) {
    return {
      name: "Firefox",
      emoji: "🦊",
      violentmonkeyUrl:
        "https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/",
    };
  }

  if (userAgent.includes("Edg")) {
    return {
      name: "Microsoft Edge",
      emoji: "🌐",
      violentmonkeyUrl:
        "https://microsoftedge.microsoft.com/addons/detail/violentmonkey/eeagobfjdenkkddmbclomhiblgggliao",
    };
  }

  // Chrome (default)
  return {
    name: "Chrome",
    emoji: "🌐",
    violentmonkeyUrl:
      "https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag",
  };
}

function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function RefreshBar() {
  const { t } = useTranslation();
  const reload = useCallback(() => {
    window.location.reload();
  }, []);
  return (
    <Card className="mt-4">
      <div className="flex items-center space-x-7">
        <p className="flex-1">{t("onboarding.extension.notDetecting")}</p>
        <Button theme="secondary" onClick={reload}>
          {t("onboarding.extension.notDetectingAction")}
        </Button>
      </div>
    </Card>
  );
}

export function ExtensionStatus(props: {
  status: ExtensionStatus;
  loading: boolean;
  showHelp?: boolean;
}) {
  const { t } = useTranslation();
  const [lastKnownStatus, setLastKnownStatus] = useState(props.status);
  useEffect(() => {
    if (!props.loading) setLastKnownStatus(props.status);
  }, [props.status, props.loading]);

  let content: ReactNode = null;
  if (props.loading || props.status === "unknown")
    content = (
      <>
        <Loading />
        <p>{t("onboarding.extension.status.loading")}</p>
      </>
    );
  if (props.status === "disallowed" || props.status === "noperms")
    content = (
      <>
        <p>{t("onboarding.extension.status.disallowed")}</p>
        <Button
          onClick={() => {
            sendPage({
              page: "PermissionGrant",
              redirectUrl: window.location.href,
            });
          }}
          theme="purple"
          padding="md:px-12 p-2.5"
          className="mt-6"
        >
          {t("onboarding.extension.status.disallowedAction")}
        </Button>
      </>
    );
  else if (props.status === "failed")
    content = <p>{t("onboarding.extension.status.failed")}</p>;
  else if (props.status === "outdated")
    content = <p>{t("onboarding.extension.status.outdated")}</p>;
  else if (props.status === "success")
    content = (
      <p className="flex items-center">
        <Icon icon={Icons.CHECKMARK} className="text-type-success mr-4" />
        {t("onboarding.extension.status.success")}
      </p>
    );
  return (
    <>
      <Card>
        <div className="flex py-6 flex-col space-y-2 items-center justify-center">
          {content}
        </div>
      </Card>
      {lastKnownStatus === "unknown" ? <RefreshBar /> : null}
      {props.showHelp && props.status !== "success" ? (
        <Card className="mt-4">
          <div className="flex items-center space-x-7">
            <Icon icon={Icons.WARNING} className="text-type-danger text-2xl" />
            <p className="flex-1">
              <Trans
                i18nKey="onboarding.extension.extensionHelp"
                components={{
                  bold: <span className="text-white" />,
                }}
              />
            </p>
          </div>
        </Card>
      ) : null}
    </>
  );
}

interface ExtensionPageProps {
  status: ExtensionStatus;
  loading: boolean;
}

function DefaultExtensionPage(props: ExtensionPageProps) {
  const { t } = useTranslation();
  const [browser] = useState<BrowserInfo>(detectBrowser());
  const [isMobile] = useState<boolean>(isMobileDevice());

  return (
    <>
      <Heading2 className="!mt-0 !text-3xl max-w-[435px] text-center">
        {t("onboarding.extension.title")}
      </Heading2>
      <Paragraph className="max-w-[320px] mb-6 text-center">
        {t("onboarding.extension.explainer")}
      </Paragraph>

      {/* Browser Detection */}
      <div className="bg-pill-background rounded-xl p-6 text-center mb-6">
        <p className="text-type-dimmed mb-2">We detected:</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl">{browser.emoji}</span>
          <div className="text-left">
            <p className="font-bold text-xl">{browser.name}</p>
            <p className="text-sm text-type-dimmed">
              {isMobile ? "Mobile Device" : "Desktop Device"}
            </p>
          </div>
        </div>
      </div>

      {/* DESKTOP INSTALLATION - Auto-highlighted for PC users */}
      {!isMobile && (
        <div className="border-2 rounded-xl p-6 mb-6 transition-all border-pill-highlight bg-pill-highlight/10 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pill-background flex items-center justify-center font-bold text-lg">
              💻
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="font-bold text-xl">Desktop Installation</h3>
              <p className="text-type-dimmed">
                Install Violentmonkey extension directly from your
                browser&apos;s store:
              </p>
              <a
                href={browser.violentmonkeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button theme="purple" className="w-full sm:w-auto">
                  <Icon icon={Icons.DOWNLOAD} className="mr-2" />
                  Install Violentmonkey for {browser.name}
                </Button>
              </a>
              <div className="bg-dropdown-contentBackground rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">What happens next:</p>
                <ul className="text-sm text-type-dimmed space-y-1 list-disc list-inside">
                  <li>Browser store will open automatically</li>
                  <li>Click &quot;Add to {browser.name}&quot; button</li>
                  <li>Violentmonkey will be installed</li>
                  <li>Then install NEXUS userscript below</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE INSTALLATION - Auto-highlighted for mobile users */}
      {isMobile && (
        <div className="border-2 rounded-xl p-6 mb-6 transition-all border-pill-highlight bg-pill-highlight/10 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pill-background flex items-center justify-center font-bold text-lg">
              📱
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="font-bold text-xl">Mobile Installation</h3>
              <p className="text-type-dimmed mb-3">
                Follow these steps to use NEXUS on mobile:
              </p>

              {/* Step 1: Install Violentmonkey */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-pill-highlight flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <p className="font-medium">Install Violentmonkey</p>
                </div>
                <a
                  href={browser.violentmonkeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-dropdown-contentBackground rounded-lg hover:bg-dropdown-contentBackground/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{browser.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium">{browser.name}</p>
                      <p className="text-xs text-type-dimmed">Violentmonkey</p>
                    </div>
                    <Icon icon={Icons.EXTERNAL_LINK} className="text-sm" />
                  </div>
                </a>
              </div>

              {/* Step 2: Install NEXUS Userscript */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-pill-highlight flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <p className="font-medium">Install NEXUS Userscript</p>
                </div>
                <a
                  href="https://raw.githubusercontent.com/p-stream/Userscript/main/p-stream.user.js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-pill-background hover:bg-pill-backgroundHover rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon icon={Icons.DOWNLOAD} className="text-xl" />
                    <div className="flex-1">
                      <p className="font-medium">Click to Install</p>
                      <p className="text-xs text-type-dimmed">
                        Violentmonkey will open automatically
                      </p>
                    </div>
                    <Icon icon={Icons.EXTERNAL_LINK} className="text-sm" />
                  </div>
                </a>
              </div>

              {/* Step 3: Refresh */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-pill-highlight flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <p className="font-medium">Refresh Page</p>
                </div>
                <Button
                  theme="purple"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  <Icon icon={Icons.REFRESH} className="mr-2" />
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Install NEXUS Userscript - For desktop users after installing Violentmonkey */}
      {!isMobile && (
        <div className="border-2 rounded-xl p-6 mb-6 transition-all border-dropdown-border">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pill-background flex items-center justify-center font-bold text-lg">
              2
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="font-bold text-lg">Install NEXUS Userscript</h3>
              <p className="text-type-dimmed">
                After installing Violentmonkey, click below to install the NEXUS
                userscript.
              </p>
              <a
                href="https://raw.githubusercontent.com/p-stream/Userscript/main/p-stream.user.js"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button theme="purple" className="w-full sm:w-auto">
                  <Icon icon={Icons.DOWNLOAD} className="mr-2" />
                  Install NEXUS Userscript
                </Button>
              </a>
              <div className="bg-dropdown-contentBackground rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">What happens next:</p>
                <ul className="text-sm text-type-dimmed space-y-1 list-disc list-inside">
                  <li>Violentmonkey will open automatically</li>
                  <li>You'll see the NEXUS script details</li>
                  <li>Click &quot;Confirm installation&quot; button</li>
                  <li>The script will be installed instantly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refresh - For desktop users */}
      {!isMobile && (
        <div className="border-2 rounded-xl p-6 mb-6 transition-all border-dropdown-border">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pill-background flex items-center justify-center font-bold text-lg">
              3
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="font-bold text-lg">
                Refresh and Start Streaming!
              </h3>
              <p className="text-type-dimmed">
                After installation, refresh this page to start streaming movies
                and TV shows.
              </p>
              <Button
                theme="purple"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto"
              >
                <Icon icon={Icons.REFRESH} className="mr-2" />
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      )}

      <ExtensionStatus status={props.status} loading={props.loading} showHelp />
      <Link
        href="https://github.com/p-stream/extension"
        target="_blank"
        className="pt-4 !text-type-dimmed"
      >
        See extension source code
      </Link>
    </>
  );
}

function IosExtensionPage(_props: ExtensionPageProps) {
  const { t } = useTranslation();
  return (
    <>
      <Heading2 className="!mt-0 !text-3xl max-w-[435px]">
        {t("onboarding.extension.title")}
      </Heading2>
      <Paragraph className="max-w-[320px] mb-4">
        <Trans
          i18nKey="onboarding.extension.explainerIos"
          components={{ bold: <span className="text-white font-bold" /> }}
        />
      </Paragraph>
    </>
  );
}

export function OnboardingExtensionPage() {
  const { t } = useTranslation();
  const navigate = useNavigateOnboarding();
  const { completeAndRedirect } = useRedirectBack();
  const extensionSupport = useMemo(() => detectExtensionInstall(), []);

  const [{ loading, value }, exec] = useAsyncFn(
    async (triggeredManually: boolean = false) => {
      const status = await getExtensionState();
      if (status === "success" && triggeredManually) completeAndRedirect();
      return status;
    },
    [completeAndRedirect],
  );
  useInterval(exec, 1000);

  const componentMap: Record<
    ExtensionDetectionResult,
    typeof DefaultExtensionPage
  > = {
    chrome: DefaultExtensionPage,
    firefox: DefaultExtensionPage,
    ios: IosExtensionPage,
    unknown: DefaultExtensionPage,
  };
  const PageContent = componentMap[extensionSupport];

  return (
    <MinimalPageLayout>
      <PageTitle subpage k="global.pages.onboarding" />
      <CenterContainer>
        <Stepper steps={2} current={2} className="mb-12" />
        <PageContent loading={loading} status={value ?? "unknown"} />
        <div className="flex justify-between items-center mt-8">
          <Button onClick={() => navigate("/onboarding")} theme="secondary">
            {t("onboarding.extension.back")}
          </Button>
          {value === "success" ? (
            <Button onClick={() => exec(true)} theme="purple">
              {t("onboarding.extension.submit")}
            </Button>
          ) : null}
        </div>
      </CenterContainer>
    </MinimalPageLayout>
  );
}
