"use client";

import { useState } from "react";

export function useDisclosure(defaultState = false) {
  const [isOpen, setIsOpen] = useState(defaultState);

  return {
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    onToggle: () => setIsOpen(!isOpen),
  };
}
