import { useCallback, useEffect, useRef, useState } from 'react';

const POLL_INTERVAL_MS = 25_000;

export default function usePublicStatus( id, token, fetcher, terminalStatuses = [] ) {
  const [ data, setData ] = useState( null );
  const [ loading, setLoading ] = useState( false );
  const [ error, setError ] = useState( null );
  const timerRef = useRef( null );
  const cancelledRef = useRef( false );
  const dataRef = useRef( null );

  const clearTimer = () => {
    if ( timerRef.current ) {
      clearTimeout( timerRef.current );
      timerRef.current = null;
    }
  };

  const fetchStatus = useCallback( async ( manual = false ) => {
    if ( ! id || ! token || typeof fetcher !== 'function' ) return;
    if ( manual ) clearTimer();
    setLoading( manual || dataRef.current === null );
    setError( null );

    try {
      const result = await fetcher( id, token );
      if ( cancelledRef.current ) return;
      dataRef.current = result;
      setData( result );
      setLoading( false );

      if ( ! terminalStatuses.includes( result?.status ) ) {
        clearTimer();
        timerRef.current = setTimeout( () => fetchStatus( false ), POLL_INTERVAL_MS );
      }
    } catch ( err ) {
      if ( cancelledRef.current ) return;
      setError( err?.message || 'Unable to load status.' );
      setLoading( false );
      if ( ! terminalStatuses.includes( dataRef.current?.status ) ) {
        clearTimer();
        timerRef.current = setTimeout( () => fetchStatus( false ), POLL_INTERVAL_MS );
      }
    }
  }, [ fetcher, id, terminalStatuses, token ] );

  useEffect( () => {
    cancelledRef.current = false;
    fetchStatus( false );
    return () => {
      cancelledRef.current = true;
      clearTimer();
    };
  }, [ fetchStatus ] );

  return {
    data,
    loading,
    error,
    refresh: () => fetchStatus( true ),
  };
}
