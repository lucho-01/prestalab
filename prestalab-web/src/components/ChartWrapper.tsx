'use client';

import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface ChartWrapperProps {
  options: Highcharts.Options;
}

export default function ChartWrapper({ options }: ChartWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-72 w-full flex items-center justify-center bg-[var(--background)] rounded-[14px] border border-dashed border-[var(--border)]">
        <span className="text-xs text-[var(--text-soft)]">Cargando visualización gráfica...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}

