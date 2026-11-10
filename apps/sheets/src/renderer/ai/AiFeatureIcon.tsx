import type { ReactNode } from 'react'

/** The glyph for one AI feature entry. They came off the Home ribbon with the
 * entries themselves, so this is their only home now. */
export type AiFeatureIconKind = 'check' | 'analyze'

const PATHS: Record<AiFeatureIconKind, ReactNode> = {
  check: (
    <>
      <path d="M11 3.25C15.2802 3.25 18.75 6.71979 18.75 11C18.75 15.2802 15.2802 18.75 11 18.75C6.71979 18.75 3.25 15.2802 3.25 11C3.25 6.71979 6.71979 3.25 11 3.25Z" />
      <path
        d="M7.5 10.8235L9.64097 12.9645C9.93755 13.2611 10.4177 13.2634 10.7171 12.9697L14.7647 9"
        strokeLinecap="round"
      />
      <path d="M20 20.5L16.5 17" strokeLinecap="round" />
    </>
  ),
  analyze: (
    <>
      <path d="M3.88589 14.2073H8.48682" strokeLinecap="round" />
      <path d="M3.88589 19.0112H8.48682" strokeLinecap="round" />
      <path d="M3.88589 9.40369H11.692" strokeLinecap="round" />
      <path d="M3.88589 4.59998H19.1645" strokeLinecap="round" />
      <path d="M15.1995 10.5445C15.3784 10.0908 16.0206 10.0908 16.1996 10.5445L16.706 11.8286C17.0338 12.6598 17.6918 13.3178 18.523 13.6456L19.8071 14.1521C20.2608 14.331 20.2608 14.9732 19.8071 15.1522L18.523 15.6586C17.6918 15.9864 17.0338 16.6444 16.706 17.4756L16.1996 18.7597C16.0206 19.2134 15.3784 19.2134 15.1995 18.7597L14.693 17.4756C14.3652 16.6444 13.7072 15.9864 12.876 15.6586L11.592 15.1522C11.1382 14.9732 11.1382 14.331 11.592 14.1521L12.876 13.6456C13.7072 13.3178 14.3652 12.6598 14.693 11.8286L15.1995 10.5445Z" />
    </>
  ),
}

export function AiFeatureIcon({ kind }: { kind: AiFeatureIconKind }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[kind]}
    </svg>
  )
}
