"use client";

import { useRef, useState } from "react";
import { appendPatternDot } from "@/lib/pattern";
import { cn } from "@/lib/utils";

const SIZE = 280;
const PADDING = 36;
const GAP = (SIZE - PADDING * 2) / 2;
const HIT = 28;

function dotPoint(index: number) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return { x: PADDING + col * GAP, y: PADDING + row * GAP };
}

function hitDot(x: number, y: number) {
  for (let index = 0; index < 9; index += 1) {
    const point = dotPoint(index);
    const dx = point.x - x;
    const dy = point.y - y;
    if (dx * dx + dy * dy <= HIT * HIT) return index;
  }
  return null;
}

type Props = {
  error?: boolean;
  disabled?: boolean;
  onComplete: (path: number[]) => void;
};

export function PatternPad({ error, disabled, onComplete }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<number[]>([]);
  const drawing = useRef(false);
  const [path, setPath] = useState<number[]>([]);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  function localPoint(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * SIZE,
      y: ((event.clientY - rect.top) / rect.height) * SIZE,
    };
  }

  function addFromEvent(event: React.PointerEvent<SVGSVGElement>) {
    const point = localPoint(event);
    if (!point) return;
    setCursor(point);
    const index = hitDot(point.x, point.y);
    if (index == null) return;
    const next = appendPatternDot(pathRef.current, index);
    if (next === pathRef.current) return;
    pathRef.current = next;
    setPath(next);
  }

  function finish() {
    if (!drawing.current) return;
    drawing.current = false;
    setCursor(null);
    const result = pathRef.current;
    pathRef.current = [];
    setPath([]);
    if (result.length > 0) onComplete(result);
  }

  const points = path.map(dotPoint);
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cn(
        "mx-auto h-72 w-72 touch-none select-none",
        error ? "text-destructive" : "text-foreground",
        disabled ? "pointer-events-none opacity-50" : "",
      )}
      onPointerDown={(event) => {
        if (disabled) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drawing.current = true;
        pathRef.current = [];
        setPath([]);
        addFromEvent(event);
      }}
      onPointerMove={(event) => {
        if (!drawing.current || disabled) return;
        addFromEvent(event);
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      {line ? (
        <path d={line} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      {cursor && points.length > 0 ? (
        <line
          x1={points[points.length - 1]!.x}
          y1={points[points.length - 1]!.y}
          x2={cursor.x}
          y2={cursor.y}
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.45"
        />
      ) : null}
      {Array.from({ length: 9 }, (_, index) => {
        const point = dotPoint(index);
        const active = path.includes(index);
        return (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="22" className="fill-muted" />
            <circle
              cx={point.x}
              cy={point.y}
              r={active ? 10 : 7}
              className={active ? "fill-current" : "fill-muted-foreground/70"}
            />
          </g>
        );
      })}
    </svg>
  );
}
