import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { usePriceContext } from '../contexts/PriceContext';
import { useOstiumSubgraph } from '../hooks/useOstiumSubgraph';
import { usePythBenchmarks } from '../hooks/usePythBenchmarks';
import { useNetwork } from '../contexts/NetworkContext';
import { mapPair, formatCompactNumber, formatPrice } from '../utils/ostium/utils';

// Import du composant Modal
import { AssetSelectionModal } from '../components/AssetSelectionModal';
import { AssetIcon } from './AssetIcon';

// Color Constants
const goldAccent = '#BC8961';
const goldAccentLight = 'rgba(188, 137, 97, 0.1)';

// ============================================================================
// 1. COMPOSANT : TRADE HEADER
// ============================================================================

export const TradeHeader = () => {
  const { themeBorder, themeText, themeTextMuted, themeControlBg, buyColor, sellColor, themeBg } = useTheme();
  const { prices, selectedAsset, setSelectedAsset, currentPriceData } = usePriceContext();
  const { getPairs } = useOstiumSubgraph();
  const { get24hChange } = usePythBenchmarks();

  // NEW: View mode state (Chart vs List)
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');

  const { symbol } = useParams<{ symbol?: string }>();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pairs, setPairs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState('All');

  // Solana network state
  const { cluster } = useNetwork();

  // Funding Rates API State
  const [apiRates, setApiRates] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'1h' | '8h' | '24h'>('1h');
  const [isTimeframeMenuOpen, setIsTimeframeMenuOpen] = useState(false);
  const timeframeMenuRef = useRef<HTMLDivElement>(null);

  // 1.5. Listen for external events to close the asset modal (e.g. from PositionsPanel edit modals)
  useEffect(() => {
    const handleCloseModal = () => setIsMenuOpen(false);
    window.addEventListener('closeAssetModal', handleCloseModal);
    return () => window.removeEventListener('closeAssetModal', handleCloseModal);
  }, []);

  const selectedNetwork =
    cluster === 'mainnet' ? 'Solana Mainnet' : cluster === 'testnet' ? 'Solana Testnet' : 'Solana Devnet';

  // 2. Fetch Pairs (Normal)
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getPairs().then(data => {
      if (mounted) {
        setPairs(data.map(mapPair));
        setIsLoading(false);
      }
    }).catch(err => {
      console.error(err);
      if (mounted) setIsLoading(false);
    });
    return () => { mounted = false; };
  }, [getPairs]);

  // 3. Fetch de l'API Ostium (refresh toutes les 30s)
  useEffect(() => {
    let mounted = true;
    const fetchRates = () => {
      fetch('/api/datalake/rates/current')
        .then(res => res.json())
        .then(res => {
          if (mounted && res.success) {
            setApiRates(res.data);
          }
        })
        .catch(console.error);
    };
    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Click outside handlers
  const timeframeDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isClickInsideTrigger = timeframeMenuRef.current && timeframeMenuRef.current.contains(event.target as Node);
      const isClickInsideDropdown = timeframeDropdownRef.current && timeframeDropdownRef.current.contains(event.target as Node);

      if (!isClickInsideTrigger && !isClickInsideDropdown) {
        setIsTimeframeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // URL Sync
  useEffect(() => {
    if (symbol) {
      let parsedSymbol = symbol.toUpperCase();
      if (parsedSymbol.endsWith('USD') && parsedSymbol !== 'USD') {
        parsedSymbol = parsedSymbol.replace('USD', '').replace('-', '');
      }
      if (parsedSymbol !== selectedAsset) {
        setSelectedAsset(parsedSymbol);
      }
    }
  }, [symbol, selectedAsset, setSelectedAsset]);

  const handleAssetSelect = (newAsset: string) => {
    setSelectedAsset(newAsset);
    navigate(`/${newAsset}USD`, { replace: true });
  };

  const groups = useMemo(() => {
    const rawGroups = pairs.map(p => p.group).filter(Boolean);
    const uniqueGroups = Array.from(new Set(rawGroups));
    const sorted = uniqueGroups.sort((a, b) => a.localeCompare(b));
    return ['All', ...sorted];
  }, [pairs]);

  // General Variables
  const currentPrice = currentPriceData?.mid != null ? formatPrice(currentPriceData.mid) : '---';
  const spread = (currentPriceData?.ask != null && currentPriceData?.bid != null)
    ? formatPrice(Number(currentPriceData.ask) - Number(currentPriceData.bid)) : '---';
  const isMarketOpen = currentPriceData ? (currentPriceData.isMarketOpen && !currentPriceData.isDayTradingClosed) : true;

  // On récupère la paire Subgraph complète (qui contient l'ID correct)
  const selectedPair = useMemo(() => {
    const found = pairs.find(p => p.from === selectedAsset) || pairs[0];
    if (found) return found;
    return {
      from: selectedAsset,
      to: 'USD',
      group: 'Crypto',
      highestLeverage: '100',
      maxLeverage: '100',
      longOI: 0,
      shortOI: 0
    };
  }, [pairs, selectedAsset]);

  const livePrice = currentPriceData?.mid ? Number(currentPriceData.mid) : 0;
  const totalLongOIUsd = selectedPair ? (selectedPair.longOI * livePrice) : 0;
  const totalShortOIUsd = selectedPair ? (selectedPair.shortOI * livePrice) : 0;
  const maxOIFormatted = selectedPair && selectedPair.maxOI ? (Number(selectedPair.maxOI) / 1000000) : 0;
  const dailyChange = get24hChange(selectedAsset);

  // Funding Rate Math & Formatting
  let longRateValue = 0;
  let shortRateValue = 0;
  let hasRates = false;

  // MATCHING par nom d'asset (pairFrom) — plus fiable que l'ID subgraph
  const currentAssetRates = apiRates.find(
    r => r.pairFrom?.toUpperCase() === selectedAsset?.toUpperCase()
  ) ?? null;

  if (currentAssetRates) {
    hasRates = true;
    const baseLong = Number(currentAssetRates.longRate);
    const baseShort = Number(currentAssetRates.shortRate);

    const multiplier = timeframe === '1h' ? (1 / 8) : timeframe === '24h' ? 3 : 1;

    longRateValue = baseLong * multiplier;
    shortRateValue = baseShort * multiplier;
  }

  const formatRate = (rate: number) => {
    if (!hasRates) return '---';
    return `${rate.toFixed(4)}%`;
  };

  const getRateColor = (rate: number) => {
    if (!hasRates) return themeTextMuted;
    return rate < 0 ? sellColor : buyColor;
  };

  const Divider = () => <div style={{ height: '20px', width: '1px', backgroundColor: themeBorder, opacity: 0.6, flexShrink: 0 }}></div>;

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
          padding: '0 0.75rem',
          borderBottom: `1px solid ${themeBorder}`,
          backgroundColor: themeBg,
          flexShrink: 0,
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 100,
        }}
      >
        <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', overflowX: 'auto', flex: 1 }}>

          {/* Asset Trigger */}
          <div
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.3rem 0.5rem 0.3rem 0', borderRadius: '4px', flexShrink: 0 }}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <AssetIcon
              symbol={selectedAsset}
              size="28px"
              borderRadius="6px"
              themeControlBg={themeControlBg}
              themeText={themeText}
              themeBorder={themeBorder}
              style={{ marginRight: '0.75rem' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: themeText, letterSpacing: '-0.01em', lineHeight: '1' }}>
                  {selectedPair ? `${selectedPair.from}/${selectedPair.to}` : selectedAsset}
                </span>
                <span style={{ color: themeTextMuted, fontSize: '0.45rem', marginTop: '2px' }}>▼</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1px' }}>
                <span className="font-mono" style={{ fontSize: '0.55rem', color: themeTextMuted, lineHeight: '1' }}>
                  {selectedPair ? selectedPair.maxLeverage + 'x' : '100x'}
                </span>
                <span style={{ fontSize: '0.55rem', fontWeight: 600, color: isMarketOpen ? buyColor : sellColor, lineHeight: '1', backgroundColor: isMarketOpen ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '1px 4px', borderRadius: '2px' }}>
                  {isMarketOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>
          </div>

          <Divider />

          {/* Price & 24h Change */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '80px', gap: 0, flexShrink: 0 }}>
            <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 600, color: themeText, lineHeight: '1' }}>
              ${currentPrice}
            </span>
            {dailyChange !== null && (
              <span className="font-mono" style={{ fontSize: '0.55rem', fontWeight: 600, color: dailyChange >= 0 ? buyColor : sellColor, lineHeight: '1', marginTop: '4px' }}>
                {dailyChange > 0 ? '+' : ''}{dailyChange.toFixed(2)}%
              </span>
            )}
          </div>

          <Divider />

          {/* Spread */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0 }}>
            <span style={{ fontSize: '0.55rem', color: themeTextMuted, lineHeight: '1' }}>Spread</span>
            <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: themeText, lineHeight: '1', marginTop: '3px' }}>{spread}</span>
          </div>

          <Divider />

          {/* Open Interest (L) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0 }}>
            <span style={{ fontSize: '0.55rem', color: themeTextMuted, lineHeight: '1' }}>Open Interest (L)</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '3px' }}>
              <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: themeText, lineHeight: '1' }}>{formatCompactNumber(totalLongOIUsd)}</span>
              <span className="font-mono" style={{ fontSize: '0.6rem', color: themeTextMuted, lineHeight: '1' }}>/ {maxOIFormatted > 0 ? formatCompactNumber(maxOIFormatted) : '∞'}</span>
            </div>
          </div>

          <Divider />

          {/* Open Interest (S) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0 }}>
            <span style={{ fontSize: '0.55rem', color: themeTextMuted, lineHeight: '1' }}>Open Interest (S)</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '3px' }}>
              <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: themeText, lineHeight: '1' }}>{formatCompactNumber(totalShortOIUsd)}</span>
              <span className="font-mono" style={{ fontSize: '0.6rem', color: themeTextMuted, lineHeight: '1' }}>/ {maxOIFormatted > 0 ? formatCompactNumber(maxOIFormatted) : '∞'}</span>
            </div>
          </div>

          <Divider />

          {/* Net Rate (Funding) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingRight: '0.75rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.6rem', color: themeTextMuted, lineHeight: '1' }}>
                Net Rate (L/S)
              </span>

              {/* Dropdown Timeframe */}
              <div ref={timeframeMenuRef} style={{ position: 'relative' }}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTimeframeMenuOpen(!isTimeframeMenuOpen);
                  }}
                  style={{
                    backgroundColor: themeControlBg,
                    padding: '0 5px',
                    height: '16px',
                    borderRadius: '4px',
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    color: themeText,
                    border: `1px solid ${themeBorder}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'background-color 0.2s',
                    lineHeight: '1'
                  }}
                >
                  {timeframe}
                  <span style={{ fontSize: '0.45rem', opacity: 0.8, transform: 'scale(0.8)' }}>▼</span>
                </div>

                {isTimeframeMenuOpen && timeframeMenuRef.current && createPortal(
                  <div
                    ref={timeframeDropdownRef}
                    style={{
                      position: 'fixed',
                      top: timeframeMenuRef.current.getBoundingClientRect().bottom + 4,
                      left: timeframeMenuRef.current.getBoundingClientRect().left,
                      backgroundColor: themeBg, border: `1px solid ${themeBorder}`,
                      borderRadius: '6px', zIndex: 1000, padding: '2px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)', width: '38px'
                    }}>
                    {['1h', '8h', '24h'].map(t => (
                      <div
                        key={t}
                        onClick={() => { setTimeframe(t as '1h' | '8h' | '24h'); setIsTimeframeMenuOpen(false); }}
                        style={{
                          padding: '2px 1px', fontSize: '0.6rem', fontWeight: 500, color: themeText,
                          cursor: 'pointer', borderRadius: '4px', textAlign: 'center',
                          backgroundColor: timeframe === t ? themeControlBg : 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeControlBg}
                        onMouseLeave={(e) => {
                          if (timeframe !== t) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {t}
                      </div>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
            </div>

            {/* Display des Taux L / S */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
              <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: getRateColor(longRateValue), lineHeight: '1' }}>
                {formatRate(longRateValue)}
              </span>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: themeTextMuted, lineHeight: '1' }}>/</span>
              <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: getRateColor(shortRateValue), lineHeight: '1' }}>
                {formatRate(shortRateValue)}
              </span>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0, paddingLeft: '0.75rem', borderLeft: `1px solid ${themeBorder}` }}>

          {/* NETWORK BADGE (Solana cluster from NetworkContext) */}
          <div>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 8px', borderRadius: '6px',
                backgroundColor: themeControlBg, border: `1px solid ${themeBorder}`,
                cursor: 'default'
              }}>
              <svg width="12" height="12" viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M64.6 237.9c2.4 2.4 5.7 3.7 9.2 3.7h314.8c5.8 0 8.7-7 4.6-11.1l-64.6-64.6c-2.4-2.4-5.7-3.7-9.2-3.7H4.6c-5.8 0-8.7 7-4.6 11.1l64.6 64.6zM323.7 73.1c-2.4-2.4-5.7-3.7-9.2-3.7H9.7c-5.8 0-8.7 7-4.6 11.1l64.6 64.6c2.4 2.4 5.7 3.7 9.2 3.7h304.8c5.8 0 8.7-7 4.6-11.1L323.7 73.1zM323.7 155.5c2.4 2.4 5.7 3.7 9.2 3.7H4.6c-5.8 0-8.7 7-4.6 11.1l64.6 64.6c2.4 2.4 5.7 3.7 9.2 3.7h314.8c5.8 0 8.7-7 4.6-11.1l-64.6-64.6c-2.4-2.4-5.7-3.7-9.2-3.7h-0.1z" fill="url(#paint0_linear)" />
                <defs>
                  <linearGradient id="paint0_linear" x1="396.7" y1="155.5" x2="0" y2="155.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9945FF" />
                    <stop offset="1" stopColor="#14F195" />
                  </linearGradient>
                </defs>
              </svg>
              <span style={{ fontSize: '0.65rem', color: themeText, fontWeight: 500 }}>{selectedNetwork}</span>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', backgroundColor: themeControlBg, padding: '2px', borderRadius: '4px', border: `1px solid ${themeBorder}`, height: '24px' }}>
            <button
              onClick={() => { setViewMode('chart'); window.dispatchEvent(new CustomEvent('trade-view-change', { detail: 'chart' })); }}
              title="Price Chart"
              style={{
                backgroundColor: viewMode === 'chart' ? goldAccent : 'transparent',
                color: viewMode === 'chart' ? '#fff' : themeTextMuted,
                border: 'none', borderRadius: '3px', padding: '0 6px', cursor: 'pointer', transition: 'all 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18" /><path d="M18 17l-6-6-3 3-4-4" /></svg>
            </button>
            <button
              onClick={() => { setViewMode('list'); window.dispatchEvent(new CustomEvent('trade-view-change', { detail: 'list' })); }}
              title="Market List"
              style={{
                backgroundColor: viewMode === 'list' ? goldAccent : 'transparent',
                color: viewMode === 'list' ? '#fff' : themeTextMuted,
                border: 'none', borderRadius: '3px', padding: '0 6px', cursor: 'pointer', transition: 'all 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            </button>
          </div>
        </div>

      </div>

      {(isMenuOpen || viewMode === 'list') && document.getElementById('tvchart-container') ? (
        createPortal(
          <AssetSelectionModal
            inline
            isOpen={true}
            onClose={() => { if (viewMode === 'chart') setIsMenuOpen(false); }}
            pairs={pairs}
            isLoading={isLoading}
            groups={groups}
            activeGroup={activeGroup}
            setActiveGroup={setActiveGroup}
            selectedAsset={selectedAsset}
            setSelectedAsset={handleAssetSelect}
            prices={prices}
            get24hChange={get24hChange}
            themeBorder={themeBorder}
            themeText={themeText}
            themeTextMuted={themeTextMuted}
            themeControlBg={themeControlBg}
            themeBg={themeBg}
            buyColor={buyColor}
            sellColor={sellColor}
            apiRates={apiRates}
          />,
          document.getElementById('tvchart-container')!
        )
      ) : (
        <AssetSelectionModal
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          pairs={pairs}
          isLoading={isLoading}
          groups={groups}
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          selectedAsset={selectedAsset}
          setSelectedAsset={handleAssetSelect}
          prices={prices}
          get24hChange={get24hChange}
          themeBorder={themeBorder}
          themeText={themeText}
          themeTextMuted={themeTextMuted}
          themeControlBg={themeControlBg}
          themeBg={themeBg}
          buyColor={buyColor}
          sellColor={sellColor}
          apiRates={apiRates}
        />
      )}
    </>
  );
};

// ============================================================================