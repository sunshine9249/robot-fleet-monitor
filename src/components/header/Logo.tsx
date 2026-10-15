/**
 * 서비스 로고. 둥근 사각형 안에 로봇 얼굴과 진행 경로를 단순화했습니다.
 * public/favicon.svg 와 같은 그림입니다.
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="로고"
    >
      <rect width="32" height="32" rx="8" fill="#7c77f4" />
      <rect x="8" y="9" width="16" height="12" rx="4" fill="#fff" />
      <circle cx="13" cy="15" r="1.7" fill="#181b24" />
      <circle cx="19" cy="15" r="1.7" fill="#181b24" />
      <path
        d="M16 5.5v3.5"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="16" cy="5" r="1.5" fill="#00e5ff" />
      <path
        d="M7 25.5h4.5M14 25.5h4M21 25.5h4"
        stroke="#00e5ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
