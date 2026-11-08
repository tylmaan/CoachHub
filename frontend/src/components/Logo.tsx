interface LogoProps {
    size?: number;
}

export function Logo({ size = 32 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="CoachHub">
            <path
                d="M60 6L108 22V62C108 88 88 106 60 116C32 106 12 88 12 62V22Z"
                fill="#1e1b4b"
            />
            <g fill="none" stroke="#a78bfa" strokeOpacity={0.4} strokeWidth={2}>
                <line x1="22" y1="62" x2="98" y2="62" />
                <circle cx="60" cy="62" r="15" />
                <rect x="40" y="20" width="40" height="14" />
                <rect x="44" y="92" width="32" height="12" />
            </g>
            <g stroke="#fff" strokeWidth={3.5} strokeLinecap="round" fill="none">
                <path d="M32 36L44 48M44 36L32 48" />
                <circle cx="82" cy="40" r="6" />
                <circle cx="60" cy="78" r="6" />
                <path d="M44 52C50 60 55 66 57 71" strokeWidth={3} />
                <path d="M55 64L58 72L50 70" strokeWidth={3} strokeLinejoin="round" />
            </g>
            <g fill="none" stroke="#a78bfa" strokeWidth={3} strokeLinecap="round">
                <path d="M64 72C70 64 76 56 80 48" strokeDasharray="5 5" />
                <path d="M72 48L81 47L80 56" strokeLinejoin="round" />
            </g>
            <path
                d="M60 6L108 22V62C108 88 88 106 60 116C32 106 12 88 12 62V22Z"
                fill="none"
                stroke="#a78bfa"
                strokeWidth={4}
                strokeLinejoin="round"
            />
        </svg>
    );
}