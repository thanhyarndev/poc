import SettingsForm from "@/components/page/user-settings";
import React from "react";

const SettingsPage: React.FC = () => {
  return (
    <div className="px-12 py-6 bg-gray-100">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
};

export default SettingsPage;
