import { useEffect, useMemo, useState } from 'react';
import {
  getOrderItemKey,
  resolveMissingOrderItemImages,
  resolveOrderItemImage,
} from '../utils/orderItemImages.js';

export function useOrderItemImageFallbacks(items = []) {
  const stableItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const [fallbacks, setFallbacks] = useState({});

  useEffect(() => {
    const missingItems = stableItems.filter((item) => getOrderItemKey(item) && !resolveOrderItemImage(item));
    if (missingItems.length === 0) {
      return undefined;
    }

    let cancelled = false;
    resolveMissingOrderItemImages(missingItems)
      .then((resolved) => {
        if (!cancelled) setFallbacks(resolved);
      })
      .catch(() => {
        if (!cancelled) setFallbacks({});
      });

    return () => { cancelled = true; };
  }, [stableItems]);

  return fallbacks;
}

export default useOrderItemImageFallbacks;
