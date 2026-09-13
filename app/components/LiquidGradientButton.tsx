'use client';

import React, { CSSProperties, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

type ColorKey =
  | 'color1' | 'color2' | 'color3' | 'color4' | 'color5' | 'color6'
  | 'color7' | 'color8' | 'color9' | 'color10' | 'color11' | 'color12'
  | 'color13' | 'color14' | 'color15' | 'color16' | 'color17';
type Colors = Record<ColorKey, string>;

const COLORS: Colors = {
  color1: '#FFFFFF', color2: '#1E10C5', color3: '#9089E2',
  color4: '#FCFCFE', color5: '#F9F9FD', color6: '#B2B8E7',
  color7: '#0E2DCB', color8: '#0017E9', color9: '#4743EF',
  color10: '#7D7BF4', color11: '#0B06FC', color12: '#C5C1EA',
  color13: '#1403DE', color14: '#B6BAF6', color15: '#C1BEEB',
  color16: '#290ECB', color17: '#3F4CC0',
};

const svgOrder = ['svg1', 'svg2', 'svg3', 'svg4', 'svg3', 'svg2', 'svg1'] as const;
type SvgKey = (typeof svgOrder)[number];
type Stop = { offset: number; stopColor: string };
type SvgState = { gradientTransform: string; stops: Stop[] };
type SvgStates = Record<SvgKey, SvgState>;

const svgStates: SvgStates = {
  svg1: {
    gradientTransform: 'translate(287.5 280) rotate(-29.0546) scale(689.807 1000)',
    stops: [
      { offset: 0, stopColor: COLORS.color1 },
      { offset: 0.188423, stopColor: COLORS.color2 },
      { offset: 0.260417, stopColor: COLORS.color3 },
      { offset: 0.328792, stopColor: COLORS.color4 },
      { offset: 0.328892, stopColor: COLORS.color5 },
      { offset: 0.328992, stopColor: COLORS.color1 },
      { offset: 0.442708, stopColor: COLORS.color6 },
      { offset: 0.537556, stopColor: COLORS.color7 },
      { offset: 0.631738, stopColor: COLORS.color1 },
      { offset: 0.725645, stopColor: COLORS.color8 },
      { offset: 0.817779, stopColor: COLORS.color9 },
      { offset: 0.84375,  stopColor: COLORS.color10 },
      { offset: 0.90569,  stopColor: COLORS.color1 },
      { offset: 1,        stopColor: COLORS.color11 },
    ],
  },
  svg2: {
    gradientTransform: 'translate(126.5 418.5) rotate(-64.756) scale(533.444 773.324)',
    stops: [
      { offset: 0,        stopColor: COLORS.color1 },
      { offset: 0.104167, stopColor: COLORS.color12 },
      { offset: 0.182292, stopColor: COLORS.color13 },
      { offset: 0.28125,  stopColor: COLORS.color1 },
      { offset: 0.328792, stopColor: COLORS.color4 },
      { offset: 0.328892, stopColor: COLORS.color5 },
      { offset: 0.453125, stopColor: COLORS.color6 },
      { offset: 0.515625, stopColor: COLORS.color7 },
      { offset: 0.631738, stopColor: COLORS.color1 },
      { offset: 0.692708, stopColor: COLORS.color8 },
      { offset: 0.75,     stopColor: COLORS.color14 },
      { offset: 0.817708, stopColor: COLORS.color9 },
      { offset: 0.869792, stopColor: COLORS.color10 },
      { offset: 1,        stopColor: COLORS.color1 },
    ],
  },
  svg3: {
    gradientTransform: 'translate(264.5 339.5) rotate(-42.3022) scale(946.451 1372.05)',
    stops: [
      { offset: 0,        stopColor: COLORS.color1 },
      { offset: 0.188423, stopColor: COLORS.color2 },
      { offset: 0.307292, stopColor: COLORS.color1 },
      { offset: 0.328792, stopColor: COLORS.color4 },
      { offset: 0.328892, stopColor: COLORS.color5 },
      { offset: 0.442708, stopColor: COLORS.color15 },
      { offset: 0.537556, stopColor: COLORS.color16 },
      { offset: 0.631738, stopColor: COLORS.color1 },
      { offset: 0.725645, stopColor: COLORS.color17 },
      { offset: 0.817779, stopColor: COLORS.color9 },
      { offset: 0.84375,  stopColor: COLORS.color10 },
      { offset: 0.90569,  stopColor: COLORS.color1 },
      { offset: 1,        stopColor: COLORS.color11 },
    ],
  },
  svg4: {
    gradientTransform: 'translate(860.5 420) rotate(-153.984) scale(957.528 1388.11)',
    stops: [
      { offset: 0.109375, stopColor: COLORS.color11 },
      { offset: 0.171875, stopColor: COLORS.color2 },
      { offset: 0.260417, stopColor: COLORS.color13 },
      { offset: 0.328792, stopColor: COLORS.color4 },
      { offset: 0.328892, stopColor: COLORS.color5 },
      { offset: 0.328992, stopColor: COLORS.color1 },
      { offset: 0.442708, stopColor: COLORS.color6 },
      { offset: 0.515625, stopColor: COLORS.color7 },
      { offset: 0.631738, stopColor: COLORS.color1 },
      { offset: 0.692708, stopColor: COLORS.color8 },
      { offset: 0.817708, stopColor: COLORS.color9 },
      { offset: 0.869792, stopColor: COLORS.color10 },
      { offset: 1,        stopColor: COLORS.color11 },
    ],
  },
};

const maxStops = Math.max(...Object.values(svgStates).map((s) => s.stops.length));
const stopsAnimationArray = Array.from({ length: maxStops }, (_, i) =>
  svgOrder.map((key) => {
    const svg = svgStates[key];
    return svg.stops[i] ?? svg.stops[svg.stops.length - 1];
  })
);
const gradientTransforms = svgOrder.map((key) => svgStates[key].gradientTransform);

const variants = {
  hovered: {
    gradientTransform: gradientTransforms,
    transition: { duration: 50, repeat: Infinity, ease: 'linear' as const },
  },
  notHovered: {
    gradientTransform: gradientTransforms,
    transition: { duration: 10, repeat: Infinity, ease: 'linear' as const },
  },
};

function GradientSvg({ style, isHovered }: { style?: CSSProperties; isHovered: boolean }) {
  return (
    <svg style={style} width="1030" height="280" viewBox="0 0 1030 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1030" height="280" rx="140" fill="url(#lg-btn-grad)" />
      <defs>
        <motion.radialGradient
          id="lg-btn-grad"
          cx="0" cy="0" r="1"
          gradientUnits="userSpaceOnUse"
          animate={isHovered ? variants.hovered : variants.notHovered}
        >
          {stopsAnimationArray.map((stopConfigs, index) => (
            <AnimatePresence key={index}>
              <motion.stop
                initial={{ offset: stopConfigs[0].offset, stopColor: stopConfigs[0].stopColor }}
                animate={{
                  offset: stopConfigs.map((c) => c.offset),
                  stopColor: stopConfigs.map((c) => c.stopColor),
                }}
                transition={{ duration: 0, ease: 'linear', repeat: Infinity }}
              />
            </AnimatePresence>
          ))}
        </motion.radialGradient>
      </defs>
    </svg>
  );
}

const LIQUID_LAYERS: { width: number; height: number; transform: string; mixBlendMode: CSSProperties['mixBlendMode'] }[] = [
  { width: 443, height: 121, transform: 'translate(-50%, -50%)',                             mixBlendMode: 'difference'  },
  { width: 443, height: 121, transform: 'translate(-50%, -50%) rotate(164.971deg)',           mixBlendMode: 'difference'  },
  { width: 443, height: 121, transform: 'translate(-53%, -53%) rotate(-11.61deg)',            mixBlendMode: 'difference'  },
  { width: 756, height: 207, transform: 'translate(-50%, -57%) rotate(-179.012deg)',          mixBlendMode: 'difference'  },
  { width: 756, height: 207, transform: 'translate(-57%, -50%) rotate(-29.722deg)',           mixBlendMode: 'difference'  },
  { width: 756, height: 207, transform: 'translate(-62%, -24%) rotate(160.227deg)',           mixBlendMode: 'difference'  },
  { width: 756, height: 207, transform: 'translate(-67%, -29%) rotate(180deg)',               mixBlendMode: 'hard-light'  },
];

function Liquid({ isHovered }: { isHovered: boolean }) {
  return (
    <>
      {LIQUID_LAYERS.map((layer, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: layer.width,
            height: layer.height,
            top: '50%',
            left: '50%',
            transform: layer.transform,
            mixBlendMode: layer.mixBlendMode,
          }}
        >
          <GradientSvg style={{ width: '100%', height: '100%' }} isHovered={isHovered} />
        </div>
      ))}
    </>
  );
}

