import React from 'react';
import { useTheme } from '../ThemeContext';

const ASSETS = [
  { name: 'Bitcoin', symbol: 'BTC', price: '$64,231', oi: '$1.2B', long: 52, short: 48, pnl: '+$1.8M', fees: '$4.2M', lev: '2.4x' },
  { name: 'Ethereum', symbol: 'ETH', price: '$3,452', oi: '$850M', long: 51, short: 49, pnl: '+$0.9M', fees: '$2.8M', lev: '3.1x' },
  { name: 'Solana', symbol: 'SOL', price: '$142.5', oi: '$450M', long: 55, short: 45, pnl: '-$0.4M', fees: '$1.1M', lev: '4.2x' },
  { name: 'Nvidia', symbol: 'NVDA', price: '$892.4', oi: '$620M', long: 60, short: 40, pnl: '+$2.1M', fees: '$1.5M', lev: '1.8x' },
  { name: 'Tesla', symbol: 'TSLA', price: '$175.2', oi: '$380M', long: 45, short: 55, pnl: '-$1.2M', fees: '$0.9M', lev: '2.2x' },
  { name: 'Apple', symbol: 'AAPL', price: '$182.1', oi: '$510M', long: 50, short: 50, pnl: '+$0.3M', fees: '$1.2M', lev: '1.5x' },
  { name: 'Meta', symbol: 'META', price: '$485.3', oi: '$420M', long: 52, short: 48, pnl: '+$0.8M', fees: '$0.7M', lev: '2.5x' },
  { name: 'Amazon', symbol: 'AMZN', price: '$178.4', oi: '$390M', long: 53, short: 47, pnl: '+$0.5M', fees: '$0.6M', lev: '2.1x' },
  { name: 'Euro / USD', symbol: 'EUR', price: '$1.082', oi: '$920M', long: 50, short: 50, pnl: '+$0.1M', fees: '$0.3M', lev: '10x' },
  { name: 'GBP / USD', symbol: 'GBP', price: '$1.264', oi: '$480M', long: 49, short: 51, pnl: '-$0.0M', fees: '$0.2M', lev: '10x' },
  { name: 'JPY / USD', symbol: 'JPY', price: '$0.006', oi: '$350M', long: 48, short: 52, pnl: '-$0.2M', fees: '$0.1M', lev: '10x' },
  { name: 'Gold', symbol: 'XAU', price: '$2,342', oi: '$800M', long: 50, short: 50, pnl: '+$0.2M', fees: '$2.5M', lev: '5x' },
];

const Sparkline = ({ color }: { color: string }) => {
  const points = Array.from({ length: 12 }, () => Math.floor(Math.random() * 20));
  const path = points.map((p, i) => `${i * 10},${20 - p}`).join(' ');
  return (
    <svg width="80" height="20" viewBox="0 0 120 25" style={{ overflow: 'visible' }}>
      <polyline points={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
};

export function VaultAssets() {
  const { themeText, themeBorder, themeTextMuted, sellColor, themeControlBg } = useTheme();
  const posColor = '#3b82f6'; 

  const thStyle: React.CSSProperties = {
    padding: '0.3rem 0.6rem',
    fontWeight: 600, 
    color: themeTextMuted,
    fontSize: '0.55rem', 
    textTransform: 'uppercase', 
    whiteSpace: 'nowrap',
    borderBottom: `1px solid ${themeBorder}`, 
    textAlign: 'left',
    position: 'sticky',
    top: 0,
    backgroundColor: 'rgba(20, 20, 20, 0.98)',
    zIndex: 10
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.4rem 0.6rem',
    fontSize: '0.65rem',
    borderBottom: `1px solid ${themeBorder}`
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto', backgroundColor: 'transparent' }}>
      <style>{`
        .vault-asset-row:hover { background-color: ${themeControlBg}33 !important; }
        .font-mono { font-family: 'Roboto Mono', monospace; }
      `}</style>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: themeText }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th style={{ ...thStyle, paddingLeft: '1.2rem' }}>Asset</th>
            <th style={thStyle}>Price</th>
            <th style={thStyle}>Open Interest</th>
            <th style={thStyle}>OI Trend</th>
            <th style={thStyle}>Long / Short</th>
            <th style={thStyle}>Avg. Lev</th>
            <th style={thStyle}>Unr PnL</th>
            <th style={thStyle}>Fees</th>
          </tr>
        </thead>
        <tbody>
          {ASSETS.map((asset) => (
            <tr key={asset.symbol} className="vault-asset-row" style={{ transition: 'background-color 0.1s' }}>
              <td style={{ ...tdStyle, paddingLeft: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 600 }}>{asset.name}</span>
                  <span style={{ color: themeTextMuted, fontSize: '0.55rem' }}>{asset.symbol}</span>
                </div>
              </td>
              <td style={tdStyle} className="font-mono">{asset.price}</td>
              <td style={tdStyle} className="font-mono">{asset.oi}</td>
              <td style={tdStyle}>
                 <Sparkline color={asset.pnl.startsWith('+') ? posColor : sellColor} />
              </td>
              <td style={tdStyle} className="font-mono">
                <div style={{ display: 'flex', gap: '2px', fontSize: '0.6rem', fontWeight: 600 }}>
                  <span style={{ color: posColor }}>{asset.long}</span>
                  <span style={{ color: themeTextMuted }}>/</span>
                  <span style={{ color: sellColor }}>{asset.short}</span>
                </div>
              </td>
              <td style={tdStyle} className="font-mono">{asset.lev}</td>
              <td style={tdStyle}>
                <span className="font-mono" style={{ color: asset.pnl.startsWith('+') ? posColor : sellColor, fontWeight: 600 }}>{asset.pnl}</span>
              </td>
              <td style={tdStyle} className="font-mono">{asset.fees}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
