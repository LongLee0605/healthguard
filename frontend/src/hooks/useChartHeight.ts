'use client';

import { useEffect, useState } from 'react';

export function useChartHeight(defaultHeight = 250) {
  const [height, setHeight] = useState(defaultHeight);

  useEffect(() => {
    const update = () => {
      setHeight(window.innerWidth < 640 ? 200 : window.innerWidth < 1024 ? 220 : defaultHeight);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [defaultHeight]);

  return height;
}