export function LiquidGradientButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  const outer: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: 140,
    height: 46,
    border: '2px solid #000',
    borderRadius: 8,
    background: '#fff',
    cursor: 'pointer',
  };

  return (
    <div style={outer}>
      {/* outer glow */}
      <div style={{ position: 'absolute', width: '112.81%', height: '128.57%', top: '8.57%', left: '50%', transform: 'translateX(-50%)', filter: 'blur(19px)', opacity: 0.7 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: 8, background: '#d9d9d9', filter: 'blur(6.5px)' }} />
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 8 }}>
          <Liquid isHovered={isHovered} />
        </div>
      </div>

      {/* dark shadow behind face */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -40%)', width: '92.23%', height: '112.85%', borderRadius: 8, background: '#010128', filter: 'blur(7.3px)' }} />

      {/* face */}
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 6 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: 6, background: '#d9d9d9' }} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: 6, background: '#000' }} />
        <Liquid isHovered={isHovered} />
        {[3, 3, 5, 4, 4].map((blur, i) => (
          <span key={i} style={{ position: 'absolute', inset: 0, borderRadius: 6, border: '3px solid', borderImage: 'linear-gradient(to bottom, transparent, white) 1', mixBlendMode: 'overlay', filter: `blur(${blur}px)` }} />
        ))}
        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -40%)', width: '70.8%', height: '42.85%', borderRadius: 6, filter: 'blur(15px)', background: '#000066' }} />
      </div>

      {/* clickable overlay */}
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ position: 'absolute', inset: 0, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', height: '100%' }}
        aria-label={label}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: isHovered ? '#facc15' : '#fff', fontSize: 14, fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>
          {label}
        </span>
      </button>
    </div>
  );
}
