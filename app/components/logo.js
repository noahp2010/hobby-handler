import Image from 'next/image'

const SIZE_MAP = {
  xs: { width: 40, height: 40 },
  sm: { width: 164, height: 44 },
  md: { width: 208, height: 54 },
  lg: { width: 244, height: 62 },
  xl: { width: 280, height: 72 },
  hero: { width: 560, height: 150 },
}

export default function Logo({ size = 'md', showFull = true, priority = false }) {
  const fullSize = SIZE_MAP[size] || SIZE_MAP.md
  const iconSize = SIZE_MAP.xs
  const dimensions = showFull ? fullSize : iconSize

  return (
    <Image
      src="/logo.svg"
      alt="Hobby Handler"
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      style={{ width: dimensions.width, height: dimensions.height, objectFit: 'contain' }}
    />
  )
}
