'use client'

const testimonials = [
  {
    quote: 'Outstanding service! HaulKind moved our entire office equipment smoothly and professionally.',
    name: 'Michael Thompson',
    role: 'Business Owner, NYC',
    avatar: 'MT',
  },
  {
    quote: 'Best hauling service I\'ve ever used! The driver was punctual, careful with my furniture.',
    name: 'Sarah Martinez',
    role: 'Homeowner, Los Angeles',
    avatar: 'SM',
  },
  {
    quote: 'Incredible reliability! HaulKind has been our go-to for all restaurant equipment deliveries.',
    name: 'David Chen',
    role: 'Restaurant Owner, Chicago',
    avatar: 'DC',
  },
  {
    quote: 'Professional and efficient! I use HaulKind for all my client deliveries. Highly recommend!',
    name: 'Jennifer Wilson',
    role: 'Interior Designer, Miami',
    avatar: 'JW',
  },
  {
    quote: 'Always reliable! HaulKind handles all our construction debris removal with zero hassle.',
    name: 'Robert Johnson',
    role: 'Contractor, Dallas',
    avatar: 'RJ',
  },
]

const stats = [
  { value: '15,000+', label: 'Items Removed' },
  { value: '2,500+', label: 'Happy Customers' },
  { value: '4.9/5', label: 'Average Rating' },
  { value: '98.5%', label: 'On-Time Rate' },
]

export default function Testimonials() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real feedback from real customers who trust HaulKind for their junk removal needs
          </p>
        </div>

        {/* Testimonials carousel/grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-6 relative"
            >
              {/* Quote icon */}
              <div className="absolute top-4 right-4 text-teal-200">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              <p className="text-gray-700 mb-6 italic leading-relaxed">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats section */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 md:p-12 max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Trusted by Thousands
          </h3>
          <p className="text-teal-100 text-center mb-8">
            Join our growing community of satisfied customers
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-teal-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
