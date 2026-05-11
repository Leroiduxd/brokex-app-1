import React from 'react';
import { useTheme } from '../ThemeContext';

const OI_DATA = [
  { symbol: 'BTC', value: 1200, color: '#BC8961' },
  { symbol: 'ETH', value: 850, color: '#D4AF37' },
  { symbol: 'EUR', value: 920, color: '#AA8C66' },
  { symbol: 'NVDA', value: 620, color: '#8C6239' },
  { symbol: 'AAPL', value: 510, color: '#5E412F' },
  { symbol: 'GBP', value: 480, color: '#442F22' },
  { symbol: 'SOL', value: 450, color: '#BC8961' },
  { symbol: 'META', value: 420, color: '#D4AF37' },
  { symbol: 'AMZN', value: 390, color: '#AA8C66' },
  { symbol: 'TSLA', value: 380, color: '#8C6239' },
];

export function VaultOIChart() {
  const { themeBorder, themeTextMuted } = useTheme();
  const total = OI_DATA.reduce((acc, curr) => acc + curr.value, 0);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', height: '100%' }}>
      <div style={{ fontSize: '0.55rem', color: themeTextMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
        OI Heatmap
      </div>
      
      <div style={{ 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1px', 
        width: '100%', 
        borderRadius: '3px', 
        overflow: 'hidden',
        backgroundColor: themeBorder
      }}>
        {/* Row 1 */}
        <div style={{ flex: 4, display: 'flex', gap: '1px' }}>
          <div style={{ flex: 6, backgroundColor: OI_DATA[0].color, display: 'flex', flexDirection: 'column', padding: '6px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#000' }}>{OI_DATA[0].symbol}</span>
            <span style={{ fontSize: '0.5rem', color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>18%</span>
          </div>
          <div style={{ flex: 4, display: 'flex', flexDirection: 'column', gap: '1px' }}>
             <div style={{ flex: 1, backgroundColor: OI_DATA[1].color, padding: '4px' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#000' }}>{OI_DATA[1].symbol}</div>
             </div>
             <div style={{ flex: 1, backgroundColor: OI_DATA[2].color, padding: '4px' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#000' }}>{OI_DATA[2].symbol}</div>
             </div>
          </div>
        </div>
        {/* Row 2 */}
        <div style={{ flex: 3, display: 'flex', gap: '1px' }}>
           <div style={{ flex: 1, backgroundColor: OI_DATA[3].color, padding: '4px' }}>
              <div style={{ fontSize: '0.5rem', fontWeight: 700, color: '#000' }}>{OI_DATA[3].symbol}</div>
           </div>
           <div style={{ flex: 1, backgroundColor: OI_DATA[4].color, padding: '4px' }}>
              <div style={{ fontSize: '0.5rem', fontWeight: 700, color: '#000' }}>{OI_DATA[4].symbol}</div>
           </div>
           <div style={{ flex: 1, backgroundColor: OI_DATA[5].color, padding: '4px' }}>
              <div style={{ fontSize: '0.5rem', fontWeight: 700, color: '#000' }}>{OI_DATA[5].symbol}</div>
           </div>
        </div>
        {/* Row 3 */}
        <div style={{ flex: 2, display: 'flex', gap: '1px' }}>
            {OI_DATA.slice(6, 10).map((item, i) => (
                <div key={i} style={{ flex: 1, backgroundColor: item.color, padding: '3px' }}>
                    <div style={{ fontSize: '0.45rem', fontWeight: 600, color: '#000' }}>{item.symbol}</div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
