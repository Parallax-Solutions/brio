"use client"

import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LocaleSwitcher } from "@/components/shared/locale-switcher"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { AccentColorSelector } from "@/components/shared/accent-color-selector"
import { useTranslations } from "@/lib/i18n/context"
import { useMounted } from "@/hooks/use-mounted"
import { Skeleton } from "@/components/ui/skeleton"

const pageKeys: Record<string, string> = {
  "/dashboard": "dashboard",
  "/income": "income",
  "/recurring": "recurring",
  "/subscriptions": "subscriptions",
  "/variables": "variables",
  "/expenses": "expenses",
  "/rates": "rates",
  "/profile": "profile",
}

export function SiteHeader() {
  const pathname = usePathname()
  const t = useTranslations("navigation")
  const mounted = useMounted()

  const pageKey = pageKeys[pathname] || "dashboard"
  const pageName = t(pageKey)

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2 px-3 sm:px-4 md:px-6 min-w-0">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" className="mr-2 h-4 shrink-0 hidden sm:block" />

        <Breadcrumb className="hidden md:flex min-w-0 flex-1">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                Budget App
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate">{pageName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
          {mounted ? (
            <>
              <LocaleSwitcher />
              <AccentColorSelector />
              <ThemeToggle />
            </>
          ) : (
            <>
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
