import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Terms of Service — TaskTeamPro",
  description: "The terms that govern your use of TaskTeamPro.",
};

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Service" updated="June 2026">
      <p>These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of TaskTeamPro (&ldquo;the Service&rdquo;). By creating an account or using the Service, you agree to these Terms. If you do not agree, please do not use the Service.</p>

      <h2>Using the Service</h2>
      <p>You must be at least 16 years old and able to form a binding agreement to use TaskTeamPro. You are responsible for the activity that happens under your account and for keeping your login credentials secure.</p>

      <h2>Your account</h2>
      <p>You agree to provide accurate information when creating an account and to keep it up to date. If you create a company workspace, you are responsible for the members you invite and the content created within it.</p>

      <h2>Acceptable use</h2>
      <p>You agree not to misuse the Service. This includes not attempting to disrupt or compromise the Service, not using it to store or share unlawful content, and not accessing data that does not belong to you or your workspace.</p>

      <h2>Your content</h2>
      <p>You retain ownership of the tasks, text, and other content you add to TaskTeamPro. You grant us the limited permission needed to store and display that content for the purpose of operating the Service for you and your workspace.</p>

      <h2>Availability</h2>
      <p>We work to keep the Service available and reliable, but we provide it on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We may modify, suspend, or discontinue features from time to time, and the Service may occasionally be unavailable for maintenance or for reasons outside our control.</p>

      <h2>Limitation of liability</h2>
      <p>To the maximum extent permitted by law, TaskTeamPro will not be liable for any indirect, incidental, or consequential damages, or for any loss of data or profits, arising from your use of the Service.</p>

      <h2>Termination</h2>
      <p>You may stop using the Service and close your account at any time. We may suspend or terminate access if these Terms are violated or if necessary to protect the Service or its users.</p>

      <h2>Changes to these Terms</h2>
      <p>We may update these Terms from time to time. When we do, we will revise the &ldquo;Last updated&rdquo; date above. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</p>

      <h2>Governing law</h2>
      <p>These Terms are governed by the laws of India, without regard to conflict-of-law principles. Any disputes will be subject to the courts of the applicable jurisdiction.</p>

      <h2>Contact</h2>
      <p>If you have questions about these Terms, contact us at <a href="mailto:hello@taskteampro.com">hello@taskteampro.com</a>.</p>
    </LegalDoc>
  );
}
