"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Compass,
  Heart,
  LogIn,
  Map,
  Sparkles,
  UserPlus,
  Settings,
  Leaf,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/components/providers/AuthProvider"
import { useLogoutMutation } from "@/hooks/api/useAuth"

/* ─── Navigation items ─── */
const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/my-trip", label: "My Trips", icon: Map },
  { href: "/saved", label: "Saved Places", icon: Heart },
]

/* ─── 3-D floating orbs inside the sidebar ─── */
const SIDE_ORBS = [
  { size: 200, x: "-30%", y: "5%", color: "#059669", dur: 16, delay: 0 },
  { size: 140, x: "40%", y: "40%", color: "#0d9488", dur: 20, delay: 5 },
  { size: 100, x: "-10%", y: "72%", color: "#10b981", dur: 14, delay: 9 },
]

function SidebarOrb({ orb }: { orb: typeof SIDE_ORBS[0] }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: orb.size,
        height: orb.size,
        left: orb.x,
        top: orb.y,
        background: `radial-gradient(circle at 38% 35%, ${orb.color}55 0%, ${orb.color}22 50%, transparent 100%)`,
        filter: "blur(32px)",
      }}
      animate={{ y: [0, -30, 15, -12, 0], x: [0, 15, -10, 8, 0], scale: [1, 1.1, 0.95, 1.05, 1] }}
      transition={{ duration: orb.dur, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}

/* ─── 3-D Nav Item ─── */
function NavItem3D({ href, label, icon: Icon, collapsed }: {
  href: string; label: string; icon: React.ElementType; collapsed: boolean;
}) {
  const ref = React.useRef<HTMLAnchorElement>(null)
  const pathname = usePathname()
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [5, -5]), { stiffness: 260, damping: 22 })
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-5, 5]), { stiffness: 260, damping: 22 })

  const handleMove = React.useCallback((e: React.MouseEvent) => {
    const el = ref.current; if (!el) return
    const rect = el.getBoundingClientRect()
    rawX.set((e.clientX - rect.left) / rect.width - 0.5)
    rawY.set((e.clientY - rect.top) / rect.height - 0.5)
  }, [rawX, rawY])
  const handleLeave = () => { rawX.set(0); rawY.set(0) }

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group ${isActive ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/8 hover:text-white/80"
        }`}
      style={{ perspective: "600px", transformStyle: "preserve-3d" } as React.CSSProperties}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="flex items-center gap-3 w-full"
      >
        <motion.div
          animate={{ scale: isActive ? 1.1 : 1, rotateZ: isActive ? [0, -8, 8, 0] : 0 }}
          transition={{ duration: 0.4 }}
          style={{ transform: "translateZ(8px)" }}
        >
          <Icon
            className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-white/40 group-hover:text-white/60"
              }`}
          />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              style={{ transform: "translateZ(4px)" }}
              className="text-sm font-medium"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        {/* Active indicator bar */}
        {isActive && (
          <motion.div
            layoutId="activeBar"
            className="ml-auto w-1 h-5 rounded-full bg-emerald-400 shrink-0"
            style={{ transform: "translateZ(6px)" }}
          />
        )}
      </motion.div>
    </Link>
  )
}

/* ─── 3-D Logo badge ─── */
function Logo3D({ collapsed }: { collapsed: boolean }) {
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [10, -10]), { stiffness: 240, damping: 20 })
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-10, 10]), { stiffness: 240, damping: 20 })

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-5 border-b border-white/10"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        rawX.set((e.clientX - rect.left) / rect.width - 0.5)
        rawY.set((e.clientY - rect.top) / rect.height - 0.5)
      }}
      onMouseLeave={() => { rawX.set(0); rawY.set(0) }}
      style={{ perspective: "600px" } as React.CSSProperties}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/40"
      >
        {/* "floating" leaf icon */}
        <motion.div style={{ transform: "translateZ(6px)" }}>
          <Leaf className="w-5 h-5 text-white" />
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-white font-semibold text-base leading-tight">TaluiThai</p>
            <p className="text-white/40 text-xs">Travel Agent</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Main Sidebar export ─── */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isMounted, setIsMounted] = React.useState(false)
  const { user } = useAuth()
  const logoutMutation = useLogoutMutation()
  const router = useRouter()
  const pathname = usePathname()
  const { state: sidebarState } = useSidebar()
  const collapsed = sidebarState === "collapsed"

  const isAIPlannerActive = pathname.startsWith("/ai-planner")

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    router.push("/auth/login")
  }

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="!bg-[#0f1923] !border-r-0 overflow-hidden"
    >
      {/* 3-D floating orbs background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {SIDE_ORBS.map((o, i) => <SidebarOrb key={i} orb={o} />)}
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <SidebarHeader className="relative z-10 p-0">
        <Logo3D collapsed={collapsed} />
      </SidebarHeader>

      <SidebarContent className="relative z-10">
        {/* AI Trip Planner Highlight */}
        <SidebarGroup className="px-3 pt-4 pb-2">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link
                  href="/ai-planner"
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 overflow-hidden relative ${isAIPlannerActive
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-white/10 hover:bg-white/15 text-white"
                    }`}
                >
                  {/* animated gradient shimmer when active */}
                  {isAIPlannerActive && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                      }}
                    />
                  )}
                  <motion.div
                    animate={{ rotateY: isAIPlannerActive ? [0, 360] : 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </motion.div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs font-medium text-white/60 leading-none mb-0.5">AI Assistant</p>
                        <p className="text-sm font-semibold text-white">AI Trip Planner</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup className="flex-1 px-3 py-2">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SidebarGroupLabel className="text-xs text-white/30 px-2 pb-1 uppercase tracking-widest">
                  Discover
                </SidebarGroupLabel>
              </motion.div>
            )}
          </AnimatePresence>
          <SidebarGroupContent>
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavItem3D key={item.href} {...item} collapsed={collapsed} />
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="relative z-10 border-t border-white/10 px-3 py-3">
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-white/10 w-full justify-center p-0 overflow-hidden hover:bg-white/5 transition-colors"
                  >
                    <div className="flex w-full items-center gap-3">
                      <motion.div
                        whileHover={{ rotateY: 180 }}
                        transition={{ duration: 0.5 }}
                        style={{ perspective: "400px" } as React.CSSProperties}
                      >
                        <Avatar className="h-9 w-9 rounded-full">
                          <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                          <AvatarFallback className="rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-500/30">
                            {user.firstName?.charAt(0) || user.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 overflow-hidden min-w-0 text-left"
                          >
                            <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-white/40 truncate">{user.email}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" align="end" sideOffset={4}>
                  <DropdownMenuItem asChild>
                    <a href="/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Log out
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will log you out of your account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Log In" asChild className="text-white/50 hover:text-white hover:bg-white/10">
                  <a href="/auth/login">
                    <LogIn className="size-4" />
                    <span>Log In</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Register" className="text-emerald-400 hover:text-emerald-300 hover:bg-white/10" asChild>
                  <a href="/auth/register">
                    <UserPlus className="size-4" />
                    <span>Register</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
