'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';

// Proporção real da logo (formato largo: ícone + "FINANCE CONTROLLER" escrito
// dentro da própria imagem) — usada pra calcular a largura a partir da altura,
// sem esticar/distorcer.
const ASPECT_RATIO = 880 / 290;

export function Logo({ height = 32, className = '' }: { height?: number; className?: string }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // evita descompasso de hidratação: o servidor não sabe qual tema tava salvo
  useEffect(() => setMounted(true), []);

  const src =
    mounted && theme === 'dark' ? '/images/finance-controller-logo-darkmode.png' : '/images/finance-controller-logo.png';

  const width = Math.round(height * ASPECT_RATIO);

  return <Image src={src} alt="Finance Controller" width={width} height={height} className={className} priority />;
}
