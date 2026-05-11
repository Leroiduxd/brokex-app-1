import React from 'react';
import { useTheme } from '../ThemeContext';
import { VaultChart } from '../components/VaultChart';
import { VaultOIChart } from '../components/VaultOIChart';
import { VaultTradeWidget } from '../components/VaultTradeWidget';
import { VaultAssets } from '../components/VaultAssets';

const StatItem = ({ label, value, trend }: { label: string, value: string, trend?: string }) => {
  const { themeTextMuted, themeText } = useTheme();
  const posColor = '#3b82f6'; // Blue
  const negColor = '#ef4444'; // Red

  return (
    <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }}>
      <span style={{ fontSize: '0.55rem', color: themeTextMuted, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: themeText, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
        {value}
        {trend && <span style={{ fontSize: '0.6rem', color: trend.startsWith('+') ? posColor : negColor }}>{trend}</span>}
      </div>
    </div>
  );
};

export function Vault() {
  const { themeBg, themeBorder } = useTheme();

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', backgroundColor: themeBg, overflow: 'hidden' }}>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', borderRight: `1px solid ${themeBorder}` }}>
        
        {/* Stats Header (Blue/Red theme) */}
        <div style={{ height: '32px', flexShrink: 0, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${themeBorder}`, backgroundColor: 'rgba(255,255,255,0.01)', padding: '0 8px', gap: '8px' }}>
          <StatItem label="OI Total" value="$2.87B" trend="+4.2%" />
          <div style={{ width: '1px', height: '12px', backgroundColor: themeBorder, opacity: 0.5 }} />
          <StatItem label="Volume 24h" value="$842.5M" trend="+12.8%" />
          <div style={{ width: '1px', height: '12px', backgroundColor: themeBorder, opacity: 0.5 }} />
          <StatItem label="Fees Total" value="$14.2M" />
          <div style={{ width: '1px', height: '12px', backgroundColor: themeBorder, opacity: 0.5 }} />
          <StatItem label="Stress Factor" value="8.4" />
        </div>

        {/* 60/40 Split Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          
          {/* Top Panel: Charts Row (approx 60% height) */}
          <div style={{ flex: 1.5, minHeight: 0, display: 'flex', borderBottom: `1px solid ${themeBorder}`, overflow: 'hidden' }}>
             <div style={{ flex: 1.8, borderRight: `1px solid ${themeBorder}`, minWidth: 0 }}>
                <VaultChart />
             </div>
             <div style={{ flex: 1, flexShrink: 0, display: 'flex', flexDirection: 'column', minWidth: 260 }}>
                <VaultOIChart />
             </div>
          </div>
          
          {/* Bottom Panel: Assets List (approx 40% height) */}
          <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, width: '100%', overflowY: 'auto', backgroundColor: themeBg }}>
             <VaultAssets />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: themeBg, height: '100%', overflowY: 'auto' }}>
        <VaultTradeWidget />
      </aside>

    </div>
  );
}
