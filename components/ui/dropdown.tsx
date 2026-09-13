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
}

interface Position {
  top: number;
  bottom: number;
  left: number;
  right: number;
  /** Distance from the panel's aligned edge to the arrow, in px. */
  arrowOffset: number;
}

const PANEL_WIDTH = 224; // matches w-56
const ARROW_MARGIN = 16; // keeps the arrow clear of the panel's rounded corners

function Dropdown({
  trigger,
  children,
  side = "bottom",
  align = "end",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;

    // The panel's aligned edge sits flush with the trigger's edge (see the
    // left/right assignments below), so the arrow's distance from that edge
    // to the trigger's center is always half the trigger's width — clamped
    // so it can't slide past the panel's rounded corners for very wide or
    // very narrow triggers.
    const arrowOffset = Math.min(
      PANEL_WIDTH - ARROW_MARGIN,
      Math.max(ARROW_MARGIN, rect.width / 2),
    );

    setPosition({
      top: rect.bottom + gap,
      bottom: window.innerHeight - rect.top + gap,
      left: rect.left,
      right: window.innerWidth - rect.right,
      arrowOffset,
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
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
      <div ref={wrapperRef} className="inline-block">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="block appearance-none rounded-full border-0 bg-transparent p-0 leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2"
        >
          {trigger}
        </button>
      </div>

      {mounted &&
        open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: side === "bottom" ? position.top : undefined,
              bottom: side === "top" ? position.bottom : undefined,
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
                side === "bottom"
                  ? "-top-[5px] border-l border-t"
                  : "-bottom-[5px] border-b border-r",
              )}
            />
            <div
              className={clsx(
                "grid w-56 transition-[grid-template-rows] duration-200 ease-out",
                visible ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div
                  role="menu"
                  className={clsx(
                    "rounded border border-line bg-surface py-1 shadow-sm transition-opacity duration-150",
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
