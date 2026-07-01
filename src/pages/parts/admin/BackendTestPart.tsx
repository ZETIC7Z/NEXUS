import { useState } from "react";
import { useAsyncFn } from "react-use";

import { MetaResponse, getBackendMeta } from "@/backend/accounts/meta";
import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { Box } from "@/components/layout/Box";
import { Divider } from "@/components/utils/Divider";
import { Heading2 } from "@/components/utils/Text";
import { conf } from "@/setup/config";

interface TestStatus {
  hasTested: boolean;
  success: boolean;
  errorText: string;
  value: MetaResponse | null;
}

export function BackendTestPart() {
  const urls = conf().BACKEND_URLS;

  const [statusMap, setStatusMap] = useState<Record<string, TestStatus>>({
    "https://movies.dovetechnology.org": { hasTested: false, success: false, errorText: "", value: null },
    "https://court.fontaine.lol": { hasTested: false, success: false, errorText: "", value: null }
  });

  const [testState, runTests] = useAsyncFn(async () => {
    const defaultUrls = ["https://movies.dovetechnology.org", "https://court.fontaine.lol"];
    for (const url of defaultUrls) {
      try {
        const meta = await getBackendMeta(url);
        setStatusMap(prev => ({
          ...prev,
          [url]: { hasTested: true, success: true, errorText: "", value: meta }
        }));
      } catch (err) {
        setStatusMap(prev => ({
          ...prev,
          [url]: {
            hasTested: true,
            success: false,
            errorText: "Failed to connect to backend server.",
            value: null
          }
        }));
      }
    }
  }, [setStatusMap]);

  const displayUrl = (url: string) => {
    if (url === "https://movies.dovetechnology.org") return "https://backend.spectrum.com";
    if (url === "https://court.fontaine.lol") return "https://backend.reaper.com";
    return url;
  };

  return (
    <>
      <Heading2 className="mb-8 mt-12">Backend API test</Heading2>
      <div className="space-y-6">
        {Object.entries(statusMap).map(([url, status]) => (
          <Box key={url}>
            <div>
              <div className="flex-1">
                <p className="mb-4">
                  <span className="inline-block w-36 text-white font-medium">Backend:</span>
                  <span className="font-mono text-pink-400">{displayUrl(url)}</span>
                </p>
                {status.hasTested && status.success ? (
                  <>
                    <p>
                      <span className="inline-block w-36 text-white font-medium">Version:</span>
                      {status.value?.version}
                    </p>
                    <p>
                      <span className="inline-block w-36 text-white font-medium">Backend name:</span>
                      {status.value?.name ? "ZETICUZ BACKEND" : "Not set"}
                    </p>
                    <p>
                      <span className="inline-block w-36 text-white font-medium">Description:</span>
                      {status.value?.description ?? "Not set"}
                    </p>
                    <p>
                      <span className="inline-block w-36 text-white font-medium">Captcha enabled:</span>
                      {status.value?.hasCaptcha ? "Yes" : "No"}
                    </p>
                    <Divider />
                  </>
                ) : null}
              </div>
            </div>
            <div className="w-full flex gap-6 justify-between items-center mt-2">
              {!status.hasTested ? (
                <p>Run the test to validate this backend</p>
              ) : status.success ? (
                <p className="flex items-center text-md">
                  <Icon
                    icon={Icons.CIRCLE_CHECK}
                    className="text-video-scraping-success mr-2"
                  />
                  Backend is working as expected
                </p>
              ) : (
                <div>
                  <p className="text-white font-bold w-full mb-3 flex items-center gap-1">
                    <Icon
                      icon={Icons.CIRCLE_EXCLAMATION}
                      className="text-video-scraping-error mr-2"
                    />
                    Backend is not working
                  </p>
                  <p className="text-xs text-red-400">{status.errorText}</p>
                </div>
              )}
            </div>
          </Box>
        ))}
        <div className="flex justify-end pt-2">
          <Button
            theme="purple"
            loading={testState.loading}
            className="whitespace-nowrap"
            onClick={runTests}
          >
            Test backend
          </Button>
        </div>
      </div>
    </>
  );
}
