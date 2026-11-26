"use client";

import {
  IconDeviceMobile,
  IconDotsVertical,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react";
import { useState } from "react";
import { PwaInstallDialog } from "~/components/pwa/pwa-install-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { AccountDialog } from "~/components/user/account-dialog";
import { useCurrentUser } from "~/hooks";
import { usePwaInstall } from "~/hooks/use-pwa-install";
import { authClient } from "~/server/better-auth/client";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}) {
  const { isMobile } = useSidebar();
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [pwaDialogOpen, setPwaDialogOpen] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const { canShowMenuAction, hasNativePrompt, isIos, promptInstall } =
    usePwaInstall();

  const handleInstallApp = async () => {
    if (hasNativePrompt) {
      const outcome = await promptInstall();
      if (outcome !== "unavailable") {
        return;
      }
    }
    setPwaDialogOpen(true);
  };

  const displayName = currentUser?.name || user.name;
  const rawEmail = currentUser?.email || user.email;
  const displayEmail = rawEmail.endsWith("@sandaran.internal")
    ? currentUser?.phoneNumber || "Login via No. HP"
    : rawEmail;
  const displayAvatar = currentUser?.image || user.avatar;
  const initials = displayName.substring(0, 2).toUpperCase() || "US";

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarImage
                    src={displayAvatar || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {displayEmail}
                  </span>
                </div>
                <IconDotsVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={displayAvatar || undefined}
                      alt={displayName}
                    />
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {displayEmail}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setAccountDialogOpen(true)}
                className="cursor-pointer"
              >
                <IconUserCircle />
                Pengaturan Akun
              </DropdownMenuItem>
              {canShowMenuAction && (
                <DropdownMenuItem
                  onClick={() => void handleInstallApp()}
                  className="cursor-pointer"
                >
                  <IconDeviceMobile />
                  Install Aplikasi
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={async () => {
                  await authClient.signOut();
                  window.location.href = "/";
                }}
                className="cursor-pointer"
              >
                <IconLogout />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
      />
      <PwaInstallDialog
        open={pwaDialogOpen}
        onOpenChange={setPwaDialogOpen}
        isIos={isIos}
      />
    </>
  );
}
