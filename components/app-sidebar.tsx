"use client"

import * as React from "react"
import {
  Compass,
  Heart,
  LogIn,
  Map,
  MapPin,
  Sparkles,
  UserPlus
} from "lucide-react"

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
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useAuth } from "@/components/providers/AuthProvider"

// Mock data for navigation only (user data removed)

const data = {
  mainNav: [
    {
      title: "Explore",
      url: "/explore",
      icon: Compass,
      isActive: true,
    },
    {
      title: "My Trips",
      url: "/trips",
      icon: Map,
    },
    {
      title: "Saved Places",
      url: "/saved",
      icon: Heart,
    },
  ],
  aiFeature: {
    title: "AI Trip Planner",
    url: "/ai-planner",
    icon: Sparkles,
    description: "Chat with AI to plan your trip",
  },
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isMounted, setIsMounted] = React.useState(false)
  const { user, logout } = useAuth();


  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
              <SidebarMenuButton size="lg" asChild className="w-auto group-data-[collapsible=icon]:hidden">
                <a href="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <MapPin className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">TaluiThai</span>
                    <span className="truncate text-xs">Travel Agent</span>
                  </div>
                </a>
              </SidebarMenuButton>
              <SidebarTrigger className="hidden md:flex ml-auto group-data-[collapsible=icon]:ml-0" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* AI Feature Highlight */}
        <SidebarGroup>
          <SidebarGroupLabel>AI Assistant</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="lg" className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-100/20 dark:border-indigo-500/20 transition-all duration-300">
                  <a href={data.aiFeature.url} className="group">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white group-hover:scale-105 transition-transform">
                      <data.aiFeature.icon className="size-4 opacity-100" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-200">
                        {data.aiFeature.title}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {data.aiFeature.description}
                      </span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Discover</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                    <a href={item.url}>
                      <item.icon />
                      <span className="truncate">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full justify-center p-0 overflow-hidden"
                  >
                    <div className="flex w-full items-center gap-2">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                        <AvatarFallback className="rounded-lg">{user.firstName?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">{user.firstName} {user.lastName}</span>
                        <span className="truncate text-xs">{user.email}</span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" align="end" sideOffset={4}>
                  <DropdownMenuItem onClick={() => logout()}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Log In" asChild>
                  <a href="/auth/login">
                    <LogIn className="size-4" />
                    <span>Log In</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Register" className="text-primary hover:text-primary" asChild>
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

