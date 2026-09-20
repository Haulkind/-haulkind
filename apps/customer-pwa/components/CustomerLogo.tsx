import Image from 'next/image'

export default function CustomerLogo({
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
      src="/icons/icon-512.png"
      alt="HaulKind"
      width={size}
      height={size}
      priority={priority}
      unoptimized
      className={`block shrink-0 rounded-[20%] object-cover ${className}`}
    />
  )
}
