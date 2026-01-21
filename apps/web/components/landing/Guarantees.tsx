'use client'

const guarantees = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '100% Satisfaction',
    description: 'Not happy? We\'ll make it right or refund your money. No questions asked.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Licensed & Insured',
    description: 'All drivers are fully licensed, background-checked, and insured for your protection.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'No Hidden Fees',
    description: 'The price you see is the price you pay. Guaranteed. No surprises at checkout.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Same-Day Service',
    description: 'Need it done today? We offer same-day pickup and removal in most areas.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
]

export default function Guarantees() {
  return (
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Guarantees to You
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We stand behind our service with industry-leading guarantees
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {guarantees.map((guarantee, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-center"
            >
              <div className={`w-16 h-16 mx-auto mb-4 ${guarantee.bgColor} rounded-full flex items-center justify-center ${guarantee.color}`}>
                {guarantee.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{guarantee.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {guarantee.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
