export default function Privacy() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-primary-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl">
            Last updated: February 18, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2>Introduction</h2>
            <p>
              Haulkind ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>

            <h2>Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>
              We collect personal information that you provide to us, including:
            </p>
            <ul>
              <li>Name, email address, and phone number</li>
              <li>Service address and location information</li>
              <li>Payment information (processed securely through our payment processor)</li>
              <li>Photos of items for removal (if you choose to provide them)</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>
              When you use our services, we automatically collect:
            </p>
            <ul>
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, time spent, clicks)</li>
              <li>Location data (with your permission, for service delivery and driver tracking)</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process your bookings and payments</li>
              <li>Connect you with drivers and facilitate service delivery</li>
              <li>Send you service updates, confirmations, and notifications</li>
              <li>Provide customer support</li>
              <li>Prevent fraud and enhance security</li>
              <li>Comply with legal obligations</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>

            <h2>Information Sharing</h2>
            <p>
              We share your information only in the following circumstances:
            </p>
            <ul>
              <li><strong>With Drivers:</strong> We share necessary information (name, phone, service address, job details) with the driver assigned to your booking</li>
              <li><strong>With Service Providers:</strong> We use third-party services for payment processing, SMS/email delivery, and analytics</li>
              <li><strong>For Legal Reasons:</strong> We may disclose information if required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
            </ul>
            <p>
              We do not sell your personal information to third parties.
            </p>

            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your information, including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Secure payment processing (PCI-DSS compliant)</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
            </ul>
            <p>
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>

            <h2>Your Rights and Choices</h2>
            <p>
              You have the following rights regarding your information:
            </p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update or correct your information</li>
              <li><strong>Deletion:</strong> Request deletion of your information (subject to legal requirements)</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
              <li><strong>Location:</strong> Disable location services in your device settings</li>
            </ul>
            <p>
              To exercise these rights, contact us at <a href="mailto:privacy@haulkind.com">privacy@haulkind.com</a>.
            </p>

            <h2>Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to:
            </p>
            <ul>
              <li>Remember your preferences</li>
              <li>Analyze site usage and improve our services</li>
              <li>Provide personalized content</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Disabling cookies may affect site functionality.
            </p>

            <h2>Third-Party Links</h2>
            <p>
              Our website may contain links to third-party sites. We are not responsible for their privacy practices. Please review their privacy policies.
            </p>

            <h2>Children's Privacy</h2>
            <p>
              Our services are not intended for children under 18. We do not knowingly collect information from children. If you believe we have collected information from a child, contact us immediately.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, contact us:
            </p>
            <ul>
              <li>Email: <a href="mailto:privacy@haulkind.com">privacy@haulkind.com</a></li>
              <li>Phone: (800) 555-1234</li>
              <li>Address: Haulkind, 123 Main Street, Philadelphia, PA 19103</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get a free quote in seconds.
          </p>
          <a 
            href="/quote"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            Get a Quote Now
          </a>
        </div>
      </section>
    </div>
  )
}
