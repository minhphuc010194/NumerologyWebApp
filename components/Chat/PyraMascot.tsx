'use client';

import { Box, useColorModeValue } from '@chakra-ui/react';
import { motion, Variants } from 'framer-motion';

interface PyraMascotProps {
  state?: 'idle' | 'thinking' | 'speaking' | 'playful' | 'static';
  size?: number | string | Record<string, string | number>;
}

export function PyraMascot({ state = 'idle', size = 150 }: PyraMascotProps) {
  // Orange theme Numerology
  const primaryColor = useColorModeValue('#DD6B20', '#C05621'); // brand.500
  const secondaryColor = useColorModeValue('#ED8936', '#DD6B20');
  const glowColor = useColorModeValue('rgba(221,107,32,0.4)', 'rgba(237,137,54,0.6)');

  const floatAnimation: Variants = {
    idle: { y: [0, -10, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } },
    playful: { y: [0, -30, 0], rotate: [0, -5, 8, -8, 5, 0], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } },
    thinking: { y: [0, -15, 0], rotate: [0, -5, 5, 0], transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' } },
    speaking: { y: [0, -20, 0], scale: [1, 1.05, 1], transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } },
    static: { y: 0, rotate: 0 }
  };

  const glowAnimation: Variants = {
    idle: { filter: `drop-shadow(0px 0px 8px ${glowColor})` },
    playful: { filter: `drop-shadow(0px 0px 20px ${glowColor})` },
    thinking: { filter: `drop-shadow(0px 0px 30px ${glowColor})` },
    speaking: { filter: `drop-shadow(0px 0px 15px ${glowColor})` },
    static: { filter: `drop-shadow(0px 0px 5px ${glowColor})` }
  };

  // Eyes blink + scale
  const eyeLeftVariant: Variants = {
    idle: { scaleY: [1, 1, 0.1, 1, 1], transition: { duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] } },
    playful: { scaleY: [1, 1.2, 0.1, 1.2, 1], scaleX: [1, 1.2, 1, 1.2, 1], transition: { duration: 1.2, repeat: Infinity } },
    thinking: { scaleY: [1.2, 1.3, 1.2], scaleX: [1.2, 1.3, 1.2], transition: { duration: 0.5, repeat: Infinity } },
    speaking: { scaleY: [1, 0.6, 1], scaleX: 1, transition: { duration: 0.3, repeat: Infinity } },
    static: { scaleY: 1 }
  };
  const eyeRightVariant: Variants = {
    idle: { scaleY: [1, 1, 0.1, 1, 1], transition: { duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] } },
    playful: { scaleY: [1, 1.2, 0.1, 1.2, 1], scaleX: [1, 1.2, 1, 1.2, 1], transition: { duration: 1.2, repeat: Infinity } },
    thinking: { scaleY: [1.2, 1.3, 1.2], scaleX: [1.2, 1.3, 1.2], transition: { duration: 0.5, repeat: Infinity } },
    speaking: { scaleY: [1, 0.6, 1], scaleX: 1, transition: { duration: 0.3, repeat: Infinity } },
    static: { scaleY: 1 }
  };

  // Cute little wings
  const wingLeftVariant: Variants = {
    idle: { rotate: [-5, 5, -5], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
    playful: { rotate: [-20, 20, -20], transition: { duration: 0.3, repeat: Infinity } },
    thinking: { rotate: [-20, 40, -20], transition: { duration: 0.4, repeat: Infinity } },
    speaking: { rotate: [-30, 30, -30], transition: { duration: 0.15, repeat: Infinity } },
    static: { rotate: 0 }
  };
  const wingRightVariant: Variants = {
    idle: { rotate: [5, -5, 5], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
    playful: { rotate: [20, -20, 20], transition: { duration: 0.3, repeat: Infinity } },
    thinking: { rotate: [20, -40, 20], transition: { duration: 0.4, repeat: Infinity } },
    speaking: { rotate: [30, -30, 30], transition: { duration: 0.15, repeat: Infinity } },
    static: { rotate: 0 }
  };

  const boxSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <Box w={boxSize} h={boxSize} display="flex" alignItems="center" justifyContent="center">
      <motion.div
        variants={floatAnimation}
        animate={state}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      >
        <motion.svg
          variants={glowAnimation}
          animate={state}
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          {/* Glowing Aura Gradient */}
          <defs>
            <linearGradient id="pyraGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBD38D" />
              <stop offset="100%" stopColor={primaryColor} />
            </linearGradient>
            <linearGradient id="pyraGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F6AD55" />
              <stop offset="100%" stopColor="#C05621" />
            </linearGradient>
            <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F6E05E" />
              <stop offset="100%" stopColor="#DD6B20" />
            </linearGradient>
          </defs>

          {/* Left Wing */}
          <motion.path
            variants={wingLeftVariant}
            animate={state}
            d="M 28 55 Q 5 45 10 70 Q 15 65 28 60 Z"
            fill="url(#wingGrad)"
            style={{ transformOrigin: '28px 55px' }}
          />

          {/* Right Wing */}
          <motion.path
            variants={wingRightVariant}
            animate={state}
            d="M 72 55 Q 95 45 90 70 Q 85 65 72 60 Z"
            fill="url(#wingGrad)"
            style={{ transformOrigin: '72px 55px' }}
          />

          {/* 3D Base Pyramid - Left Face */}
          <polygon
            points="50,15 50,85 10,85"
            fill="url(#pyraGradLeft)"
          />
          {/* 3D Base Pyramid - Right Face (darker for shadow) */}
          <polygon
            points="50,15 90,85 50,85"
            fill="url(#pyraGradRight)"
          />
          {/* Base Pyramid Outline */}
          <polygon
            points="50,15 90,85 10,85"
            fill="none"
            stroke={primaryColor}
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Center edge line for 3D pop */}
          <line x1="50" y1="15" x2="50" y2="85" stroke={primaryColor} strokeWidth="1.5" opacity="0.6" />

          {/* Inner details for sacred geometry feel */}
          <polygon
            points="50,30 75,75 25,75"
            fill="none"
            stroke="#FFF5F5"
            strokeWidth="1"
            opacity="0.5"
          />
          <circle cx="50" cy="55" r="20" fill="none" stroke="#FFF5F5" strokeWidth="1" opacity="0.3" />

          {/* Left Blush */}
          <ellipse cx="32" cy="73" rx="6" ry="3.5" fill="#FC8181" opacity="0.8" />
          
          {/* Right Blush */}
          <ellipse cx="68" cy="73" rx="6" ry="3.5" fill="#FC8181" opacity="0.8" />

          {/* Left Eye */}
          <g>
            <motion.ellipse
              variants={eyeLeftVariant}
              animate={state}
              cx="40"
              cy="65"
              rx="5"
              ry="8"
              fill="#2D3748"
              style={{ transformOrigin: '40px 65px' }}
            />
            {/* Eye highlights (don't blink separately, just blink with parent) */}
            <motion.circle variants={eyeLeftVariant} animate={state} cx="38" cy="62" r="2.5" fill="white" style={{ transformOrigin: '40px 65px' }} />
            <motion.circle variants={eyeLeftVariant} animate={state} cx="42" cy="67" r="1" fill="white" style={{ transformOrigin: '40px 65px' }} />
          </g>

          {/* Right Eye */}
          <g>
            <motion.ellipse
              variants={eyeRightVariant}
              animate={state}
              cx="60"
              cy="65"
              rx="5"
              ry="8"
              fill="#2D3748"
              style={{ transformOrigin: '60px 65px' }}
            />
            <motion.circle variants={eyeRightVariant} animate={state} cx="58" cy="62" r="2.5" fill="white" style={{ transformOrigin: '60px 65px' }} />
            <motion.circle variants={eyeRightVariant} animate={state} cx="62" cy="67" r="1" fill="white" style={{ transformOrigin: '60px 65px' }} />
          </g>

          {/* Cute Mouth */}
          <motion.path
            d={state === 'speaking' || state === 'playful' ? "M 45 78 Q 50 85 55 78 Z" : state === 'thinking' ? "M 48 78 Q 50 78 52 78" : "M 46 76 Q 50 80 54 76"}
            fill={state === 'speaking' || state === 'playful' ? "#FC8181" : "none"}
            stroke="#2D3748"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Top Diamond floating */}
          <motion.polygon
            variants={{
              idle: { y: [0, -3, 0], transition: { duration: 2, repeat: Infinity } },
              playful: { y: [0, -15, 0], rotate: [0, 360], transition: { duration: 1.2, repeat: Infinity } },
              thinking: { y: [0, -10, 0], rotate: [0, 180, 360], transition: { duration: 1, repeat: Infinity } },
              speaking: { y: [0, -5, 0], transition: { duration: 0.5, repeat: Infinity } },
              static: { y: 0 }
            }}
            animate={state}
            points="50,-2 55,5 50,12 45,5"
            fill="#F6E05E"
            style={{ transformOrigin: '50px 5px' }}
          />

        </motion.svg>
      </motion.div>
    </Box>
  );
}
