"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import clsx from "clsx";
import {
  DropdownContextProvider,
  useDropdown,
} from "@/providers/dropdown-context.provider";

type Side = "top" | "bottom";
type Align = "start" | "end";

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  side?: Side;
  align?: Align;
  isWidthFull?: boolean;
  /** Fires exactly when the panel transitions from closed to open — not
   * on close, and not on a toggle that was already open. For anything
   * that should happen once per "opened this", not once per click (e.g.
   * the notification bell marking itself seen). */
  onOpen?: () => void;
}

interface Position {
  top: number;
  bottom: number;
  left: number;
  right: number;
  /** Distance from the panel's aligned edge to the arrow, in px. */
  arrowOffset: number;
  /** How tall the panel can actually get before it would run past the
   * viewport edge on its open side — a hard cap, independent of the
   * flip-to-top heuristic below (which only decides which side to prefer,
   * and can still guess wrong for a panel taller than
   * ESTIMATED_PANEL_HEIGHT). The panel scrolls internally past this. */
  maxHeight: number;
}

const PANEL_WIDTH = 224; // matches w-56
const ARROW_MARGIN = 16; // keeps the arrow clear of the panel's rounded corners
// The panel's actual height varies with its content and isn't known until
// it's rendered — this is a conservative estimate of how much room a
// typical panel needs below the trigger before flipping to render above it
// instead. Good enough to avoid the common case (a short list, trigger
// near the bottom of a short page) without the complexity of measuring the
// real panel and repositioning after the fact.
const ESTIMATED_PANEL_HEIGHT = 240;

function Dropdown({
  trigger,
  children,
  side = "bottom",
  align = "end",
  isWidthFull = false,
  onOpen,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [resolvedSide, setResolvedSide] = useState(side);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Reads `open` directly rather than deciding inside setOpen's updater —
  // an updater function isn't a safe place to call another component's
  // setState (onOpen), since React can invoke it outside a normal event
  // handler's timing (e.g. while rendering), which is exactly what caused
  // "Cannot update a component while rendering a different component"
  // here before this was split apart.
  const toggleOpen = useCallback(() => {
    if (!open) onOpen?.();
    setOpen((v) => !v);
  }, [open, onOpen]);

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;

    // window.innerWidth/innerHeight include the scrollbar's own thickness,
    // but the page's actual layout box (and therefore rect.right/rect.top)
    // does not — so a right/bottom offset measured against window.inner*
    // drifts by the scrollbar's width the moment one appears. clientWidth/
    // clientHeight exclude the scrollbar, matching what rect is measured
    // against, so the panel stays glued to the trigger either way.
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    // Flip to the other side when the preferred side doesn't have enough
    // room but the opposite one does — e.g. a filter dropdown whose
    // trigger ends up near the bottom of a short (one-row) list would
    // otherwise render its panel partly below the viewport.
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    let effectiveSide = side;
    if (
      side === "bottom" &&
      spaceBelow < ESTIMATED_PANEL_HEIGHT &&
      spaceAbove > spaceBelow
    ) {
      effectiveSide = "top";
    } else if (
      side === "top" &&
      spaceAbove < ESTIMATED_PANEL_HEIGHT &&
      spaceBelow > spaceAbove
    ) {
      effectiveSide = "bottom";
    }
    setResolvedSide(effectiveSide);

    // The panel's aligned edge sits flush with the trigger's edge (see the
    // left/right assignments below), so the arrow's distance from that edge
    // to the trigger's center is always half the trigger's width — clamped
    // so it can't slide past the panel's rounded corners for very wide or
    // very narrow triggers.
    const arrowOffset = Math.min(
      PANEL_WIDTH - ARROW_MARGIN,
      Math.max(ARROW_MARGIN, rect.width / 2),
    );

    // Hard cap regardless of which side won above — a panel taller than
    // ESTIMATED_PANEL_HEIGHT (e.g. the ticket filter panel) can still get
    // placed on a side that doesn't actually have room for all of it, so
    // this clamps to whatever room is really there and lets the panel
    // scroll internally past that instead of running off-screen.
    const viewportMargin = 16;
    const maxHeight =
      (effectiveSide === "bottom" ? spaceBelow : spaceAbove) -
      gap -
      viewportMargin;

    setPosition({
      top: rect.bottom + gap,
      bottom: viewportHeight - rect.top + gap,
      left: rect.left,
      right: viewportWidth - rect.right,
      arrowOffset,
      maxHeight: Math.max(maxHeight, 120),
    });
  }, [side]);

  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (target instanceof Element && target.closest("[data-floating-panel]"))
        return;
      const inTrigger = wrapperRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inTrigger && !inPanel) close();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    updatePosition();
    const id = requestAnimationFrame(() => setVisible(true));
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  return (
    <DropdownContextProvider close={close}>
      <div
        ref={wrapperRef}
        className={`inline-block ${isWidthFull && "w-full"}`}
      >
        {/* A plain div, not a <button> — the trigger is often itself a
            <Button> (filter dropdowns), and nesting <button> inside
            <button> is invalid HTML that breaks hydration. role="button"
            plus the Enter/Space handler below keeps it keyboard-operable. */}
        <div
          role="button"
          tabIndex={0}
          onClick={toggleOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleOpen();
            }
          }}
          aria-haspopup="menu"
          aria-expanded={open}
          className="block w-full rounded-full leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2"
        >
          {trigger}
        </div>
      </div>

      {mounted &&
        open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            data-floating-panel
            style={{
              position: "fixed",
              top: resolvedSide === "bottom" ? position.top : undefined,
              bottom: resolvedSide === "top" ? position.bottom : undefined,
              left: align === "start" ? position.left : undefined,
              right: align === "end" ? position.right - 5 : undefined,
            }}
            className="z-[1000]"
          >
            <div
              style={{
                [align === "end" ? "right" : "left"]: position.arrowOffset,
              }}
              className={clsx(
                "absolute h-2.5 w-2.5 rotate-45 border-line bg-surface transition-opacity duration-150",
                visible ? "opacity-100" : "opacity-0",
                resolvedSide === "bottom"
                  ? "-top-[5px] border-l border-t"
                  : "-bottom-[5px] border-b border-r",
              )}
            />
            <div
              className={clsx(
                "grid min-w-56 transition-[grid-template-rows] duration-200 ease-out",
                visible ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div
                  role="menu"
                  style={{ maxHeight: position.maxHeight }}
                  className={clsx(
                    "overflow-y-auto rounded border border-line bg-surface py-1 shadow-sm transition-opacity duration-150",
                    visible ? "opacity-100 delay-75" : "opacity-0",
                  )}
                >
                  {children}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </DropdownContextProvider>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

function DropdownItem({
  children,
  icon,
  href,
  onClick,
  danger,
}: DropdownItemProps) {
  const { close } = useDropdown();
  const className = clsx(
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-canvas",
    danger ? "text-danger" : "text-ink",
  );

  function handleClick() {
    close();
    onClick?.();
  }

  if (href) {
    return (
      <Link
        href={href}
        role="menuitem"
        className={className}
        onClick={handleClick}
      >
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleClick}
      className={className}
    >
      {icon}
      {children}
    </button>
  );
}

function DropdownSeparator() {
  return <div className="my-1 border-t border-line" />;
}

Dropdown.DropdownItem = DropdownItem;
Dropdown.DropdownSeparator = DropdownSeparator;

export default Dropdown;
