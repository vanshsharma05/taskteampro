import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Privacy Policy — TeamTaskPro",
  description: "How TeamTaskPro collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" updated="July 2026">
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

      <h2>Google user data and Google Calendar</h2>
      <p>TeamTaskPro offers an optional integration with Google Calendar. If you sign in with Google or connect your Google Calendar, we request permission to view your calendars and events (<code>calendar.readonly</code>) and to create and manage events (<code>calendar.events</code>). We use this access solely to:</p>
      <ul>
        <li>Display your Google Calendar events alongside your tasks inside the app.</li>
        <li>Create a calendar event for a task when you choose to add it to your Google Calendar, and remove that event if you delete the task.</li>
      </ul>
      <p>Your Google Calendar data is processed in your browser and requested directly from Google&rsquo;s APIs. We do not store copies of your calendar events on our servers; we store only the identifier of events the app created on your behalf, so they can be removed when you delete the corresponding task. We do not use Google user data for advertising, do not sell it, and do not share it with third parties except as necessary to provide the features you request or as required by law. Humans do not read this data except with your explicit permission, where necessary for security purposes, or to comply with applicable law.</p>
      <p>TeamTaskPro&rsquo;s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
      <p>You can revoke TeamTaskPro&rsquo;s access to your Google account at any time from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Account permissions page</a>.</p>

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
