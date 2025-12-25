import { useEffect, useState } from "react";

import { FooterView } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { usePreferencesStore } from "@/stores/preferences";

export function HomeLayout(props: {
  showBg: boolean;
  children: React.ReactNode;
}) {
  const enableFeatured = usePreferencesStore((state) => state.enableFeatured);
  const [, setClearBackground] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setClearBackground(Boolean(enableFeatured) && window.scrollY < 600);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [enableFeatured]);

  return (
    <FooterView>
      <Navigation bg={enableFeatured ? true : props.showBg} />
      {props.children}
    </FooterView>
  );
}
