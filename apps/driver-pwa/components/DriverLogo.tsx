import Image from 'next/image'

export default function DriverLogo({
  size = 80,
  className = '',
  priority = false,
}: {
  size?: number
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src="/icons/icon-512.png?v=2"
      alt="HaulKind Drive"
      width={size}
      height={size}
      priority={priority}
      unoptimized
      className={`shrink-0 rounded-xl ${className}`}
    />
  )
}
