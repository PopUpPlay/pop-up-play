import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ScrollControl() {
  const scrollPage = (direction) => {
    const scrollAmount = 300;
    window.scrollBy({
      top: direction === 'up' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2">
      <Button
        onClick={() => scrollPage('up')}
        size="icon"
        className="bg-white hover:bg-slate-100 text-slate-700 shadow-xl rounded-full w-10 h-10"
      >
        <ChevronUp className="w-5 h-5" />
      </Button>
      <Button
        onClick={() => scrollPage('down')}
        size="icon"
        className="bg-white hover:bg-slate-100 text-slate-700 shadow-xl rounded-full w-10 h-10"
      >
        <ChevronDown className="w-5 h-5" />
      </Button>
    </div>
  );
}