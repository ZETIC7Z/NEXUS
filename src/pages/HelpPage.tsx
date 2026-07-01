import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { CenterContainer } from "@/components/layout/ThinContainer";
import { Heading1, Heading2, Paragraph } from "@/components/utils/Text";
import { MinimalPageLayout } from "@/pages/layouts/MinimalPageLayout";
import { PageTitle } from "@/pages/parts/util/PageTitle";

interface BrowserInfo {
  name: string;
  emoji: string;
  userscriptManager: {
    name: string;
    url: string;
  };
}

function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;

  if (userAgent.includes("Firefox")) {
    return {
      name: "Firefox",
      emoji: "🦊",
      userscriptManager: {
        name: "Violentmonkey",
        url: "https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/",
      },
    };
  }

  if (userAgent.includes("Edg")) {
    return {
      name: "Microsoft Edge",
      emoji: "🌐",
      userscriptManager: {
        name: "Tampermonkey",
        url: "https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd",
      },
    };
  }

  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    return {
      name: "Safari",
      emoji: "🧭",
      userscriptManager: {
        name: "Userscripts",
        url: "https://apps.apple.com/app/userscripts/id1463298887",
      },
    };
  }

  return {
    name: "Chrome",
    emoji: "🌐",
    userscriptManager: {
      name: "Tampermonkey",
      url: "https://www.tampermonkey.net/",
    },
  };
}

export function HelpPage() {
  const navigate = useNavigate();
  const [browser] = useState<BrowserInfo>(detectBrowser());
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <MinimalPageLayout>
      <PageTitle subpage k="global.pages.help" />
      <CenterContainer>
        <div className="space-y-8 py-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <Heading1>How to Use NEXUS</Heading1>
            <Paragraph>
              Complete step-by-step guide for streaming on mobile and desktop
            </Paragraph>
          </div>

          {/* Browser Detection */}
          <div className="bg-pill-background rounded-xl p-6 text-center">
            <p className="text-type-dimmed mb-2">
              We detected you&apos;re using:
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl">{browser.emoji}</span>
              <div className="text-left">
                <p className="font-bold text-xl">{browser.name}</p>
                <p className="text-sm text-type-dimmed">
                  We&apos;ll show you {browser.userscriptManager.name}{" "}
                  instructions
                </p>
              </div>
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="space-y-6">
            <Heading2>Installation Steps</Heading2>

            {/* Step 1 */}
            <div
              className={`border-2 rounded-xl p-6 transition-all ${
                currentStep === 1
                  ? "border-pill-highlight bg-pill-highlight/10 shadow-lg"
                  : "border-dropdown-border"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pill-background flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="font-bold text-lg">
                    Install {browser.userscriptManager.name}
                  </h3>
                  <p className="text-type-dimmed">
                    First, you need to install a userscript manager for your
                    browser.
                  </p>
                  <a
                    href={browser.userscriptManager.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button
                      theme="purple"
                      onClick={() => setCurrentStep(2)}
                      className="w-full sm:w-auto"
                    >
                      <Icon icon={Icons.DOWNLOAD} className="mr-2" />
                      Install {browser.userscriptManager.name}
                    </Button>
                  </a>
                  <p className="text-xs text-type-dimmed">
                    ✓ Click the button above to open your browser&apos;s
                    extension store
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`border-2 rounded-xl p-6 transition-all ${
                currentStep === 2
                  ? "border-pill-highlight bg-pill-highlight/10 shadow-lg"
                  : "border-dropdown-border"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pill-background flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="font-bold text-lg">
                    Install NEXUS Userscript
                  </h3>
                  <p className="text-type-dimmed">
                    After installing {browser.userscriptManager.name}, click
                    below to install the NEXUS userscript.
                  </p>
                  <a
                    href="https://raw.githubusercontent.com/p-stream/Userscript/main/p-stream.user.js"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button
                      theme="purple"
                      onClick={() => setCurrentStep(3)}
                      className="w-full sm:w-auto"
                    >
                      <Icon icon={Icons.DOWNLOAD} className="mr-2" />
                      Install NEXUS Userscript
                    </Button>
                  </a>
                  <div className="bg-dropdown-contentBackground rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium">What happens next:</p>
                    <ul className="text-sm text-type-dimmed space-y-1 list-disc list-inside">
                      <li>
                        {browser.userscriptManager.name} will open automatically
                      </li>
                      <li>You&apos;ll see the NEXUS script details</li>
                      <li>
                        Click &quot;Install&quot; button in{" "}
                        {browser.userscriptManager.name}
                      </li>
                      <li>The script will be installed instantly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`border-2 rounded-xl p-6 transition-all ${
                currentStep === 3
                  ? "border-pill-highlight bg-pill-highlight/10 shadow-lg"
                  : "border-dropdown-border"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pill-background flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="font-bold text-lg">
                    Refresh and Start Streaming!
                  </h3>
                  <p className="text-type-dimmed">
                    After installation, refresh this page to start streaming
                    movies and TV shows.
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
          </div>

          {/* Febbox Token Section */}
          <div className="border-2 border-dropdown-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Icon icon={Icons.KEY} className="text-3xl text-pill-highlight" />
              <Heading2 className="!mb-0">Febbox Token (Optional)</Heading2>
            </div>
            <p className="text-type-dimmed">
              NEXUS already includes a shared Febbox token, so you can stream
              immediately! However, if you have your own Febbox token, you can
              add it for better performance.
            </p>
            <div className="bg-dropdown-contentBackground rounded-lg p-4 space-y-3">
              <p className="font-medium">How to add your Febbox token:</p>
              <ol className="text-sm text-type-dimmed space-y-2 list-decimal list-inside">
                <li>Go to Settings → Connections</li>
                <li>Find the &quot;Febbox Token&quot; field</li>
                <li>Paste your token</li>
                <li>Click &quot;Test&quot; to verify</li>
                <li>Token will be saved automatically</li>
              </ol>
              <p className="text-xs text-type-dimmed">
                ℹ️ If you don&apos;t have a token, don&apos;t worry! The shared
                token works perfectly.
              </p>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="border-2 border-dropdown-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Icon
                icon={Icons.CIRCLE_QUESTION}
                className="text-3xl text-pill-highlight"
              />
              <Heading2 className="!mb-0">Troubleshooting</Heading2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">Extension not detected?</p>
                <ul className="text-sm text-type-dimmed space-y-1 list-disc list-inside">
                  <li>
                    Make sure {browser.userscriptManager.name} is installed
                  </li>
                  <li>Check that the NEXUS userscript is enabled</li>
                  <li>Try refreshing the page</li>
                  <li>Clear your browser cache</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Videos not playing?</p>
                <ul className="text-sm text-type-dimmed space-y-1 list-disc list-inside">
                  <li>Check your internet connection</li>
                  <li>Try a different provider/source</li>
                  <li>Disable any ad blockers temporarily</li>
                  <li>Make sure the userscript is running</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center pt-6">
            <Button theme="secondary" onClick={() => navigate("/discover")}>
              <Icon icon={Icons.ARROW_LEFT} className="mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </CenterContainer>
    </MinimalPageLayout>
  );
}
