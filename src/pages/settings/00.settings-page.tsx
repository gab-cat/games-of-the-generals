import { SettingsList } from "./06.settings-list";

export function SettingsPage() {
  return (
    <div className="min-h-screen py-10 px-2 sm:px-6 relative overflow-hidden font-sans text-zinc-300">
      <div className="max-w-7xl mx-auto relative z-10">
        <SettingsList />
      </div>
    </div>
  );
}
