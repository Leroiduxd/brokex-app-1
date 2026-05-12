import React, { useState, useCallback } from 'react';
import { usePythBenchmarks } from '../hooks/usePythBenchmarks';
import { formatPrice, formatCompactNumber } from '../utils/ostium/utils';
import { AssetIcon } from './AssetIcon';

export interface AssetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairs: any[];
  isLoading: boolean;
  groups: string[];
  activeGroup: string;
  setActiveGroup: (group: string) => void;
  selectedAsset: string;
  setSelectedAsset: (asset: string) => void;
  prices: any;
  get24hChange?: (asset: string) => number | null;
  themeBorder: string;
  themeText: string;
  themeTextMuted: string;
  themeControlBg: string;
  themeBg: string;
  buyColor: string;
  sellColor: string;
  inline?: boolean;
  apiRates?: any[];
}

// Couleur d'accentuation dorée
const goldAccent = 'rgba(188, 137, 97)';

// --- Sparkline Component (from Markets) ---
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return <span style={{ color: '#444', fontSize: '0.55rem' }}>—</span>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 52, H = 18;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`).join(' L ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <path d={`M ${pts}`} stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const AssetSelectionModal: React.FC<AssetSelectionModalProps> = ({
  isOpen, onClose, pairs, isLoading, groups, activeGroup, setActiveGroup,
  selectedAsset, setSelectedAsset, prices, themeBorder, themeText, themeTextMuted,
  themeControlBg, themeBg, buyColor, sellColor, inline, apiRates
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // --- Favorites state (persisted in localStorage) ---
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('assetFavorites');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleFavorite = useCallback((symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      try { localStorage.setItem('assetFavorites', JSON.stringify([...next])); } catch { }
      return next;
    });
  }, []);

  const { get24hChange, benchmarks, ASSET_TO_PYTH_SYMBOL } = usePythBenchmarks();

  const isMobile = window.innerWidth <= 768;

  if (!isOpen) return null;

  const isFavoritesTab = activeGroup === '__favorites__';

  const filteredPairs = pairs.filter(p => {
    if (isFavoritesTab) return favorites.has(p.from) && p.from.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGroup = activeGroup === 'All' || p.group === activeGroup;
    const matchSearch = p.from.toLowerCase().includes(searchTerm.toLowerCase());
    return matchGroup && matchSearch;
  });

  const innerContent = (
    <>
      {/* Header : Tabs + Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 1.2rem', borderBottom: `1px solid ${themeBorder}`, flexShrink: 0 }}>

        {/* Tabs */}
        <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '0.3rem', alignItems: 'center' }}>
          {/* Favorites tab first */}
          <button
            key="__favorites__"
            onClick={() => setActiveGroup('__favorites__')}
            style={{
              backgroundColor: activeGroup === '__favorites__' ? themeControlBg : 'transparent',
              color: activeGroup === '__favorites__' ? goldAccent : themeTextMuted,
              border: `1px solid ${activeGroup === '__favorites__' ? themeBorder : 'transparent'}`,
              borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.65rem', fontWeight: activeGroup === '__favorites__' ? 600 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', lineHeight: 1
            }}
          >
            Favorites
          </button>
          {groups.map(group => {
            const displayGroup = group.toLowerCase() === 'etf' ? 'ETF' : group.charAt(0).toUpperCase() + group.slice(1);
            const isActive = activeGroup === group;

            return (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                style={{
                  backgroundColor: isActive ? themeControlBg : 'transparent',
                  color: isActive ? goldAccent : themeTextMuted,
                  border: `1px solid ${isActive ? themeBorder : 'transparent'}`,
                  borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.65rem', fontWeight: isActive ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
                }}
              >
                {displayGroup}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: goldAccent, fontSize: '0.8rem' }}>⌕</span>
          <input
            type="text"
            placeholder="Search asset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              backgroundColor: themeControlBg, border: `1px solid ${themeBorder}`, color: themeText,
              borderRadius: '4px', padding: '0.2rem 0.6rem 0.2rem 1.6rem', fontSize: '0.65rem', outline: 'none', width: '120px'
            }}
          />
        </div>
      </div>

      {/* Table Header */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 1.2fr) minmax(80px, 0.85fr) minmax(70px, 0.75fr) minmax(70px, 0.75fr) minmax(65px, 0.7fr) minmax(65px, 0.7fr) minmax(95px, 1.1fr) minmax(95px, 1.1fr) minmax(70px, 0.8fr) minmax(70px, 0.8fr) minmax(60px, 0.7fr) 28px', minWidth: '950px', padding: '0.2rem 1.2rem', color: themeTextMuted, fontSize: '0.45rem', fontWeight: 600, letterSpacing: '0.5px', borderBottom: `1px solid ${themeBorder}`, flexShrink: 0 }}>
          <span>ASSET</span>
          <span style={{ textAlign: 'left' }}>PRICE</span>
          <span style={{ textAlign: 'left' }}>ASK</span>
          <span style={{ textAlign: 'left' }}>BID</span>
          <span style={{ textAlign: 'left' }}>SPREAD</span>
          <span style={{ textAlign: 'left' }}>CHG 24H</span>
          <span style={{ textAlign: 'left' }}>OI LONG</span>
          <span style={{ textAlign: 'left' }}>OI SHORT</span>
          <span style={{ textAlign: 'left' }}>FUND L (1H)</span>
          <span style={{ textAlign: 'left' }}>FUND S (1H)</span>
          <span style={{ textAlign: 'left' }}>TREND</span>
          <span></span>
        </div>
      )}

      {/* Table Body */}
      <div className="hide-scrollbar" style={{ overflowY: 'auto', overflowX: isMobile ? 'hidden' : 'auto', flex: 1 }}>
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: themeTextMuted, fontSize: '0.8rem' }}>Loading assets...</div>
        ) : filteredPairs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: themeTextMuted, fontSize: '0.8rem' }}>No assets found.</div>
        ) : (
          filteredPairs.map(pair => {
            const isSelected = selectedAsset === pair.from;

            // Données de Prix
            const priceData = prices[pair.from];
            const livePrice = priceData?.mid ? Number(priceData.mid) : 0;
            const ask = priceData?.ask ? Number(priceData.ask) : 0;
            const bid = priceData?.bid ? Number(priceData.bid) : 0;
            const spread = (ask && bid) ? formatPrice(ask - bid) : '---';
            const isOpenMarket = priceData ? (priceData.isMarketOpen && !priceData.isDayTradingClosed) : true;

            // Open Interest calculé en base (USD)
            const totalLongOIUsd = pair.longOI * livePrice;
            const totalShortOIUsd = pair.shortOI * livePrice;
            const maxOIFormatted = pair.maxOI ? (Number(pair.maxOI) / 1000000) : 0;

            const longFormatted = formatCompactNumber(totalLongOIUsd);
            const shortFormatted = formatCompactNumber(totalShortOIUsd);
            const maxFormatted = maxOIFormatted > 0 ? formatCompactNumber(maxOIFormatted) : '∞';

            // Données Pyth
            const change24h = get24hChange(pair.from);
            const chgColor = change24h !== null && change24h < 0 ? sellColor : buyColor;

            // Funding Rates API (base is 8h, so divide by 8 for 1h)
            let longRateStr = '---';
            let shortRateStr = '---';
            let lRateColor = themeTextMuted;
            let sRateColor = themeTextMuted;

            if (apiRates && apiRates.length > 0) {
              const currentAssetRates = apiRates.find(
                r => r.pairFrom?.toUpperCase() === pair.from?.toUpperCase()
              );
              if (currentAssetRates) {
                const baseLong = Number(currentAssetRates.longRate);
                const baseShort = Number(currentAssetRates.shortRate);

                const l1h = baseLong / 8;
                const s1h = baseShort / 8;

                longRateStr = `${l1h.toFixed(4)}%`;
                shortRateStr = `${s1h.toFixed(4)}%`;

                lRateColor = l1h < 0 ? sellColor : buyColor;
                sRateColor = s1h < 0 ? sellColor : buyColor;
              }
            }

            // Trend Sparkline
            const pythSym = ASSET_TO_PYTH_SYMBOL[pair.from];
            const sparkline = pythSym && benchmarks[pythSym]?.sparkline ? benchmarks[pythSym].sparkline : [];
            const isFav = favorites.has(pair.from);

            return (
              <div
                key={pair.id}
                onClick={() => { setSelectedAsset(pair.from); onClose(); }}
                style={{
                  display: 'grid', gridTemplateColumns: isMobile ? '1fr auto 28px' : 'minmax(110px, 1.2fr) minmax(80px, 0.85fr) minmax(70px, 0.75fr) minmax(70px, 0.75fr) minmax(65px, 0.7fr) minmax(65px, 0.7fr) minmax(95px, 1.1fr) minmax(95px, 1.1fr) minmax(70px, 0.8fr) minmax(70px, 0.8fr) minmax(60px, 0.7fr) 28px',
                  minWidth: isMobile ? 'auto' : '950px',
                  padding: isMobile ? '0.5rem 1rem' : '0.15rem 1.2rem',
                  alignItems: 'center', cursor: 'pointer', gap: isMobile ? '0.75rem' : '0',
                  borderBottom: `1px solid ${themeBorder}22`, backgroundColor: isSelected ? themeControlBg : 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeControlBg}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? themeControlBg : 'transparent'}
              >
                {/* COL 1: Symbole + Levier */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AssetIcon
                    symbol={`${pair.from}${pair.to}`}
                    size="22px"
                    borderRadius="4px"
                    themeControlBg={themeControlBg}
                    themeText={themeText}
                    themeBorder={themeBorder}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.7rem', color: themeText, lineHeight: 1 }}>
                        {pair.from}/{pair.to}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: themeTextMuted, fontSize: '0.5rem', fontWeight: 400 }}>
                        {pair.highestLeverage ? `${parseInt(pair.highestLeverage)}x` : '100x'}
                      </span>
                      <span style={{ fontSize: '0.45rem', fontWeight: 600, color: isOpenMarket ? buyColor : sellColor, lineHeight: '1', backgroundColor: isOpenMarket ? `${buyColor}11` : `${sellColor}11`, padding: '1px 3px', borderRadius: '2px' }}>
                        {isOpenMarket ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* COL 2 to 9: Desktop specific cols */}
                {!isMobile ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                      <span className="font-mono" style={{ fontSize: '0.65rem', fontWeight: 600, color: themeText, lineHeight: 1.2 }}>${livePrice > 0 ? formatPrice(livePrice) : '---'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                      <span className="font-mono" style={{ color: sellColor, fontSize: '0.6rem', lineHeight: 1.2 }}>{ask > 0 ? formatPrice(ask) : '---'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                      <span className="font-mono" style={{ color: buyColor, fontSize: '0.6rem', lineHeight: 1.2 }}>{bid > 0 ? formatPrice(bid) : '---'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                      <span className="font-mono" style={{ fontSize: '0.6rem', color: themeTextMuted, lineHeight: 1.2 }}>{spread}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                      <span className="font-mono" style={{ fontSize: '0.7rem', color: chgColor, lineHeight: 1, fontWeight: 700 }}>
                        {change24h !== null ? `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%` : '---'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span className="font-mono" style={{ fontSize: '0.6rem', color: buyColor, lineHeight: 1.2, fontWeight: 500 }}>{longFormatted}</span>
                        <span className="font-mono" style={{ fontSize: '0.5rem', color: themeTextMuted, lineHeight: 1.2 }}>/ {maxFormatted}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span className="font-mono" style={{ fontSize: '0.6rem', color: sellColor, lineHeight: 1.2, fontWeight: 500 }}>{shortFormatted}</span>
                        <span className="font-mono" style={{ fontSize: '0.5rem', color: themeTextMuted, lineHeight: 1.2 }}>/ {maxFormatted}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                      <span className="font-mono" style={{ fontSize: '0.6rem', color: lRateColor, lineHeight: 1.2 }}>{longRateStr}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                      <span className="font-mono" style={{ fontSize: '0.6rem', color: sRateColor, lineHeight: 1.2 }}>{shortRateStr}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                      <Sparkline data={sparkline} color={chgColor} />
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <span className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: themeText, lineHeight: 1.2 }}>
                      ${livePrice > 0 ? formatPrice(livePrice) : '---'}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.78rem', color: chgColor, fontWeight: 700, marginTop: '2px' }}>
                      {change24h !== null ? `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%` : '—'}
                    </span>
                  </div>
                )}

                {/* COL last: Favorite Button (right end) */}
                <button
                  onClick={(e) => toggleFavorite(pair.from, e)}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  style={{
                    background: 'none', border: 'none', padding: '2px 3px', cursor: 'pointer',
                    lineHeight: 1,
                    color: isFav ? goldAccent : themeTextMuted,
                    opacity: isFav ? 1 : 0.4,
                    transition: 'color 0.15s, opacity 0.15s',
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                  }}
                  onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = goldAccent; b.style.opacity = '1'; }}
                  onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = isFav ? goldAccent : themeTextMuted; b.style.opacity = isFav ? '1' : '0.45'; }}
                >
                  <svg width="11" height="14" viewBox="0 0 11 14" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 1.75C1 1.336 1.336 1 1.75 1h7.5C9.664 1 10 1.336 10 1.75V13L5.5 10.5 1 13V1.75z" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );

  if (inline) {
    return (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: themeBg, zIndex: 100, display: 'flex', flexDirection: 'column'
      }}>
        {innerContent}
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: themeBg, border: `1px solid ${themeBorder}`, borderRadius: '8px',
          width: '980px',
          height: '550px',
          display: 'flex', flexDirection: 'column', boxShadow: '0 24px 48px rgba(0,0,0,0.9)', overflow: 'hidden'
        }}
      >
        {innerContent}
      </div>
    </div>
  );
};