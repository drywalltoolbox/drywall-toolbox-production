/**
 * frontend/src/components/repairs/RepairCommentBox.jsx
 *
 * Lightweight customer comment box for repair status page.
 * Not a chat interface; just one-off updates/details sent to the repair team.
 */

import { useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { submitRepairComment } from '../../api/repairs.js';

const MAX_CHARS = 600;

export default function RepairCommentBox( { repairId, token, onSubmitted } ) {
  const [ comment, setComment ] = useState( '' );
  const [ saving, setSaving ] = useState( false );
  const [ error, setError ] = useState( null );
  const [ success, setSuccess ] = useState( null );

  const remaining = useMemo( () => MAX_CHARS - comment.length, [ comment.length ] );
  const canSubmit = comment.trim().length > 0 && comment.length <= MAX_CHARS && ! saving;

  const handleSubmit = async ( e ) => {
    e.preventDefault();
    if ( ! canSubmit ) return;

    setSaving( true );
    setError( null );
    setSuccess( null );

    try {
      const response = await submitRepairComment( repairId, token, comment.trim() );
      setSuccess( response?.message || 'Your update has been sent.' );
      setComment( '' );
      if ( onSubmitted ) onSubmitted();
    } catch ( err ) {
      setError( err?.message || 'Could not send your update. Please try again.' );
    } finally {
      setSaving( false );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={ 16 } className="text-blue-600" />
        <h3 className="text-sm font-semibold text-neutral-800">Share an Update with Our Team</h3>
      </div>
      <p className="text-xs text-neutral-500 mb-3">
        Add extra repair details or notes for technicians. This is not a live chat.
      </p>

      <form onSubmit={ handleSubmit } className="space-y-3">
        <textarea
          value={ comment }
          onChange={ ( e ) => setComment( e.target.value ) }
          maxLength={ MAX_CHARS }
          rows={ 4 }
          placeholder="Example: The issue happens after 10 minutes of use, mostly on high speed."
          className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />

        <div className="flex items-center justify-between">
          <span className={ `text-xs ${ remaining < 80 ? 'text-amber-600' : 'text-neutral-400' }` }>
            { remaining } characters remaining
          </span>
          <button
            type="submit"
            disabled={ ! canSubmit }
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            { saving ? 'Sending…' : 'Send Update' }
          </button>
        </div>
      </form>

      { error && <p className="text-xs text-red-600 mt-2" role="alert">{ error }</p> }
      { success && <p className="text-xs text-green-700 mt-2" role="status">{ success }</p> }
    </div>
  );
}

