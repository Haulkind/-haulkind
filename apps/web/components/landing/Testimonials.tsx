'use client'

const testimonials = [
  {
    quote: 'Fast, professional, and the GPS tracking made it so easy to know when they\'d arrive. Highly recommend.',
    name: '[Customer Name]',
    role: 'Homeowner, Philadelphia PA',
    avatar: 'CN',
  },
  {
    quote: 'Removed an old couch and mattress same day. Great price, no hidden fees. Will use again.',
    name: '[Customer Name]',
    role: 'Renter, Cherry Hill NJ',
    avatar: 'CN',
  },
]

export default function Testimonials() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our First Customers Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We launched in 2025. Real jobs, real people, right here in our area.
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
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
      </div>
    </section>
  )
}
