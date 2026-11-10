import type { ReactNode } from 'react'

/** The glyph for one AI quick action. They came off the Home ribbon with the
 * entries themselves, so this is their only home now. */
export type AiFeatureIconKind = 'summarize' | 'polish' | 'tidy' | 'generate' | 'mindmap'

const PATHS: Record<AiFeatureIconKind, ReactNode> = {
  summarize: (
    <>
      <path
        d="M13.875 21H12H6.5C5.39543 21 4.5 20.1046 4.5 19V5C4.5 3.89543 5.39543 3 6.5 3H17.5C18.6046 3 19.5 3.89543 19.5 5V9V12V13"
        strokeLinecap="round"
      />
      <path d="M8.00001 7H16" strokeLinecap="round" />
      <path d="M8.00007 10.2032H14.0001" strokeLinecap="round" />
      <path d="M8.00007 13.4062H12.0001" strokeLinecap="round" />
      <path
        d="M17 14L17.2579 14.697C17.5961 15.611 17.7652 16.068 18.0986 16.4014C18.432 16.7348 18.889 16.9039 19.803 17.2421L20.5 17.5L19.803 17.7579C18.889 18.0961 18.432 18.2652 18.0986 18.5986C17.7652 18.932 17.5961 19.389 17.2579 20.303L17 21L16.7421 20.303C16.4039 19.389 16.2348 18.932 15.9014 18.5986C15.568 18.2652 15.111 18.0961 14.197 17.7579L13.5 17.5L14.197 17.2421C15.111 16.9039 15.568 16.7348 15.9014 16.4014C16.2348 16.068 16.4039 15.611 16.7421 14.697L17 14Z"
        strokeLinejoin="round"
      />
    </>
  ),
  polish: (
    <>
      <path
        d="M5.00012 20.7481L8.80319 20.7482L21.7482 7.80317L17.945 4L5 16.945L5.00012 20.7481Z"
        strokeLinejoin="round"
      />
      <path d="M15.1406 6.80469L18.9438 10.6079" />
      <path
        d="M8 3L8.22106 3.59745C8.51094 4.38087 8.65589 4.77259 8.94166 5.05833C9.22743 5.34409 9.61914 5.48903 10.4026 5.77893L11 6L10.4026 6.22107C9.61914 6.51097 9.22743 6.65592 8.94166 6.94167C8.65589 7.22741 8.51094 7.61913 8.22106 8.40255L8 9L7.77894 8.40255C7.48906 7.61913 7.34411 7.22741 7.05834 6.94167C6.77257 6.65592 6.38086 6.51097 5.59743 6.22107L5 6L5.59743 5.77893C6.38086 5.48903 6.77257 5.34409 7.05834 5.05833C7.34411 4.77259 7.48906 4.38087 7.77894 3.59745L8 3Z"
        strokeLinejoin="round"
      />
    </>
  ),
  tidy: (
    <>
      <path d="M4 5H20" strokeLinecap="round" />
      <path d="M4 9H16" strokeLinecap="round" />
      <path d="M4 13H11" strokeLinecap="round" />
      <path d="M4 17H10" strokeLinecap="round" />
      <path
        d="M17 14L17.2579 14.697C17.5961 15.611 17.7652 16.068 18.0986 16.4014C18.432 16.7348 18.889 16.9039 19.803 17.2421L20.5 17.5L19.803 17.7579C18.889 18.0961 18.432 18.2652 18.0986 18.5986C17.7652 18.932 17.5961 19.389 17.2579 20.303L17 21L16.7421 20.303C16.4039 19.389 16.2348 18.932 15.9014 18.5986C15.568 18.2652 15.111 18.0961 14.197 17.7579L13.5 17.5L14.197 17.2421C15.111 16.9039 15.568 16.7348 15.9014 16.4014C16.2348 16.068 16.4039 15.611 16.7421 14.697L17 14Z"
        strokeLinejoin="round"
      />
    </>
  ),
  generate: (
    <>
      <path
        d="M13.5 3H6.5C5.39543 3 4.5 3.89543 4.5 5V19C4.5 20.1046 5.39543 21 6.5 21H17.5C18.6046 21 19.5 20.1046 19.5 19V9H13.5V3Z"
        strokeLinejoin="round"
      />
      <path d="M13.5 3V9H19.5" strokeLinejoin="round" />
      <path d="M12 12.5V18.5M9 15.5H15" strokeLinecap="round" />
    </>
  ),
  mindmap: (
    <>
      <rect x="2.5" y="9.5" width="6" height="5" rx="1.5" />
      <rect x="15.5" y="4" width="6" height="5" rx="1.5" />
      <rect x="15.5" y="15" width="6" height="5" rx="1.5" />
      <path d="M8.5 12h3.5M12 12V6.5h3.5M12 12v5.5h3.5" />
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
