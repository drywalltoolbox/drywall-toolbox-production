import { useCallback, useEffect, useRef, useState } from 'react';

const POLL_INTERVAL_MS = 25_000;

export default function usePublicStatus( id, token, fetcher, terminalStatuses = [] ) {
  const [ data, setData ] = useState( null );
  const [ loading, setLoading ] = useState( false );
  const [ error, setError ] = useState( null );
  const timerRef = useRef( null );
  const cancelledRef = useRef( false );
  const dataRef = useRef( null );
  const fetchStatusRef = useRef( null );

  const clearTimer = useCallback( () => {
    if ( timerRef.current ) {
      clearTimeout( timerRef.current );
      timerRef.current = null;
    }
  }, [] );

  const scheduleNextPoll = useCallback( () => {
    clearTimer();
    timerRef.current = setTimeout( () => {
      if ( ! cancelledRef.current && typeof fetchStatusRef.current === 'function' ) {
        fetchStatusRef.current( false );
      }
    }, POLL_INTERVAL_MS );
  }, [ clearTimer ] );

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
        scheduleNextPoll();
      }
    } catch ( err ) {
      if ( cancelledRef.current ) return;
      setError( err?.message || 'Unable to load status.' );
      setLoading( false );
      if ( ! terminalStatuses.includes( dataRef.current?.status ) ) {
        scheduleNextPoll();
      }
    }
  }, [ clearTimer, fetcher, id, scheduleNextPoll, terminalStatuses, token ] );

  useEffect( () => {
    fetchStatusRef.current = fetchStatus;
  }, [ fetchStatus ] );

  useEffect( () => {
    cancelledRef.current = false;
    const initialTimer = setTimeout( () => {
      if ( ! cancelledRef.current && typeof fetchStatusRef.current === 'function' ) {
        fetchStatusRef.current( false );
      }
    }, 0 );

    return () => {
      cancelledRef.current = true;
      clearTimeout( initialTimer );
      clearTimer();
    };
  }, [ clearTimer, fetchStatus ] );

  const refresh = useCallback( () => {
    return fetchStatus( true );
  }, [ fetchStatus ] );

  return {
    data,
    loading,
    error,
    refresh,
  };
}
