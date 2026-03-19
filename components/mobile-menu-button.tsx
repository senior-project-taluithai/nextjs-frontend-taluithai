"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

export function MobileMenuButton() {
  const { isMobile, toggleSidebar } = useSidebar()

  if (!isMobile) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="fixed top-4 left-4 z-[60] h-10 w-10 bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg"
    >
      <Menu className="h-5 w-5" />
    </Button>
  )
}
