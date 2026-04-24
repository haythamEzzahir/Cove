import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import ProfileCard from '../components/settings/ProfileCard';
import SettingsSection from '../components/settings/SettingsSection';
import SettingItem from '../components/settings/SettingItem';
import ToggleSwitch from '../components/settings/ToggleSwitch';
import CurrencySelect from '../components/settings/CurrencySelect';

const USER = {
  name: 'Ali Karim',
  email: 'ali@cryptowatch.io',
};

function Settings() {
  const navigate = useNavigate();
  const { settings, updateSetting } = useSettings();

  return (
    <div className="p-8 bg-[#0d1117] text-[#e6edf3]">
      <p className="text-sm text-[#c9d1d9] mb-6">Manage your preferences and account settings.</p>

      <SettingsSection title="Profile">
        <ProfileCard
          name={USER.name}
          email={USER.email}
          onViewProfile={() => navigate('/settings/profile')}
        />
      </SettingsSection>

      <SettingsSection title="Appearance">
        <SettingItem
          label="Dark Mode"
          description="Switch between dark and light themes"
          control={
            <ToggleSwitch
              checked={settings.darkMode}
              onChange={(val) => updateSetting('darkMode', val)}
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
          label="Price Alerts"
          description="Push notifications for alerts"
          control={
            <ToggleSwitch
              checked={settings.priceAlerts}
              onChange={(val) => updateSetting('priceAlerts', val)}
            />
          }
        />
        <SettingItem
          label="Market News"
          description="Daily news digest"
          control={
            <ToggleSwitch
              checked={settings.marketNews}
              onChange={(val) => updateSetting('marketNews', val)}
            />
          }
        />
        <SettingItem
          label="Portfolio Summary"
          description="Weekly performance report"
          control={
            <ToggleSwitch
              checked={settings.portfolioSummary}
              onChange={(val) => updateSetting('portfolioSummary', val)}
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
              value={settings.currency}
              onChange={(val) => updateSetting('currency', val)}
            />
          }
        />
      </SettingsSection>

      <footer className="text-center text-xs text-[#7d8590] pt-4 border-t border-[#21262d] flex justify-center gap-5 mt-6">
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