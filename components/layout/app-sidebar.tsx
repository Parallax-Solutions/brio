"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  CreditCardIcon,
  HomeIcon,
  ReceiptIcon,
  RefreshCwIcon,
  Settings,
  TrendingUpIcon,
  WalletIcon,
  LogOut,
  ChevronUp,
  DollarSign,
  PiggyBankIcon,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "@/lib/i18n/context"
import { useMounted } from "@/hooks/use-mounted"
import { Role } from "@prisma/client"
import { canManageUsers } from "@/lib/utils/permissions"

const NAV_ITEMS = [
  {
    key: "dashboard",
    href: "/dashboard",
    icon: HomeIcon,
  },
  {
    key: "income",
    href: "/income",
    icon: DollarSign,
  },
  {
    key: "recurring",
    href: "/recurring",
    icon: RefreshCwIcon,
  },
  {
    key: "subscriptions",
    href: "/subscriptions",
    icon: CreditCardIcon,
  },
  {
    key: "variables",
    href: "/variables",
    icon: ReceiptIcon,
  },
  {
    key: "expenses",
    href: "/expenses",
    icon: WalletIcon,
  },
  {
    key: "savings",
    href: "/savings",
    icon: PiggyBankIcon,
  },
  {
    key: "rates",
    href: "/rates",
    icon: TrendingUpIcon,
  },
]

// Admin-only nav items
const ADMIN_NAV_ITEMS = [
  {
    key: "users",
    href: "/users",
    icon: Users,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string | null
    email?: string | null
    avatarPublicUrl?: string | null
    role?: Role
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations("navigation")
  const { isMobile, setOpenMobile } = useSidebar()
  const mounted = useMounted()

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0" {...props}>
      {/* Gradient background overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
      
      {/* Subtle pattern overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <SidebarHeader className="relative">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group/logo">
              <Link href="/dashboard" onClick={handleLinkClick}>
                <div className="relative flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 group-hover/logo:shadow-xl group-hover/logo:shadow-primary/30 group-hover/logo:scale-105">
                  <Zap className="size-5" />
                  <Sparkles className="absolute -top-1 -right-1 size-3 text-primary-foreground/80 animate-pulse" />
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-collapsible-icon:hidden">
                  <span className="truncate text-base font-bold tracking-tight">{t("appName")}</span>
                  <span className="text-muted-foreground truncate text-xs font-medium">
                    {t("tagline")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Decorative line */}
        <div className="mx-3 mt-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </SidebarHeader>

      <SidebarContent className="relative">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t("menu")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive} 
                      tooltip={t(item.key)}
                      className={`
                        relative transition-all duration-200
                        ${isActive ? 'bg-primary/10 text-primary font-medium' : ''}
                        hover:translate-x-0.5
                      `}
                    >
                      <Link href={item.href} onClick={handleLinkClick}>
                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-lg shadow-primary/50" />
                        )}
                        <item.icon className={`transition-colors ${isActive ? 'text-primary' : ''}`} />
                        <span>{t(item.key)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              
              {/* Admin-only navigation items */}
              {user?.role && canManageUsers(user.role) && (
                <>
                  {ADMIN_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    
                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive} 
                          tooltip={t(item.key)}
                          className={`
                            relative transition-all duration-200
                            ${isActive ? 'bg-primary/10 text-primary font-medium' : ''}
                            hover:translate-x-0.5
                          `}
                        >
                          <Link href={item.href} onClick={handleLinkClick}>
                            {isActive && (
                              <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-lg shadow-primary/50" />
                            )}
                            <item.icon className={`transition-colors ${isActive ? 'text-primary' : ''}`} />
                            <span>{t(item.key)}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="relative">
        {/* Decorative line */}
        <div className="mx-3 mb-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <SidebarMenu>
          <SidebarMenuItem>
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="group/user transition-all duration-200 hover:bg-primary/5 data-[state=open]:bg-primary/10"
                  >
                    <Avatar className="h-9 w-9 rounded-xl ring-2 ring-primary/20 transition-all group-hover/user:ring-primary/40">
                      {user?.avatarPublicUrl && (
                        <AvatarImage src={user.avatarPublicUrl} alt={user?.name || "User"} />
                      )}
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left leading-tight group-data-collapsible-icon:hidden">
                      <span className="truncate font-semibold">{user?.name || "User"}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {user?.email || ""}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto size-4 text-muted-foreground transition-transform group-data-[state=open]/user:rotate-180 group-data-collapsible-icon:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl border-primary/20 bg-sidebar shadow-xl shadow-primary/10"
                  side="top"
                  align="end"
                  sideOffset={8}
                >
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5 px-3 focus:bg-primary/10 focus:text-primary">
                    <Link href="/profile" onClick={handleLinkClick} className="flex items-center">
                      <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t("profile")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-border to-transparent my-1" />
                  <DropdownMenuItem 
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="rounded-lg cursor-pointer py-2.5 px-3 text-rose-500 focus:bg-rose-500/10 focus:text-rose-500"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium">{t("logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton size="lg" className="group/user">
                <Avatar className="h-9 w-9 rounded-xl ring-2 ring-primary/20">
                  {user?.avatarPublicUrl && (
                    <AvatarImage src={user.avatarPublicUrl} alt={user?.name || "User"} />
                  )}
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight group-data-collapsible-icon:hidden">
                  <span className="truncate font-semibold">{user?.name || "User"}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.email || ""}
                  </span>
                </div>
                <ChevronUp className="ml-auto size-4 text-muted-foreground group-data-collapsible-icon:hidden" />
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
