import { Link, useLocation } from '@tanstack/react-router'
import { ExternalLinkIcon, SparklesIcon } from 'lucide-react'
import brandWordmark from '@/assets/brand/poseforge-wordmark.jpg'
import brandIcon from '@/assets/brand/poseforge-icon.jpg'
import { Badge } from '@/components/ui/badge'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useStudio } from '@/store/studioStore'
import { activeNavTo, navGroups } from './nav'

export function AppSidebar() {
  const pathname = useLocation({ select: (l) => l.pathname })
  const active = activeNavTo(pathname)
  const { recipe } = useStudio()
  const count = [recipe.portrait, recipe.costume, recipe.pose].filter(Boolean).length

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-auto p-1 group-data-[collapsible=icon]:p-0!">
              <Link to="/" aria-label="PoseForge · 灵姿图鉴首页">
                <img src={brandWordmark} alt="PoseForge · 灵姿图鉴" width={1168} height={784} className="h-auto w-full rounded-lg group-data-[collapsible=icon]:hidden" />
                <img src={brandIcon} alt="" width={784} height={1168} className="hidden size-8 shrink-0 rounded-md bg-[#0b0a25] object-contain group-data-[collapsible=icon]:block" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={item.to === active} tooltip={item.title}>
                    <Link to={item.to}>
                      <item.icon />
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px] font-medium">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="当前角色配方">
              <Link to="/studio" className="bg-sidebar-accent/70 hover:bg-sidebar-accent">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SparklesIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-semibold">角色配方槽 ({count}/3)</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {count === 0 ? '未选择 · 点击去捏人' : '点击进入 PoseForge · 灵姿图鉴'}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" asChild tooltip="访问 GitHub 仓库">
              <a
                href="https://github.com/sincalaway/PoseForge"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground"
              >
                <ExternalLinkIcon className="size-3.5" />
                <span>GitHub · PoseForge</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
