import { Pitch } from "../Pitch";
import type { BoardObject, BoardSide, TacticalBoardData } from "../../types/tacticalBoard";

const PITCH_WIDTH = 68;
const PITCH_HEIGHT = 105;
const INSET_Y = PITCH_HEIGHT * 0.03;

const SIDE_COLORS: Record<BoardSide, { fill: string; arrow: string }> = {
    own: { fill: "#7c3aed", arrow: "#ddd6fe" },
    opponent: { fill: "#dc2626", arrow: "#fecaca" },
};

const LAYER: Record<BoardObject["type"], number> = { zone: 0, arrow: 1, player: 2, text: 3 };

interface TacticalBoardProps {
    data: TacticalBoardData;
}

export function TacticalBoard({ data }: TacticalBoardProps) {
    const ordered = [...data.objects].sort((a, b) => LAYER[a.type] - LAYER[b.type]);

    return (
        <Pitch aspectRatio={`${PITCH_WIDTH} / ${PITCH_HEIGHT}`}>
            <svg
                viewBox={`0 0 ${PITCH_WIDTH} ${PITCH_HEIGHT}`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            >
                <defs>
                    {(Object.keys(SIDE_COLORS) as BoardSide[]).map((side) => (
                        <marker
                            key={side}
                            id={`board-arrow-${side}`}
                            viewBox="0 0 10 10"
                            refX="8"
                            refY="5"
                            markerWidth="4.5"
                            markerHeight="4.5"
                            orient="auto-start-reverse"
                        >
                            <path 
                                d="M2 1L8 5L2 9" 
                                fill="none" 
                                stroke={SIDE_COLORS[side].arrow} 
                                strokeWidth="1.8" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            /> 
                        </marker>
                    ))}
                </defs>

                <g fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.3">
                    <rect x={(PITCH_WIDTH - 40) / 2} y={(INSET_Y)} width={40} height={16} />
                    <rect x={(PITCH_WIDTH - 20) / 2} y={(INSET_Y)} width={20} height={5.5} />
                    <rect x={(PITCH_WIDTH - 40) / 2} y={(PITCH_HEIGHT - INSET_Y - 16)} width={40} height={16} />
                    <rect x={(PITCH_WIDTH - 20) / 2} y={(PITCH_HEIGHT - INSET_Y - 5.5)} width={20} height={5.5} />
                </g>

                {ordered.map((object) => {
                    switch (object.type) {
                        case "zone":
                            return (
                                <g key={object.id}>
                                    <rect
                                        x={object.x * PITCH_WIDTH}
                                        y={object.y * PITCH_HEIGHT}
                                        width={object.width * PITCH_WIDTH}
                                        height={object.height * PITCH_HEIGHT}
                                        fill="#fac775"
                                        fillOpacity={0.22}
                                        stroke="#fac775"
                                        strokeWidth={0.4}
                                        strokeDasharray="1.5 1"
                                    />
                                    <text
                                        x={(object.x * PITCH_WIDTH) + 1.5}
                                        y={(object.y + object.height) * PITCH_HEIGHT - 1.5}
                                        fill="#fff"
                                        fontSize={2.6}
                                    >
                                        {object.label}
                                    </text>
                                </g>
                            );
                        case "arrow":
                            return (
                                <line
                                    key={object.id}
                                    x1={object.from.x * PITCH_WIDTH}
                                    y1={object.from.y * PITCH_HEIGHT}
                                    x2={object.to.x * PITCH_WIDTH}
                                    y2={object.to.y * PITCH_HEIGHT}
                                    stroke={SIDE_COLORS[object.side].arrow}
                                    strokeWidth={0.9}
                                    strokeDasharray={object.style === "pass" ? "1.6 1.2" : undefined}
                                    markerEnd={`url(#board-arrow-${object.side})`}
                                />
                            );
                        case "player":
                            return (
                                <g key={object.id}>
                                    <circle
                                        cx={object.x * PITCH_WIDTH}
                                        cy={object.y * PITCH_HEIGHT}
                                        r={3}
                                        fill={SIDE_COLORS[object.side].fill}
                                        stroke="#fff"
                                        strokeWidth={0.5}
                                    />
                                    <text
                                        x={object.x * PITCH_WIDTH}
                                        y={object.y * PITCH_HEIGHT}
                                        fill="#fff"
                                        fontSize={2.7}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                    >
                                        {object.label}
                                    </text>
                                </g>
                            );
                        case "text":
                            return (
                                <text
                                    key={object.id}
                                    x={object.x * PITCH_WIDTH}
                                    y={object.y * PITCH_HEIGHT}
                                    fill="#fff"
                                    fontSize={3}
                                    textAnchor="middle"
                                >
                                    {object.text}
                                </text>
                            );
                    }
                })}
            </svg>
        </Pitch>
    );
}