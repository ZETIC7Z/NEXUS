import classNames from "classnames";
import React from "react";

import { Icon, Icons } from "@/components/Icon";
import { BiggerCenterContainer } from "@/components/layout/ThinContainer";
import {
  Heading1,
  Heading2,
  Heading3,
  Paragraph,
} from "@/components/utils/Text";
import { PageTitle } from "@/pages/parts/util/PageTitle";
import { conf } from "@/setup/config";

import { SubPageLayout } from "./layouts/SubPageLayout";
import { Link } from "./onboarding/utils";

export function shouldHaveLegalPage() {
  return !!conf().DMCA_EMAIL;
}

function LegalCard(props: {
  icon: Icons;
  subtitle: string;
  title: string;
  description: React.ReactNode;
  colorClass: string;
  gradientClass?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={classNames(
        "relative overflow-hidden bg-gradient-to-br from-onboarding-card/60 to-onboarding-card/30",
        "backdrop-blur-xl border border-white/10 rounded-2xl p-8",
        "transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:shadow-white/5",
        "group",
      )}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* 3D Icon with glow effect */}
        <div
          className={classNames(
            "w-16 h-16 rounded-2xl mb-6 flex items-center justify-center",
            "bg-gradient-to-br shadow-lg",
            props.gradientClass || "from-white/10 to-white/5",
          )}
        >
          <Icon
            icon={props.icon}
            className={classNames("text-3xl drop-shadow-lg", props.colorClass)}
          />
        </div>

        <Heading3
          className={classNames(
            "!mt-0 !mb-0 !text-xs uppercase tracking-widest font-semibold",
            props.colorClass,
          )}
        >
          {props.subtitle}
        </Heading3>
        <Heading2 className="!mb-0 !mt-2 !text-xl font-bold text-white">
          {props.title}
        </Heading2>
        <div className="!my-5 space-y-3 text-gray-300 leading-relaxed">
          {props.description}
        </div>
      </div>
      <div className="relative z-10">{props.children}</div>
    </div>
  );
}

