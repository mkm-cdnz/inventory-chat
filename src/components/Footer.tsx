import React from 'react';
import { CanonicalLogo } from './CanonicalLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 bg-white border-t border-[#ecf0f1] text-[#7f8c8d] text-xs">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CanonicalLogo variant="full-color" width={32} height={22} />
          <span className="font-semibold text-[#2c3e50] tracking-wide">
            Matt Millar
          </span>
          <span className="text-[#cbd5e1]">•</span>
          <span className="text-[#34495e]">Hardware Pinout & Specs Finder</span>
        </div>
        <div className="text-[11px] text-[#7f8c8d]">
          Internet search grounded via Google Search & Gemini 3.8 Flash
        </div>
      </div>
    </footer>
  );
};
