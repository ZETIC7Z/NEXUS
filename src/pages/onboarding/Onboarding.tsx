import classNames from "classnames";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { Stepper } from "@/components/layout/Stepper";
import { BiggerCenterContainer } from "@/components/layout/ThinContainer";
import { VerticalLine } from "@/components/layout/VerticalLine";
import { DownloadModal } from "@/components/overlays/DownloadModal";
import {
  FancyModal,
  Modal,
  ModalCard,
  useModal,
} from "@/components/overlays/Modal";
import { Divider } from "@/components/utils/Divider";
import { Ol } from "@/components/utils/Ol";
import {
  Heading1,
  Heading2,
  Heading3,
  Paragraph,
} from "@/components/utils/Text";
import { MinimalPageLayout } from "@/pages/layouts/MinimalPageLayout";
import {
  useNavigateOnboarding,
  useRedirectBack,
} from "@/pages/onboarding/onboardingHooks";
import {
  Card,
  CardContent,
  Link,
  MiniCardContent,
} from "@/pages/onboarding/utils";
import { PageTitle } from "@/pages/parts/util/PageTitle";
import { conf } from "@/setup/config";
import { useOnboardingStore } from "@/stores/onboarding";
import { usePreferencesStore } from "@/stores/preferences";
import { getProxyUrls } from "@/utils/proxyUrls";

import { FebboxSetup } from "../parts/settings/ConnectionsPart";

function Item(props: { title: string; children: React.ReactNode }) {
  return (
    <>
      <p className="text-white mb-2 font-medium">{props.title}</p>
      <div className="text-type-text">{props.children}</div>
    </>
  );
}

