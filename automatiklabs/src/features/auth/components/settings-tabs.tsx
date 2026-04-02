"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { AccountSettings } from "./account-settings";
import { SubscriptionSettings } from "./subscription-settings";
import { NotificationSettings } from "./notification-settings";
import { PrivacySettings } from "./privacy-settings";
import type { SubscriptionTier } from "@/shared/lib/auth/subscriptions";
import type { ProfileVisibility } from "../types";

interface SettingsTabsProps {
  tier: SubscriptionTier;
  notification_email: boolean;
  notification_push: boolean;
  notification_in_app: boolean;
  profile_visibility: ProfileVisibility;
}

export function SettingsTabs({
  tier,
  notification_email,
  notification_push,
  notification_in_app,
  profile_visibility,
}: SettingsTabsProps) {
  return (
    <Tabs defaultValue="conta">
      <TabsList>
        <TabsTrigger value="conta">Conta</TabsTrigger>
        <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
        <TabsTrigger value="notificacoes">Notificacoes</TabsTrigger>
        <TabsTrigger value="privacidade">Privacidade</TabsTrigger>
      </TabsList>

      <TabsContent value="conta" className="pt-6">
        <AccountSettings />
      </TabsContent>

      <TabsContent value="assinatura" className="pt-6">
        <SubscriptionSettings tier={tier} />
      </TabsContent>

      <TabsContent value="notificacoes" className="pt-6">
        <NotificationSettings
          notification_email={notification_email}
          notification_push={notification_push}
          notification_in_app={notification_in_app}
        />
      </TabsContent>

      <TabsContent value="privacidade" className="pt-6">
        <PrivacySettings profile_visibility={profile_visibility} />
      </TabsContent>
    </Tabs>
  );
}
