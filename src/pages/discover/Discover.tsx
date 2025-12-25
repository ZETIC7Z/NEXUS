import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores/auth";
import { useOverlayStack } from "@/stores/interface/overlayStack";

import { SubPageLayout } from "../layouts/SubPageLayout";
import { FeaturedCarousel } from "./components/FeaturedCarousel";
import type { FeaturedMedia } from "./components/FeaturedCarousel";
import DiscoverContent from "./discoverContent";
import { PageTitle } from "../parts/util/PageTitle";

export function Discover() {
  const { showModal } = useOverlayStack();
  const navigate = useNavigate();
  const account = useAuthStore((s) => s.account);
  const isLoggedIn = !!account;

  // Redirect to landing page if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleShowDetails = (media: FeaturedMedia) => {
    showModal("discover-details", {
      id: Number(media.id),
      type: media.type,
    });
  };

  // Don't render if not logged in (will redirect)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <SubPageLayout>
      <Helmet>
        {/* Hide scrollbar */}
        <style type="text/css">{`
            html, body {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
          `}</style>
      </Helmet>

      <PageTitle subpage k="global.pages.discover" />

      <div className="!mt-[-170px]">
        {/* Featured Carousel */}
        <FeaturedCarousel onShowDetails={handleShowDetails} />
      </div>

      {/* Main Content */}
      <div className="relative z-20 px-4 md:px-10">
        <DiscoverContent />
      </div>
    </SubPageLayout>
  );
}