export function LegalPage() {
  return (
    <SubPageLayout>
      <PageTitle subpage k="global.pages.legal" />

      {/* Background with faded NEXUS logo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.03]">
          <img
            src="/nexus-logo-full.png"
            alt=""
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <BiggerCenterContainer classNames="!pt-0 relative z-10">
        {/* Header with gradient text */}
        <div className="text-center mb-12">
          <Heading1 className="!mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Legal / DMCA
          </Heading1>
          <Paragraph className="text-gray-400 text-lg max-w-2xl mx-auto">
            Important information about our service, content policies, and legal
            responsibilities. NEXUS is committed to transparency and compliance.
          </Paragraph>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <LegalCard
            icon={Icons.SEARCH}
            subtitle="Service Model"
            title="How NEXUS Operates"
            colorClass="text-blue-400"
            gradientClass="from-blue-500/20 to-blue-600/10"
            description={
              <>
                <Paragraph>
                  NEXUS functions as a search engine and content aggregator that
                  indexes publicly available media from across the internet.
                </Paragraph>
                <Paragraph>
                  We don&apos;t host, store, or control any media files -
                  everything is sourced from external third-party websites that
                  are already publicly accessible.
                </Paragraph>
                <Paragraph>
                  Our automated systems simply provide links to content
                  that&apos;s already available online, without bypassing any
                  security measures.
                </Paragraph>
                <Link to="/about">Learn more about how NEXUS works →</Link>
              </>
            }
          />

          <LegalCard
            icon={Icons.CIRCLE_CHECK}
            subtitle="Copyright Policy"
            title="Content & Copyright"
            colorClass="text-emerald-400"
            gradientClass="from-emerald-500/20 to-emerald-600/10"
            description={
              <Paragraph>
                Since we don&apos;t host any content ourselves, all takedown
                requests must go directly to the websites that actually host the
                files.
                <br />
                <br />
                We respect intellectual property rights and will cooperate with
                valid legal requests within our technical capabilities.
                <br />
                <br />
                For content removal, please contact the original hosting
                platform - we cannot remove what we don&apos;t control.
              </Paragraph>
            }
          />

          <LegalCard
            icon={Icons.EYE_SLASH}
            subtitle="Data Protection"
            title="Privacy & Security"
            colorClass="text-violet-400"
            gradientClass="from-violet-500/20 to-violet-600/10"
            description={
              <Paragraph>
                User privacy is our priority. We don&apos;t collect, store, or
                track any personal information about our users.
                <br />
                <br />
                Optional encrypted cloud sync is available for bookmarks and
                watch history, but we never store personal identifying
                information.
                <br />
                <br />
                NEXUS is fully self-hostable and can be deployed on any server
                infrastructure.
              </Paragraph>
            }
          />

          <LegalCard
            icon={Icons.USER}
            subtitle="User Responsibilities"
            title="User Guidelines"
            colorClass="text-amber-400"
            gradientClass="from-amber-500/20 to-amber-600/10"
            description={
              <Paragraph>
                Users are responsible for ensuring their access complies with
                local laws and regulations in their jurisdiction.
                <br />
                <br />
                We strongly recommend using VPN services for enhanced privacy
                and security while browsing.
                <br />
                <br />
                Please respect intellectual property rights and be mindful of
                copyright laws in your area.
              </Paragraph>
            }
          />
        </div>

        {/* ZE Logo - Centered between sections */}
        <div className="flex justify-center my-16">
          <div className="relative">
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 blur-3xl bg-type-link/20 rounded-full scale-150" />
            <img
              src="/ze-logo.png"
              alt="Zeticuz"
              className="relative h-24 md:h-32 object-contain drop-shadow-2xl filter contrast-125 brightness-110"
              style={{
                filter:
                  "drop-shadow(0 0 30px rgba(229, 9, 20, 0.4)) drop-shadow(0 0 60px rgba(229, 9, 20, 0.2))",
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <LegalCard
            icon={Icons.WARNING}
            subtitle="Terms & Conditions"
            title="Service Terms"
            colorClass="text-rose-400"
            gradientClass="from-rose-500/20 to-rose-600/10"
            description={
              <Paragraph>
                NEXUS is a proprietary streaming platform developed by ZETICUZ.
                <br />
                <br />
                By using our platform, you acknowledge these terms and agree
                that we&apos;re not responsible for third-party content.
                <br />
                <br />
                We operate in good faith compliance with applicable laws and
                regulations. We are not liable for any damages or losses
                incurred while using our service.
              </Paragraph>
            }
          />

          <LegalCard
            icon={Icons.MAIL}
            subtitle="Legal Contact"
            title="Legal Inquiries"
            colorClass="text-cyan-400"
            gradientClass="from-cyan-500/20 to-cyan-600/10"
            description={
              <Paragraph>
                For legal matters related to specific content, please contact
                the hosting websites directly as they have control over their
                files.
                <br />
                <br />
                NEXUS operates within legal boundaries and cooperates with
                legitimate requests when technically feasible.
              </Paragraph>
            }
          >
            <div className="flex items-center gap-3 pt-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Icon icon={Icons.MAIL} className="text-cyan-400 text-lg" />
              </div>
              <div>
                <span className="text-gray-400 text-sm block">Contact</span>
                <a
                  href="mailto:samxerz.zeticuz@gmail.com"
                  className="text-type-link hover:text-white transition-colors duration-300 font-medium"
                >
                  samxerz.zeticuz@gmail.com
                </a>
              </div>
            </div>
          </LegalCard>
        </div>

        {/* Footer disclaimer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2024-2026 NEXUS by ZETICUZ. All rights reserved.</p>
          <p className="mt-2">
            NEXUS does not host any content. All media is sourced from
            third-party providers.
          </p>
        </div>
      </BiggerCenterContainer>
    </SubPageLayout>
  );
}
