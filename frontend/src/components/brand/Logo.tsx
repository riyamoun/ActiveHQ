import { Link } from 'react-router-dom'
import clsx from 'clsx'

const heights = {
  xs: 'h-7',
  sm: 'h-9',
  md: 'h-11',
  lg: 'h-14',
  xl: 'h-[4.5rem]',
} as const

export type LogoSize = keyof typeof heights

export interface LogoProps {
  size?: LogoSize
  className?: string
  imgClassName?: string
  to?: string | null
  href?: string
  animated?: boolean
}

export function Logo({
  size = 'md',
  className,
  imgClassName,
  to = '/',
  href,
  animated = true,
}: LogoProps) {
  const image = (
    <img
      src="/logo.jpg"
      alt="ActiveHQ — Manage. Automate. Grow."
      width={320}
      height={120}
      className={clsx(
        heights[size],
        'w-auto max-w-[min(100%,280px)] object-contain object-left',
        animated && 'transition-[transform,filter] duration-300 ease-out hover:brightness-110',
        imgClassName
      )}
      decoding="async"
    />
  )

  const wrapClass = clsx('inline-flex shrink-0 items-center', className)

  if (href) {
    return (
      <a href={href} className={wrapClass}>
        {image}
      </a>
    )
  }

  if (to) {
    return (
      <Link to={to} className={wrapClass}>
        {image}
      </Link>
    )
  }

  return <span className={wrapClass}>{image}</span>
}
