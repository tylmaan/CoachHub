import { useCallback, useEffect, useRef, useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import NearMeIcon from "@mui/icons-material/NearMe";
import RedoIcon from "@mui/icons-material/Redo";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import UndoIcon from "@mui/icons-material/Undo";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import GroupsIcon from "@mui/icons-material/Groups";
import { TacticalBoard } from "./TacticalBoard";
import { 
    createObject,
    createShape,
    isDrawTool,
    isTooSmall, 
    moveObject,
    newId,
    toBoardPoint,
    lineupToPlayers,
    type DrawTool, 
    type Tool,
} from "../../types/boardEditing";
import { useHistory } from "../../hooks/useHistory";
import { useAutosave } from "../../hooks/useAutosave";
import { updateTacticalScheme } from "../../api/tacticalSchemesApi";
import { OBJECT_LABELS, SIDE_COLORS, SIDE_LABELS, ARROW_STYLE_LABELS, SAVE_STATUS_LABELS } from "../../constants/tacticalBoard";
import { 
    parseBoardData, 
    type TacticalBoardData,
    type BoardObject,
    type BoardSide,
    type BoardPoint,
    type BoardArrow,
    type BoardLineupSlot
} from "../../types/tacticalBoard";
import type { TacticalScheme } from "../../types/tacticalScheme";

const MIN_DRAG_DISTANCE = 0.004;

interface Drag {
    object: BoardObject;
    start: BoardPoint;
}

interface Draw {
    id: string;
    tool: DrawTool;
    start: BoardPoint;
}

interface TacticalBoardEditorProps {
    scheme: TacticalScheme;
    canEdit: boolean;
    lineup?: BoardLineupSlot[];
    onClose: () => void;
}

function SideToggle({ value, onChange }: { value: BoardSide; onChange: (side: BoardSide) => void }) {
    return (
        <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={value}
            onChange={(_, side: BoardSide | null) => {
                if (side) onChange(side);
            }}
        >
            <ToggleButton value="own">{SIDE_LABELS.own}</ToggleButton>
            <ToggleButton value="opponent">{SIDE_LABELS.opponent}</ToggleButton>
        </ToggleButtonGroup>
    );
}

function Dot({ color }: { color: string }) {
    return (
        <Box sx={{ width: 14, height: 14, mr: 1, borderRadius: "50%", bgcolor: color, border: "1.5px solid #fff" }} />
    );
}

function blurOnEnter(e: React.KeyboardEvent) {
    if (e.key === "Enter") (e.target as HTMLElement).blur();
}

function handleFieldBlur(
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    current: string,
    apply: (value: string) => void
) {
    const value = e.target.value.trim();
    if (!value) {
        e.target.value = current;
        return;
    }
    if (value !== current) apply(value); 
}

export function TacticalBoardEditor({ 
    scheme,
    canEdit,
    lineup,
    onClose
}: TacticalBoardEditorProps) {
    const { present, commit, undo, redo, canUndo, canRedo } = useHistory<TacticalBoardData>(parseBoardData(scheme.data));
    const svgRef = useRef<SVGSVGElement>(null);
    const dragRef = useRef<Drag | null>(null);
    const drawRef = useRef<Draw | null>(null);
    const [tool, setTool] = useState<Tool>("select");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draft, setDraft] = useState<TacticalBoardData | null>(null);
    const [name, setName] = useState(scheme.name);

    const { status, flush, retry } = useAutosave(
        { name, data: present },
        (value) => updateTacticalScheme(scheme.id, { name: value.name, data: JSON.stringify(value.data) }),
        canEdit
    );
    const shown = draft ?? present;
    const selected = shown.objects.find((o) => o.id === selectedId) ?? null;

    const deleteSelected = useCallback(() => {
        if (!selected) return;
        commit({ ...present, objects: present.objects.filter((o) => o.id !== selected.id) });
        setSelectedId(null);
    }, [selected, present, commit]);

    useEffect(() => {
        if (!canEdit) return;

        function handleKeyDown(e: KeyboardEvent) {
            if ((e.target as HTMLElement).closest("input, textarea")) return;
            const key = e.key.toLowerCase();
            const withCtrl = e.ctrlKey || e.metaKey;

            if (withCtrl && key === "z") {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            } else if (withCtrl && key === "y") {
                e.preventDefault();
                redo();
            } else if (key === "delete" || key === "backspace") {
                e.preventDefault();
                deleteSelected();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [canEdit, undo, redo, deleteSelected]);

    async function handleClose() {
        if (await flush()) onClose();
    }

    function insertLineup() {
        if (!lineup) return;
        const others = present.objects.filter((o) => !(o.type === "player" && o.side === "own"));
        commit({ ...present, objects: [...others, ...lineupToPlayers(lineup)] });
        setSelectedId(null);
    }

    function replaceObject(next: BoardObject) {
        commit({ ...present, objects: present.objects.map((o) => o.id === next.id ? next : o) });
    }

    function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
        const svg = svgRef.current;
        if (!svg) return;
        const point = toBoardPoint(e, svg);
        
        const objectId = (e.target as Element).closest("[data-object-id]")?.getAttribute("data-object-id");
        const object = present.objects.find((o) => o.id === objectId);
        if (object && (tool === "select" || object.type !== "zone")) {
            setSelectedId(object.id);
            dragRef.current = { object, start: point };
            svg.setPointerCapture(e.pointerId);
            return;
        }

        if (tool === "select") {
            setSelectedId(null);
            return;
        }

        if (isDrawTool(tool)) {
            drawRef.current = { id: newId(), tool, start: point };
            setSelectedId(null);
            svg.setPointerCapture(e.pointerId);
            return;
        }

        const created = createObject(tool, point, present.objects);
        commit({ ...present, objects: [...present.objects, created] });
        setSelectedId(created.id);
    }

    function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
        const svg = svgRef.current;
        if (!svg) return;
        const point = toBoardPoint(e, svg);

        const draw = drawRef.current;
        if (draw) {
            const shape = createShape(draw.tool, draw.id, draw.start, point);
            setDraft({ ...present, objects: [...present.objects, shape] });
            return;
        }

        const drag = dragRef.current;
        if (!drag) return;
        const moved = moveObject(drag.object, point.x - drag.start.x, point.y - drag.start.y);
        setDraft({ ...present, objects: present.objects.map((o) => o.id === moved.id ? moved : o) });
    }

    function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
        const svg = svgRef.current;
        const drag = dragRef.current;
        const draw = drawRef.current;
        dragRef.current = null;
        drawRef.current = null;
        setDraft(null);
        if (!svg) return;
        const point = toBoardPoint(e, svg);

        if (draw) {
            const shape = createShape(draw.tool, draw.id, draw.start, point);
            if (isTooSmall(shape)) return;
            commit({ ...present, objects: [...present.objects, shape] });
            setSelectedId(shape.id);
            return;
        }

        if (!drag) return;
        const dx = point.x - drag.start.x;
        const dy = point.y - drag.start.y;
        if (Math.hypot(dx, dy) < MIN_DRAG_DISTANCE) return;

        replaceObject(moveObject(drag.object, dx, dy));
    }

    return (
        <Dialog open onClose={handleClose} fullWidth maxWidth="lg">
            <DialogTitle>
                {canEdit ? (
                    <TextField
                        key={name}
                        variant="standard"
                        fullWidth
                        defaultValue={name}
                        slotProps={{ 
                            htmlInput: { maxLength: 100, "aria-label": "Nazwa tablicy" },
                            input: { sx: { fontSize: "1.25rem", fontWeight: 600 } }
                        }}
                        onKeyDown={blurOnEnter}
                        onBlur={(e) => handleFieldBlur(e, name, setName)}
                    />
                ) : (
                    scheme.name
                )}
            </DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: canEdit ? "190px 1fr 250px" : "1fr",
                        gap: 2,
                        alignItems: "start",
                    }}
                >
                    {canEdit && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <ToggleButtonGroup
                                orientation="vertical"
                                exclusive
                                fullWidth
                                size="small"
                                value={tool}
                                onChange={(_, value: Tool | null) => {
                                    if (value) setTool(value);
                                }}
                            >
                                <ToggleButton value="select" sx={{ justifyContent: "flex-start" }}>
                                    <NearMeIcon fontSize="small" sx={{ mr: 1 }} />
                                    Zaznacz
                                </ToggleButton>
                                <ToggleButton value="ownPlayer" sx={{ justifyContent: "flex-start" }}>
                                    <Dot color={SIDE_COLORS.own.fill} />
                                    Nasz zawodnik
                                </ToggleButton>
                                <ToggleButton value="opponentPlayer" sx={{ justifyContent: "flex-start" }}>
                                    <Dot color={SIDE_COLORS.opponent.fill} />
                                    Rywal
                                </ToggleButton>
                                <ToggleButton value="text" sx={{ justifyContent: "flex-start" }}>
                                    <TextFieldsIcon fontSize="small" sx={{ mr: 1 }} />
                                    Tekst
                                </ToggleButton>
                                <ToggleButton value="run" sx={{ justifyContent: "flex-start" }}>
                                    <TrendingFlatIcon fontSize="small" sx={{ mr: 1 }} />
                                    Bieg
                                </ToggleButton>
                                <ToggleButton value="pass" sx={{ justifyContent: "flex-start" }}>
                                    <MoreHorizIcon fontSize="small" sx={{ mr: 1 }} />
                                    Podanie
                                </ToggleButton>
                                <ToggleButton value="zone" sx={{ justifyContent: "flex-start" }}>
                                    <CropSquareIcon fontSize="small" sx={{ mr: 1 }} />
                                    Strefa
                                </ToggleButton>
                            </ToggleButtonGroup>

                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Tooltip title="Cofnij (Ctrl+Z)">
                                    <span>
                                        <IconButton onClick={undo} disabled={!canUndo} aria-label="Cofnij">
                                            <UndoIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Ponów (Ctrl+Y)">
                                    <span>
                                        <IconButton onClick={redo} disabled={!canRedo} aria-label="Ponów">
                                            <RedoIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Box>
                            {lineup && (
                                <Tooltip title="Zastępuje naszych zawodników na tablicy planowanym składem">
                                    <Button variant="outlined" startIcon={<GroupsIcon />} onClick={insertLineup}>
                                        Wstaw skład
                                    </Button>
                                </Tooltip>
                            )}
                        </Box>
                    )}

                    <Box
                        sx={{
                            width: "min(100%, calc((100vh - 240px) * 68 / 105))",
                            mx: "auto",
                            cursor: canEdit && tool !== "select" ? "crosshair" : "default",
                        }}
                    >
                        <TacticalBoard
                            data={shown}
                            selectedId={selectedId}
                            svgRef={svgRef}
                            onPointerDown={canEdit ? handlePointerDown : undefined}
                            onPointerMove={canEdit ? handlePointerMove : undefined}
                            onPointerUp={canEdit ? handlePointerUp : undefined}
                        />
                    </Box>

                    {canEdit && (
                        <Paper variant="outlined" sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                            {selected ? (
                                <>
                                    <Typography variant="subtitle2">{OBJECT_LABELS[selected.type]}</Typography>

                                    {selected.type === "player" && (
                                        <>
                                            <SideToggle value={selected.side} onChange={(side) => replaceObject({ ...selected, side })} />
                                            <TextField
                                                key={`${selected.id}:${selected.label}`}
                                                size="small"
                                                label="Numer"
                                                defaultValue={selected.label}
                                                slotProps={{ htmlInput: { maxLength: 3 } }}
                                                onKeyDown={blurOnEnter}
                                                onBlur={(e) =>
                                                    handleFieldBlur(e, selected.label, (label) =>
                                                        replaceObject({ ...selected, label }),
                                                    )
                                                }
                                            />
                                        </>
                                    )}

                                    {selected.type === "text" && (
                                        <TextField
                                            key={`${selected.id}:${selected.text}`}
                                            size="small"
                                            label="Treść"
                                            defaultValue={selected.text}
                                            slotProps={{ htmlInput: { maxLength: 60 } }}
                                            onKeyDown={blurOnEnter}
                                            onBlur={(e) =>
                                                handleFieldBlur(e, selected.text, (text) =>
                                                    replaceObject({ ...selected, text }),
                                                )
                                            }
                                        />
                                    )}

                                    {selected.type === "arrow" && (
                                        <>
                                            <SideToggle value={selected.side} onChange={(side) => replaceObject({ ...selected, side })} />
                                            <ToggleButtonGroup
                                                exclusive
                                                fullWidth
                                                size="small"
                                                value={selected.style}
                                                onChange={(_, style: BoardArrow["style"] | null) => {
                                                    if (style) replaceObject({ ...selected, style });
                                                }}
                                            >
                                                <ToggleButton value="run">{ARROW_STYLE_LABELS.run}</ToggleButton>
                                                <ToggleButton value="pass">{ARROW_STYLE_LABELS.pass}</ToggleButton>
                                            </ToggleButtonGroup>
                                        </>
                                    )}

                                    {selected.type === "zone" && (
                                        <TextField
                                            key={`${selected.id}:${selected.label}`}
                                            size="small"
                                            label="Nazwa"
                                            defaultValue={selected.label}
                                            slotProps={{ htmlInput: { maxLength: 30 } }}
                                            onKeyDown={blurOnEnter}
                                            onBlur={(e) =>
                                                handleFieldBlur(e, selected.label, (label) => replaceObject({ ...selected, label }))
                                            }
                                        />
                                    )}

                                    <Button color="error" startIcon={<DeleteIcon />} onClick={deleteSelected}>
                                        Usuń
                                    </Button>
                                </>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Zaznacz obiekt na boisku albo wybierz narzędzie i kliknij boisko.
                                </Typography>
                            )}
                        </Paper>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                {canEdit && (
                    <Typography variant="body2" color={status === "error" ? "error" : "text.secondary"} sx={{ mr: "auto", ml: 1 }}>
                        {SAVE_STATUS_LABELS[status]}
                    </Typography>
                )}
                {status === "error" && <Button onClick={retry}>Ponów</Button>}
                <Button
                    color={status === "error" ? "error" : "primary"}
                    onClick={status === "error" ? onClose : handleClose}
                    disabled={status === "saving"}
                >
                    {status === "error" ? "Zamknij bez zapisu" : "Zamknij"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}