import { useState } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { useNavigate } from "react-router-dom";

import { SubPageLayout } from "@/pages/layouts/SubPageLayout";
import { CredentialsCreatePart } from "@/pages/parts/auth/CredentialsCreatePart";
import { PassphraseDisplayPart } from "@/pages/parts/auth/PassphraseDisplayPart";
import { TrustBackendPart } from "@/pages/parts/auth/TrustBackendPart";
import { PageTitle } from "@/pages/parts/util/PageTitle";

interface RegistrationData {
  mnemonic: string;
  username: string;
}

function CaptchaProvider(props: { children: React.ReactNode }) {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_RECAPTCHA_KEY}
      language="en"
    >
      {props.children}
    </GoogleReCaptchaProvider>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    mnemonic: "",
    username: "",
  });

  return (
    <CaptchaProvider>
      <SubPageLayout>
        <PageTitle subpage k="global.pages.register" />
        {step === 0 ? (
          <TrustBackendPart
            onNext={() => {
              setStep(1);
            }}
          />
        ) : null}
        {step === 1 ? (
          <CredentialsCreatePart
            onNext={(data) => {
              setRegistrationData({
                mnemonic: data.mnemonic,
                username: data.username,
              });
              setStep(2);
            }}
          />
        ) : null}
        {step === 2 ? (
          <PassphraseDisplayPart
            mnemonic={registrationData.mnemonic}
            username={registrationData.username}
            onNext={() => {
              // New users go to profile selection first, then onboarding
              navigate("/profile-selection");
            }}
          />
        ) : null}
      </SubPageLayout>
    </CaptchaProvider>
  );
}