/* ─── Info Modal Shell (reusable for both Extension & Zeticuz modals) ─── */
function OnboardingInfoModal(props: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}) {
  if (!props.isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={props.onClose}
      role="presentation"
    >
      <div
        className="relative bg-[#0d0d0f] border border-white/10 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={props.onClose}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors z-10"
          title="Close"
          aria-label="Close"
        >
          <Icon icon={Icons.X} />
        </button>

        <div className="p-6 md:p-8">
          {/* Golden Title */}
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 mb-1 uppercase text-center">
            {props.title}
          </h2>
          <p className="text-xs uppercase tracking-[0.2em] text-white font-semibold mb-6 text-center opacity-70">
            {props.subtitle}
          </p>

          {/* Content */}
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-6 md:p-8 mb-6 text-sm text-gray-300 leading-relaxed shadow-inner">
            {props.children}
          </div>

          {/* Glowing Action Button */}
          <button
            type="button"
            onClick={props.onAction}
            className="w-full py-4 px-6 rounded-xl font-bold text-sm uppercase tracking-widest text-[#d97706] border border-[#d97706]/30 hover:bg-[#d97706]/10 transition-all duration-300 flex items-center justify-center gap-2"
          >
            {props.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const navigate = useNavigateOnboarding();
  const skipModal = useModal("skip");
  const infoModal = useModal("info");
  const { completeAndRedirect } = useRedirectBack();
  const { t } = useTranslation();
  const setUseZeticuzPlayer = useOnboardingStore((s) => s.setUseZeticuzPlayer);
  const noProxies = getProxyUrls().length === 0;
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isZeticuzModalOpen, setIsZeticuzModalOpen] = useState(false);

  return (
    <MinimalPageLayout>
      <PageTitle subpage k="global.pages.onboarding" />
      <Modal id={skipModal.id}>
        <ModalCard>
          <Heading1 className="!mt-0 !mb-4 !text-2xl">
            {t("onboarding.defaultConfirm.title")}
          </Heading1>
          <Paragraph className="!mt-1 !mb-12">
            {t("onboarding.defaultConfirm.description")}
          </Paragraph>
          <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-between">
            <Button theme="secondary" onClick={skipModal.hide}>
              {t("onboarding.defaultConfirm.cancel")}
            </Button>
            <Button theme="purple" onClick={() => completeAndRedirect()}>
              {t("onboarding.defaultConfirm.confirm")}
            </Button>
          </div>
        </ModalCard>
      </Modal>
      <FancyModal
        id={infoModal.id}
        title={t("onboarding.start.moreInfo.title")}
        size="xl"
      >
        <Trans
          i18nKey="onboarding.start.moreInfo.explainer.intro"
          className="pb-4"
        />
        <div className="flex flex-col gap-4 md:flex-row py-8">
          <div className="md:w-1/2">
            <Heading3 className="font-normal">
              <Trans i18nKey="onboarding.start.moreInfo.recommended.title" />
            </Heading3>
            <Trans i18nKey="onboarding.start.moreInfo.recommended.subtitle" />
            <div className="space-y-4 pt-8 bg-mediaCard-hoverAccent/10 rounded-xl p-10 mt-6 mr-2 min-w-[20rem]">
              <Item
                title={t("onboarding.start.moreInfo.recommended.desktop.title")}
              >
                <Trans i18nKey="onboarding.start.moreInfo.recommended.desktop.description" />
              </Item>
              <Item
                title={t("onboarding.start.moreInfo.recommended.iOS.title")}
              >
                <Trans i18nKey="onboarding.start.moreInfo.recommended.iOS.description" />
              </Item>
              <Item
                title={t("onboarding.start.moreInfo.recommended.android.title")}
              >
                <Trans i18nKey="onboarding.start.moreInfo.recommended.android.description" />
              </Item>
            </div>
          </div>
          <div className="inline md:hidden">
            <Divider />
          </div>
          <div>
            <Ol
              items={[
                <Item
                  title={t("onboarding.start.moreInfo.explainer.extension")}
                >
                  {t(
                    "onboarding.start.moreInfo.explainer.extensionDescription",
                  )}
                </Item>,
                <Item title={t("onboarding.start.moreInfo.explainer.proxy")}>
                  {t("onboarding.start.moreInfo.explainer.proxyDescription")}
                </Item>,
                <Item title={t("onboarding.start.moreInfo.explainer.default")}>
                  {t("onboarding.start.moreInfo.explainer.defaultDescription")}
                </Item>,
              ].filter(Boolean)}
            />
            {conf().ALLOW_FEBBOX_KEY && (
              <div className="pt-12 pl-[3.2rem]">
                <Item
                  title={t("onboarding.start.moreInfo.explainer.fedapi.fedapi")}
                >
                  {t(
                    "onboarding.start.moreInfo.explainer.fedapi.fedapiDescription",
                  )}
                </Item>
              </div>
            )}
          </div>
        </div>
        <div>
          <Trans i18nKey="onboarding.start.moreInfo.explainer.outro">
            <a
              href="https://discord.com/invite/7z6znYgrTG"
              title="Discord server"
              aria-label="Discord server"
              target="_blank"
              rel="noopener noreferrer"
              className="text-type-link"
            >
              Discord
            </a>
          </Trans>
        </div>
      </FancyModal>

      {/* ─── Extension Info Modal ─── */}
      <OnboardingInfoModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        title="NEXUS EXTENSION"
        subtitle="WEB EXTENSION WEB BROWSER"
        actionLabel="[ Install Nexus Player Extension → ]"
        onAction={() => {
          setIsExtensionModalOpen(false);
          setUseZeticuzPlayer(false);
          navigate("/onboarding/extension");
        }}
      >
        <div className="space-y-4">
          <p className="text-white font-medium">Nexus App Users</p>
          <p>
            If you already have the Nexus App installed on your device, you do
            not need to install this extension. The app includes all extension
            features by default. Simply select the &quot;Continue&quot; button
            on the extension page to start watching.
          </p>

          <p className="text-white font-medium mt-4">
            Compatibility &amp; Mobile Users
          </p>
          <ul className="list-disc pl-5 space-y-3">
            <li>
              <span className="text-white font-medium">Web Browsers:</span> The
              extension is required for those watching via a desktop or laptop
              web browser.
            </li>
            <li>
              <span className="text-white font-medium">Mobile Users:</span> Most
              mobile browsers (especially Chrome) do not support extensions. For
              the best experience, we recommend downloading the Nexus App
              directly to your device.
            </li>
            <li>
              <span className="text-white font-medium">
                Mobile Browser Preference:
              </span>{" "}
              If you prefer using a mobile browser, use Firefox, as it supports
              extensions.
            </li>
            <li>
              <span className="text-white font-medium">Alternative:</span> If
              you must watch via a mobile web browser without the app, we
              recommend using the Zeticuz Player.
            </li>
          </ul>
        </div>
      </OnboardingInfoModal>

      {/* ─── Zeticuz Player Info Modal ─── */}
      <OnboardingInfoModal
        isOpen={isZeticuzModalOpen}
        onClose={() => setIsZeticuzModalOpen(false)}
        title="ZETICUZ PLAYER"
        subtitle="ALTERNATIVE EMBED MOVIE SOURCE"
        actionLabel="CONTINUE USING ZETICUZ →"
        onAction={() => {
          setIsZeticuzModalOpen(false);
          setUseZeticuzPlayer(true);
          completeAndRedirect();
        }}
      >
        <div className="space-y-4">
          <p className="text-white font-medium">
            Instant Play | No Setup Required
          </p>
          <p>
            Powered by direct embed sources, this player is ready to use
            immediately with zero configuration and no browser extensions
            required. It is the perfect, hassle-free choice for a seamless
            movie-watching experience.
          </p>

          <p className="mt-4">
            <span className="text-amber-500 italic">Note:</span> Latest TV
            series and anime episodes may occasionally experience delays or be
            unavailable on this specific player.
          </p>

          <p className="text-white font-medium mt-4">
            Want the Full Library? Use NEXUS
          </p>
          <p>
            For complete, up-to-date access to all TV series and anime episodes,
            we recommend the NEXUS ecosystem:
          </p>

          <ul className="list-disc pl-5 space-y-3">
            <li>
              <span className="text-white font-medium">On Web Browser:</span>{" "}
              Install the NEXUS Extension to unlock full episodic access and
              additional sources.
            </li>
            <li>
              <span className="text-white font-medium">On NEXUS PC App:</span>{" "}
              Enjoy a built-in experience! The extension is already
              integrated—simply ignore the prompt, proceed to the main player,
              and click Continue.
            </li>
          </ul>
        </div>
      </OnboardingInfoModal>

      <BiggerCenterContainer>
        <Stepper steps={2} current={1} className="mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr,1fr] gap-8 mt-8">
          {/* Left Column: Text & Player Options */}
          <div className="flex flex-col gap-8">
            <div className="max-w-xl">
              <Heading2 className="!mt-0 !text-3xl">
                {t("onboarding.start.title")}
              </Heading2>
              <Paragraph className="mb-0">
                {t("onboarding.start.explainer")}
                <div
                  className="pt-4 flex cursor-pointer items-center text-type-link outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                  onClick={() => infoModal.show()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      infoModal.show();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Trans i18nKey="onboarding.start.moreInfo.button" />
                  <Icon className="pl-2" icon={Icons.CIRCLE_QUESTION} />
                </div>
              </Paragraph>
            </div>

            {/* Player Selection Cards */}
            <div className="flex flex-col lg:flex-row w-full gap-4">
              <Card
                onClick={() => setIsExtensionModalOpen(true)}
                className="flex-1 min-w-0"
              >
                <CardContent
                  colorClass="!text-amber-400"
                  title="NEXUS PLAYER"
                  subtitle="WITH SOURCE EXTENSION"
                  description="Use browser extension to gain access to additional sources!"
                >
                  <Link className="!text-amber-400 font-bold ml-0 mt-2 block">
                    Install extension &rarr;
                  </Link>
                </CardContent>
              </Card>

              <div className="hidden lg:flex flex-col items-center justify-center pointer-events-none opacity-50">
                <div className="w-px h-10 bg-white/20" />
                <span className="text-[10px] uppercase font-bold py-2">OR</span>
                <div className="w-px h-10 bg-white/20" />
              </div>

              <Card
                onClick={() => setIsZeticuzModalOpen(true)}
                className="flex-1 min-w-0"
              >
                <CardContent
                  colorClass="!text-amber-400"
                  title="ZETICUZ PLAYER"
                  subtitle="DIRECT EMBED SOURCE"
                  description="Perfect for mobile/TV or if you can't install extensions."
                />
              </Card>
            </div>
          </div>

          {/* Right Column: Branding & Installation */}
          <div className="hidden md:flex flex-col items-center justify-center pt-8 border-l border-white/5 pl-8 w-full max-w-sm">
            <img
              src="/nexus-logo-gold.png"
              className="w-72 h-auto drop-shadow-[0_0_30px_rgba(251,191,36,0.2)] mb-8"
              alt="NEXUS"
            />

            <button
              type="button"
              className="group relative bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-bold py-5 px-10 rounded-xl flex flex-col items-center gap-1 transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(251,191,36,0.4)]"
              onClick={() => setIsDownloadOpen(true)}
            >
              <div className="flex items-center gap-3 text-lg whitespace-nowrap">
                <Icon icon={Icons.DOWNLOAD} />
                INSTALL NEXUS TO DEVICE
              </div>
              <span className="text-[10px] opacity-90 font-medium">
                Windows, Linux, macOS, Android
              </span>
              <div className="absolute inset-0 rounded-xl bg-amber-400 opacity-20 group-hover:opacity-40 blur-xl transition-opacity animate-pulse" />
            </button>

            <div className="flex gap-6 mt-6 opacity-60 grayscale hover:grayscale-0 transition-all">
              {[
                { i: Icons.WINDOWS, n: "Windows" },
                { i: Icons.APPLE, n: "macOS" },
                { i: Icons.LINUX, n: "Linux" },
                { i: Icons.ANDROID, n: "Android" },
              ].map((os) => (
                <div key={os.n} className="flex flex-col items-center gap-1">
                  <Icon icon={os.i} className="text-xl" />
                  <span className="text-[9px] uppercase font-bold tracking-tighter">
                    {os.n}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex w-full flex-col gap-4 pb-6 mt-12">
          <div className="flex flex-col items-center mb-10">
            <img
              src="/nexus-logo-gold.png"
              className="w-56 h-auto drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] mb-6"
              alt="NEXUS"
            />
            <button
              type="button"
              className="group relative bg-gradient-to-b from-amber-400 to-amber-600 text-black font-bold py-4 px-8 rounded-xl flex flex-col items-center gap-1 shadow-[0_0_25px_rgba(251,191,36,0.4)] w-full max-w-xs transition-all active:scale-95"
              onClick={() => setIsDownloadOpen(true)}
            >
              <div className="flex items-center gap-2 text-base font-black uppercase">
                <Icon icon={Icons.DOWNLOAD} />
                Install Nexus to Device
              </div>
              <span className="text-[9px] opacity-80 font-bold uppercase tracking-tighter">
                Android, Windows, iOS
              </span>
            </button>
          </div>
        </div>

        {(conf().ALLOW_FEBBOX_KEY || conf().ALLOW_DEBRID_KEY) === true && (
          <Heading3 className="text-white font-bold mb-3 mt-6">
            {t("onboarding.start.options.addons.title")}
          </Heading3>
        )}
        <div className="mt-6">
          <FebboxSetup
            febboxKey={usePreferencesStore((s) => s.febboxKey)}
            setFebboxKey={(val) => {
              const setter = usePreferencesStore.getState().setFebboxKey;
              if (typeof val === "function") {
                setter(val(usePreferencesStore.getState().febboxKey));
              } else {
                setter(val);
              }
            }}
            mode="onboarding"
          />
        </div>
      </BiggerCenterContainer>
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </MinimalPageLayout>
  );
}
