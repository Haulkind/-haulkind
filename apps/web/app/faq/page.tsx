export default function FAQ() {
  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is Haulkind?',
          a: 'Haulkind is a platform that connects customers who need junk removed or moving help with local drivers who have trucks and vans. We offer transparent pricing, real-time tracking, and fair pay for drivers (60% of service price).',
        },
        {
          q: 'What areas do you serve?',
          a: 'We serve Pennsylvania, New York, and New Jersey. Check our service areas page for specific cities and coverage. Enter your address in the quote tool to verify coverage.',
        },
        {
          q: 'Do I need to create an account?',
          a: 'No account needed to get a quote. You will create a simple account when you book a job so you can track your driver and view your booking history.',
        },
      ],
    },
    {
      category: 'Pricing & Payment',
      questions: [
        {
          q: 'How does pricing work?',
          a: 'For Junk Removal (Haul Away), pricing is based on volume ($109 for 1/8 truck to $529 for full truck) plus disposal fees and any addons. For Labor Only, it is $79/hr for 1 helper or $129/hr for 2 helpers (2 hour minimum). You see your total price before booking—no hidden fees.',
        },
        {
          q: 'What are disposal fees?',
          a: 'Disposal fees are what the dump/transfer station charges to accept your items. We include up to $50 in disposal fees. If fees exceed $50, you pay the difference (driver provides receipt). Fees vary by item type and location.',
        },
        {
          q: 'When do I pay?',
          a: 'You pay online when you book. Your payment is held securely until the job is complete. We accept all major credit cards.',
        },
        {
          q: 'Can I get a refund?',
          a: 'Yes. Cancel more than 24 hours before your booking for a full refund. Cancel within 24 hours for a 50% refund. No refund for no-shows. Contact support for special circumstances.',
        },
      ],
    },
    {
      category: 'Junk Removal (Haul Away)',
      questions: [
        {
          q: 'What can you haul away?',
          a: 'Furniture, appliances, mattresses, yard waste, construction debris, electronics, and general junk. We cannot haul hazardous materials (paint, chemicals, asbestos), medical waste, or anything illegal.',
        },
        {
          q: 'How do I know what volume to choose?',
          a: 'Use our volume guide: 1/8 truck = 1-2 items, 1/4 truck = couch or 5-8 items, 1/2 truck = room cleanout (10-15 items), 3/4 truck = large furniture set (15-20 items), Full truck = whole house cleanout (20+ items). You can adjust volume with the driver if needed.',
        },
        {
          q: 'Do I need to be present?',
          a: 'Yes, someone must be present to point out items, provide access, and approve the final volume if it differs from your booking.',
        },
        {
          q: 'What if I have more items than expected?',
          a: 'The driver can adjust the volume in the app. You will be charged the difference based on our transparent pricing. You can decline the adjustment and the driver will only take the original volume.',
        },
        {
          q: 'Do you recycle or donate items?',
          a: 'Drivers take items to the appropriate facility. Many items are recycled or donated when possible. You can request donation drop-off in the booking notes.',
        },
      ],
    },
    {
      category: 'Labor Only (Help Moving)',
      questions: [
        {
          q: 'What does Labor Only include?',
          a: 'Helpers to lift and move items. Perfect for moving furniture within your home, loading/unloading a moving truck you rented, or rearranging heavy items. Does NOT include transportation or disposal.',
        },
        {
          q: 'Do I need to provide a truck?',
          a: 'Yes. Labor Only is for when you have your own truck or just need help moving items within your home. If you need items hauled away, use our Junk Removal (Haul Away) service instead.',
        },
        {
          q: 'How is time calculated?',
          a: 'Time starts when helpers arrive and ends when the work is done. Billed in 30-minute increments after the 2-hour minimum. You can extend time if needed.',
        },
        {
          q: 'Can helpers disassemble furniture?',
          a: 'Basic disassembly (removing legs, etc.) is included. Complex disassembly or reassembly may require additional time. Discuss with your helper.',
        },
      ],
    },
    {
      category: 'Booking & Scheduling',
      questions: [
        {
          q: 'How quickly can you come?',
          a: 'We offer same-day service in most areas ($50 surcharge, subject to availability). Standard bookings are available within 2-3 days. Book as far in advance as you like.',
        },
        {
          q: 'What are your hours?',
          a: 'Drivers are available 7 days a week, typically 7am-7pm. Some drivers offer early morning or evening slots. Check availability in the booking flow.',
        },
        {
          q: 'Can I reschedule?',
          a: 'Yes. Reschedule up to 24 hours before your booking at no charge. Within 24 hours, rescheduling may incur a fee. Manage bookings in your account.',
        },
        {
          q: 'What if the driver is late?',
          a: 'Drivers aim to arrive within the scheduled window. You can track them in real-time. If they are running late, you will get a notification. Contact support if there is an issue.',
        },
      ],
    },
    {
      category: 'Tracking & Communication',
      questions: [
        {
          q: 'How do I track my driver?',
          a: 'You will receive a tracking link via email and SMS on the day of your booking. See your driver location in real-time and get notifications when they are on the way and when they arrive.',
        },
        {
          q: 'Can I contact my driver?',
          a: 'Yes. Once a driver is assigned, you can message them through the app or call them directly. Contact info is in your booking details.',
        },
        {
          q: 'What if I need to change something on the day of service?',
          a: 'Contact your driver directly through the app. For major changes (volume, service type), contact support.',
        },
      ],
    },
    {
      category: 'For Drivers',
      questions: [
        {
          q: 'How much do drivers earn?',
          a: 'Drivers keep 60% of the service price. That\'s $65-$317 per haul-away job, or $47-$77 per labor hour. Plus reimbursement for disposal fees above $50.',
        },
        {
          q: 'What do I need to become a driver?',
          a: 'Pickup truck or cargo van, valid driver\'s license, auto insurance (covering business use), smartphone, and ability to lift 50+ lbs. Apply online and get approved in 24 hours.',
        },
        {
          q: 'Do I need commercial insurance?',
          a: 'You need insurance that covers business use. Many personal policies include this. Check with your insurance provider. We can recommend providers if needed.',
        },
        {
          q: 'How do I get paid?',
          a: 'Weekly direct deposit. Earnings are tracked in real-time in the driver app. Payment includes your 60% share plus disposal reimbursement.',
        },
        {
          q: 'Can I work part-time?',
          a: 'Absolutely. Work whenever you want. Go online in the app and accept jobs that fit your schedule. No minimums, no penalties for declining jobs.',
        },
      ],
    },
  ]

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-primary-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Everything you need to know about Haulkind. Cannot find an answer? Contact us.
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {faqs.map((category, catIdx) => (
            <div key={catIdx} className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-primary-600">{category.category}</h2>
              <div className="space-y-6">
                {category.questions.map((faq, qIdx) => (
                  <details key={qIdx} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                    <summary className="font-bold text-lg cursor-pointer">{faq.q}</summary>
                    <p className="mt-4 text-gray-600">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Still have questions?</h2>
          <p className="text-gray-700 text-lg mb-8">
            Our support team is here to help.
          </p>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-xl mb-3">Email Us</h3>
                <a href="mailto:support@haulkind.com" className="text-primary-600 font-semibold hover:underline text-lg">
                  support@haulkind.com
                </a>
                <p className="text-gray-600 mt-2">We respond within 24 hours</p>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-3">Call Us</h3>
                <a href="tel:+18005551234" className="text-primary-600 font-semibold hover:underline text-lg">
                  (800) 555-1234
                </a>
                <p className="text-gray-600 mt-2">Mon-Fri 9am-6pm EST</p>
              </div>
            </div>
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
