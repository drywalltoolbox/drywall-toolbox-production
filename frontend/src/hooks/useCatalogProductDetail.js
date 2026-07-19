import { useMemo } from 'react';
import useProductDetail from './useProductDetail.js';
import { toProductDetailDTO } from '../utils/catalogDtoAdapters.js';

export function useCatalogProductDetail(slug) {
  const state = useProductDetail(slug);

  const adapted = useMemo(() => {
    if (!state?.product) {
      return {
        product: null,
        variations: [],
        relatedProducts: [],
        computed: null,
      };
    }

    return toProductDetailDTO({
      product: state.product,
      variations: state.variations,
      relatedProducts: state.relatedProducts,
      computed: state.computed,
    });
  }, [state.product, state.variations, state.relatedProducts, state.computed]);

  return {
    ...state,
    ...adapted,
  };
}

export default useCatalogProductDetail;
