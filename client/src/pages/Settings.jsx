import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import ProfileCard from '../components/settings/ProfileCard';
import SettingsSection from '../components/settings/SettingsSection';
import SettingItem from '../components/settings/SettingItem';
import ToggleSwitch from '../components/settings/ToggleSwitch';
import CurrencySelect from '../components/settings/CurrencySelect';
import '../styles/settings.css';

const USER = {
  name: 'Ali Karim',
  email: 'ali@cryptowatch.io',
};

function Settings({ onNavigate }) {
  const { settings, updateSetting } = useSettings();
  const [search, setSearch] = useState('');

  return (
    <div className="settings-wrapper">
      <div className="settings-topbar">
        <div className="settings-title-block">
          <h1>Settings</h1>
          <p>Preferences</p>
        </div>
      </div>

      <SettingsSection title="Profile">
        <ProfileCard
          name={USER.name}
          email={USER.email}
          onViewProfile={() => onNavigate('profile')}
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
    </div>
  );
}

export default Settings;