import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';

const goldAccent = '#BC8961';

export function VaultTradeWidget() {
  const { themeBg, themeText, themeBorder, themeTextMuted, buyColor, sellColor, themeControlBg } = useTheme();
  const [buyAmount, setBuyAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${themeBorder}`, padding: '2px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <button 
          onClick={() => setIsBuying(true)}
          style={{ flex: 1, padding: '6px', border: 'none', backgroundColor: isBuying ? goldAccent : 'transparent', color: isBuying ? '#fff' : themeTextMuted, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px', transition: 'all 0.2s' }}
        >
          Mint LP
        </button>
        <button 
          onClick={() => setIsBuying(false)}
          style={{ flex: 1, padding: '6px', border: 'none', backgroundColor: !isBuying ? sellColor : 'transparent', color: !isBuying ? '#fff' : themeTextMuted, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px', transition: 'all 0.2s' }}
        >
          Redeem
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
          <span style={{ color: themeTextMuted }}>{isBuying ? 'Amount (USDC)' : 'Amount (BRKLP)'}</span>
          <span style={{ color: goldAccent }}>Max</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: themeControlBg, borderRadius: '6px', padding: '8px 12px', border: `1px solid ${themeBorder}` }}>
          <input 
            type="number" 
            value={buyAmount} 
            onChange={(e) => setBuyAmount(e.target.value)}
            placeholder="0.00" 
            style={{ background: 'none', border: 'none', color: themeText, flex: 1, fontSize: '0.9rem', outline: 'none', fontWeight: 600 }} 
          />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: themeText }}>{isBuying ? 'USDC' : 'BRKLP'}</span>
        </div>
      </div>

      <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${themeBorder}`, fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: themeTextMuted }}>Exchange Rate</span>
          <span style={{ color: themeText }} className="font-mono">1 BRKLP = 1.32 USDC</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: themeTextMuted }}>Receive</span>
          <span style={{ fontWeight: 700, color: themeText }} className="font-mono">{buyAmount ? (Number(buyAmount) * (isBuying ? 0.757 : 1.32)).toFixed(2) : '0.00'} {isBuying ? 'BRKLP' : 'USDC'}</span>
        </div>
      </div>

      <button style={{ width: '100%', padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: isBuying ? goldAccent : sellColor, color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
        {isBuying ? 'Confirm Mint' : 'Confirm Redemption'}
      </button>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${themeBorder}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
          <div style={{ fontSize: '0.6rem', color: themeTextMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Unrealized PnL</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.55rem', color: themeTextMuted }}>Longs</span>
              <span style={{ color: buyColor, fontWeight: 700, fontSize: '0.7rem' }} className="font-mono">+$1.8M</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.55rem', color: themeTextMuted }}>Shorts</span>
              <span style={{ color: sellColor, fontWeight: 700, fontSize: '0.7rem' }} className="font-mono">-$4.2M</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.6rem', color: themeTextMuted, lineHeight: 1.3, padding: '0 4px' }}>
          Vault performance is influenced by trader PnL and funding rates. Liquidation fees: 0.12%. Mint fee: 0.05%.
        </div>
      </div>

    </div>
  );
}
