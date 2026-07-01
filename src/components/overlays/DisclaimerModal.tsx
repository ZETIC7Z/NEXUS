import { FancyModal } from "@/components/overlays/Modal";
import { Paragraph } from "@/components/utils/Text";

export function DisclaimerModal(props: { id: string }) {
  return (
    <FancyModal id={props.id} title="Legal Disclaimer for Nexus" size="lg">
      <div className="space-y-6 text-gray-300">
        <div>
          <h3 className="text-white font-bold mb-2">
            General Content Aggregation
          </h3>
          <Paragraph>
            Nexus operates strictly as a content aggregator and search engine
            for media available on the internet. Nexus does not stream, host, or
            upload any movies, videos, or media files on its own servers or
            systems. All content and metadata provided are indexed from
            third-party services, external websites, and publicly available
            sources.
          </Paragraph>
        </div>

        <div>
          <h3 className="text-white font-bold mb-2">No File Hosting</h3>
          <Paragraph>
            We do not store any copyrighted material on our database or servers.
            Nexus merely provides a technical interface and links to content
            hosted and provided by third-party services. Consequently, Nexus has
            no control over the nature, availability, or legality of the content
            found on these external platforms.
          </Paragraph>
        </div>

        <div>
          <h3 className="text-white font-bold mb-2">
            Third-Party Content & External Links
          </h3>
          <Paragraph>
            Links to third-party providers are provided for informational and
            convenience purposes only. The inclusion of any link does not imply
            an endorsement or approval by Nexus of the content, products, or
            services offered by these third parties. Users assume all risks
            associated with accessing and using content from these external
            providers.
          </Paragraph>
        </div>

        <div>
          <h3 className="text-white font-bold mb-2">
            Copyright Concerns & DMCA Takedown Requests
          </h3>
          <Paragraph>
            Nexus respects the intellectual property rights of others. Since
            Nexus does not host any content, we are unable to remove material
            directly from the internet. If you are a copyright owner and believe
            your content is being used without authorization, please note:
          </Paragraph>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong className="text-white">Direct Action:</strong> You must
              contact the respective third-party content providers or hosting
              services directly to request the removal of the source files.
            </li>
            <li>
              <strong className="text-white">Nexus Indexing:</strong> If you
              wish to have a specific link removed from the Nexus search index,
              please provide a formal DMCA-compliant notice to our designated
              agent. However, removing the link from Nexus will not remove the
              actual content from the web.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold mb-2">Liability</h3>
          <Paragraph>
            Nexus shall not be held liable for any damages, legal issues, or
            losses arising from the use of this service or the content provided
            by third-party links. Use of Nexus constitutes your acknowledgment
            that you understand and agree to these terms.
          </Paragraph>
        </div>
      </div>
    </FancyModal>
  );
}
