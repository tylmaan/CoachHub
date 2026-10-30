import { useId } from "react";
import type { Kit } from "../types/kit";

const SHIRT_PATH = "M12 4 L4 10 L8 16 L10 14 L10 34 Q10 36 12 36 L28 36 Q30 36 30 34 L30 14 L32 16 L36 10 L28 4 Q24 8 20 8 Q16 8 12 4 Z";

function isLight(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 255 > 0.6;
}

function patternOverlay(kit: Kit) {
    const c = kit.secondaryColor;
    switch (kit.pattern) {
        case "VerticalStripes":
            return [10, 16, 22, 28, 34].map((x) => <rect key={x} x={x} y={0} width={3.5} height={40} fill={c} />);
        case "HorizontalStripes":
            return [10, 16, 22, 28, 34].map((y) => <rect key={y} x={0} y={y} width={40} height={3.5} fill={c} />);
        case "Halves":
            return <rect x={20} y={0} width={20} height={40} fill={c} />;
        case "Sash":
            return <polygon points="4,8 12,4 40,32 40,40 32,40 4,14" fill={c} />;
        case "Quarters":
            return (
                <>
                    <rect x={20} y={0} width={20} height={21} fill={c} />
                    <rect x={0} y={21} width={20} height={19} fill={c} />
                </>
            );
        default:
            return null;
    }
}

interface JerseyProps {
    number?: number | null;
    kit?: Kit;
    muted?: boolean;
    size?: number;
}

export function Jersey({ number = null, kit, muted, size = 56 }: JerseyProps) {
    const clipId = useId();

    if (muted || !kit) {
        return (
            <svg width={size} height={size} viewBox="0 0 40 40">
                <path
                    d={SHIRT_PATH}
                    fill={muted ? "rgba(255,255,255,0.6)" : "#a78bfa"}
                    strokeWidth="1"
                    strokeDasharray={muted ? "3,2" : undefined}
                />
                {number !== null && !muted && (
                    <text x="20" y="26" textAnchor="middle" fontSize="12" fontWeight="600" fill="#ffffff" fontFamily="sans-serif">
                        {number}
                    </text>
                )}
            </svg>
        );
    }

    const textFill = isLight(kit.primaryColor) ? "#111111" : "#ffffff";
    const textStroke = isLight(kit.primaryColor) ? "#ffffff" : "#111111";

    return (
        <svg width={size} height={size} viewBox="0 0 40 40">
            <defs>
                <clipPath id={clipId}>
                    <path d={SHIRT_PATH} />
                </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
                <rect width={40} height={40} fill={kit.primaryColor} />
                {patternOverlay(kit)}
            </g>
            <path d={SHIRT_PATH} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
            {number !== null && (
                <text
                    x="20"
                    y="26"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill={textFill}
                    stroke={textStroke}
                    strokeWidth="0.6"
                    paintOrder="stroke"
                    fontFamily="sans-serif"
                >
                    {number}
                </text>
            )}
        </svg>
    );
}