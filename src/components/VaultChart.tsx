import React, { useState, useRef, useMemo } from 'react';
import { useTheme } from '../ThemeContext';

const TABS = ['Performance', 'Price', 'Fee APR'];
const RANGES = ['30d', '90d', '180d', 'Total'];

const generateMockData = (points: number, min: number, max: number) => {
  const data = [];
  let current = min + (max - min) / 2;
  for (let i = 0; i < points; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (points - i));
    data.push({
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
      fullDate: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      value: current
    });
    current += (Math.random() - 0.45) * ((max - min) / 10);
    if (current < min) current = min;
    if (current > max) current = max;
  }
  return data;
};

const CHART_COLOR = '#BC8961'; 

export function VaultChart() {
  const { themeBg, themeBorder, themeText, themeTextMuted, themeControlBg } = useTheme();
  
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [activeRange, setActiveRange] = useState(RANGES[0]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const dataPoints = useMemo(() => {
    let points = 30;
    if (activeRange === '90d') points = 90;
    if (activeRange === '180d') points = 180;
    if (activeRange === 'Total') points = 365;
    return generateMockData(points, 0.1, 0.9);
  }, [activeRange, activeTab]); 

  const minVal = 0;
  const maxVal = useMemo(() => {
    if (!dataPoints || dataPoints.length === 0) return 1;
    return Math.max(...dataPoints.map(d => d.value)) * 1.2;
  }, [dataPoints]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, x / width));
    const index = Math.round(percentage * (dataPoints.length - 1));
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const currentData = useMemo(() => {
    if (!dataPoints || dataPoints.length === 0) return { value: 0, date: '', fullDate: '' };
    if (hoverIndex !== null && dataPoints[hoverIndex]) return dataPoints[hoverIndex];
    return dataPoints[dataPoints.length - 1];
  }, [dataPoints, hoverIndex]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: themeBg }}>
      
      <div style={{ display: 'flex', borderBottom: `1px solid ${themeBorder}`, padding: '0 16px' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              color: activeTab === tab ? themeText : themeTextMuted,
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: '0.75rem',
              cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === tab ? CHART_COLOR : 'transparent'}`,
              transition: 'all 0.2s',
              marginBottom: '-1px'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 0 16px 0', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', padding: '0 16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: CHART_COLOR }}>
                {activeTab === 'Price' ? '$' : ''}{currentData.value.toFixed(2)}{activeTab !== 'Price' ? '%' : ''}
              </span>
              <span style={{ fontSize: '0.7rem', color: themeTextMuted }}>
                {activeTab === 'Performance' ? 'Annualized performance' : activeTab === 'Price' ? 'LP Token Price' : 'Fee APR'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2px' }}>
            {RANGES.map(r => (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                style={{
                  padding: '4px 10px',
                  background: activeRange === r ? themeControlBg : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: activeRange === r ? themeText : themeTextMuted,
                  fontSize: '0.7rem',
                  fontWeight: activeRange === r ? 600 : 400,
                  cursor: 'pointer'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '180px', overflow: 'hidden' }}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ overflow: 'visible', cursor: 'crosshair', display: 'block' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {[0, 0.25, 0.5, 0.75].map((ratio) => {
              const y = 100 - (ratio * 100);
              return (
                <g key={ratio}>
                  <line x1="0" y1={y} x2="100" y2={y} stroke={themeBorder} strokeDasharray="1 1" opacity="0.2" vectorEffect="non-scaling-stroke" />
                  <text x="-1" y={y + 1} fill={themeTextMuted} fontSize="2.5" fontFamily="monospace" textAnchor="end">
                    {(minVal + (maxVal - minVal) * ratio).toFixed(1)}{activeTab !== 'Price' ? '%' : ''}
                  </text>
                </g>
              );
            })}

            {dataPoints && dataPoints.length > 0 && [0, 0.5, 1].map((ratio, i) => {
              const index = Math.min(Math.round(ratio * (dataPoints.length - 1)), dataPoints.length - 1);
              return (
                <text key={i} x={ratio * 100} y="106" fill={themeTextMuted} fontSize="2.5" textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} fontFamily="monospace">
                  {dataPoints[index].date}
                </text>
              );
            })}

            <defs>
              <linearGradient id="chart-gradient-gold-v2" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.2} />
                <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            
            {dataPoints && dataPoints.length > 1 && (
              <>
                <polyline
                  points={dataPoints.map((d, i) => `${(i / (dataPoints.length - 1)) * 100},${100 - ((d.value - minVal) / (maxVal - minVal)) * 100}`).join(' ')}
                  fill="none"
                  stroke={CHART_COLOR}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <polygon
                  points={`0,100 ${dataPoints.map((d, i) => `${(i / (dataPoints.length - 1)) * 100},${100 - ((d.value - minVal) / (maxVal - minVal)) * 100}`).join(' ')} 100,100`}
                  fill="url(#chart-gradient-gold-v2)"
                />
              </>
            )}

            {hoverIndex !== null && dataPoints[hoverIndex] && (
              <>
                <line
                  x1={(hoverIndex / (dataPoints.length - 1)) * 100}
                  y1="0"
                  x2={(hoverIndex / (dataPoints.length - 1)) * 100}
                  y2="100"
                  stroke={themeTextMuted}
                  strokeDasharray="2 2"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}
          </svg>

          {hoverIndex !== null && currentData && svgRef.current && (
            <div
              style={{
                position: 'absolute',
                top: `${100 - ((currentData.value - minVal) / (maxVal - minVal)) * 100}%`,
                left: `${(hoverIndex / (dataPoints.length - 1)) * 100}%`,
                transform: 'translate(10px, -50%)',
                backgroundColor: themeControlBg,
                border: `1px solid ${themeBorder}`,
                borderRadius: '4px',
                padding: '4px 8px',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                zIndex: 10,
                whiteSpace: 'nowrap'
              }}
            >
              <div style={{ fontSize: '0.6rem', color: themeTextMuted }}>
                {currentData.fullDate}: <span style={{ color: themeText, fontWeight: 600 }}>{activeTab === 'Price' ? '$' : ''}{currentData.value.toFixed(2)}{activeTab !== 'Price' ? '%' : ''}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
