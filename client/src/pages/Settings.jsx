import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import ProfileCard from '../components/settings/ProfileCard';
import SettingsSection from '../components/settings/SettingsSection';
import SettingItem from '../components/settings/SettingItem';
import ToggleSwitch from '../components/settings/ToggleSwitch';
import CurrencySelect from '../components/settings/CurrencySelect';

function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currency, setCurrency, currencies } = useCurrency();
  const { settings, updateSetting } = useSettings();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="settings-wrapper flex flex-col min-h-full">
      <p className="text-sm text-secondary mb-6">Manage your preferences and account settings.</p>

      <SettingsSection title="Profile">
        <ProfileCard
          name={user?.name || 'User'}
          email={user?.email || 'No email available'}
          onViewProfile={() => navigate('/settings/profile')}
        />
      </SettingsSection>

      <SettingsSection title="Appearance">
        <SettingItem
          label="Dark Mode"
          description="Switch between dark and light themes"
          control={
            <ToggleSwitch
              checked={isDark}
              onChange={toggleTheme}
            />
          }
        />
        <SettingItem
          label="Compact View"
          description="Reduce spacing in tables"
          control={
            <ToggleSwitch
              checked={settings.compactView}
              onChange={(val) => updateSetting('compactView', val)}
            />
          }
        />
      </SettingsSection>

      <SettingsSection title="Notifications">
        <SettingItem
          label="Notifications"
          description="Push notifications for alerts and account updates"
          control={
            <ToggleSwitch
              checked={settings.notifications}
              onChange={(val) => updateSetting('notifications', val)}
            />
          }
        />
      </SettingsSection>

      <SettingsSection title="Currency">
        <SettingItem
          label="Display Currency"
          description="Used across all markets and charts"
          control={
            <CurrencySelect
              value={currency}
              onChange={setCurrency}
              currencies={currencies}
            />
          }
        />
      </SettingsSection>

      <footer className="text-center text-xs text-muted pt-4 border-t border-subtle flex justify-center gap-5 mt-auto">
        <span>© 2024 FinTracker Inc. All rights reserved.</span>
        <div className="flex gap-3.5">
          <a href="#" className="text-inherit no-underline">Terms</a>
          <a href="#" className="text-inherit no-underline">Privacy</a>
          <a href="#" className="text-inherit no-underline">Support</a>
        </div>
      </footer>
    </div>
  );
}

export default Settings;
