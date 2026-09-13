"use client";

import { createContext, useContext, type ReactNode } from "react";

interface DropdownContextValue {
  close: () => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

export function DropdownContextProvider({
  close,
  children,
}: {
  close: () => void;
  children: ReactNode;
}) {
  return (
    <DropdownContext.Provider value={{ close }}>
      {children}
    </DropdownContext.Provider>
  );
}

export function useDropdown() {
  const context = useContext(DropdownContext);

  if (!context) {
    throw new Error("useDropdown must be used inside a Dropdown");
  }

  return context;
}
