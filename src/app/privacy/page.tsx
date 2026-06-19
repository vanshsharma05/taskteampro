import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Privacy Policy — TeamTaskPro",
  description: "How TeamTaskPro collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" updated="June 2026">
      <p>This Privacy Policy explains how TeamTaskPro (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;the Service&rdquo;) collects, uses, and protects information when you use our website and application. By using TeamTaskPro, you agree to the practices described here.</p>

      <h2>Information we collect</h2>
      <p>We collect the information you provide and the information needed to operate the Service:</p>
      <ul>
        <li>Account information, such as your email address and password, used to create and secure your account.</li>
        <li>Workspace content, such as the tasks, descriptions, deadlines, team members, and company details you add.</li>
        <li>Usage information, such as basic logs and activity needed to keep the Service running reliably.</li>
      </ul>

      <h2>How we use information</h2>
      <p>We use the information we collect to provide and maintain the Service, to authenticate your account, to display your tasks and team activity, to respond to your requests, and to improve and secure the product. We do not sell your personal information.</p>

      <h2>How information is stored</h2>
      <p>Your data is stored using our infrastructure and database provider, Supabase, which hosts the Service&rsquo;s data on its secure cloud platform. We rely on industry-standard safeguards to protect information in transit and at rest, though no method of transmission or storage is completely secure.</p>

      <h2>Sharing</h2>
      <p>We share information only with the service providers that help us operate TeamTaskPro, such as our hosting and database provider, and where required by law. Within a company workspace, the content you create may be visible to other members and administrators of that workspace.</p>

      <h2>Data retention</h2>
      <p>We keep your information for as long as your account is active or as needed to provide the Service. You may request deletion of your account and associated data by contacting us.</p>

      <h2>Your rights</h2>
      <p>Depending on your location, you may have the right to access, correct, export, or delete your personal information. To make a request, contact us at the email below and we will respond within a reasonable period.</p>

      <h2>Children</h2>
      <p>TeamTaskPro is intended for use by businesses and is not directed to children under the age of 16. We do not knowingly collect personal information from children.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this Privacy Policy from time to time. When we do, we will revise the &ldquo;Last updated&rdquo; date above. Continued use of the Service after changes take effect constitutes acceptance of the updated policy.</p>

      <h2>Contact</h2>
      <p>If you have questions about this Privacy Policy, contact us at <a href="mailto:hello@teamtaskpro.com">hello@teamtaskpro.com</a>.</p>
    </LegalDoc>
  );
}
