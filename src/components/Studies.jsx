import { API_BASE } from '../api'
import { useEffect, useMemo, useState } from 'react'
import Select from 'react-select';
import { FaRegStar, FaStar, FaTrashAlt } from 'react-icons/fa';

function classNames (...xs) { return xs.filter(Boolean).join(' ') }

export function Studies ({ query }) {
  // Helper to export favorites as CSV
  function saveFavorites() {
    if (!favorites.length) return;
    const header = ['Year', 'Journal', 'Title', 'Authors', 'Link'];
    const rows = favorites.map(r => [
      r.year ?? '',
      r.journal || '',
      r.title || '',
      r.authors || '',
      r.study_id ? `https://pubmed.ncbi.nlm.nih.gov/${r.study_id}/` : ''
    ]);
    function escapeCSV(val) {
      if (val == null) return '';
      val = String(val);
      if (val.includes('"') || val.includes(',') || val.includes('\n')) {
        return '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    }
    const csv = [header, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'favorites.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      alert('Failed to export favorites: ' + e.message);
    }
  }
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [sortKey, setSortKey] = useState('year')
  const [sortDir, setSortDir] = useState('desc') // 'asc' | 'desc'
  const [favorites, setFavorites] = useState([]);
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

  useEffect(() => { setPage(1) }, [query])

  useEffect(() => {
    if (!query) return
    let alive = true
    const ac = new AbortController()
    ;(async () => {
      setLoading(true)
      setErr('')
      try {
        const url = `${API_BASE}/query/${encodeURIComponent(query)}/studies`
        const res = await fetch(url, { signal: ac.signal })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        if (!alive) return
        const list = Array.isArray(data?.results) ? data.results : []
        setRows(list)
      } catch (e) {
        if (!alive) return
        setErr(`Unable to fetch studies: ${e?.message || e}`)
        setRows([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false; ac.abort() }
  }, [query])

  const changeSort = (key) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    const arr = [...rows]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const A = a?.[sortKey]
      const B = b?.[sortKey]
      // Numeric comparison for year; string comparison for other fields
      if (sortKey === 'year') return (Number(A || 0) - Number(B || 0)) * dir
      return String(A || '').localeCompare(String(B || ''), 'en') * dir
    })
    return arr
  }, [rows, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className='flex flex-col rounded-2xl border' style={{ position: 'relative' }}>
      {/* My Favorite Panel */}
      <div style={{ position: 'absolute', top: 12, right: 24, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 'bold', marginRight: 4 }}>My Favorite</span>
          <div style={{ position: 'relative' }}>
            <FaStar
              color='#f5b301'
              style={{ fontSize: 22, cursor: 'pointer' }}
              onMouseEnter={() => {
                const tip = document.getElementById('fav-tooltip');
                if (tip) tip.style.display = 'block';
              }}
              onMouseLeave={e => {
                setTimeout(() => {
                  const tip = document.getElementById('fav-tooltip');
                  if (tip && !tip.matches(':hover')) tip.style.display = 'none';
                }, 100);
              }}
            />
            <div
              id='fav-tooltip'
              style={{
                display: 'none',
                position: 'absolute',
                top: 28,
                right: 0,
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                padding: '12px 16px',
                minWidth: 420,
                maxWidth: 600,
                zIndex: 100
              }}
              onMouseEnter={e => {
                e.currentTarget.style.display = 'block';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.display = 'none';
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 15 }}>
                Saved Studies ({favorites.length})
              </div>
              {favorites.length === 0 ? (
                <div style={{ color: '#888' }}>No favorites yet.</div>
              ) : (
                <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 8 }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f7ff' }}>
                        <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 'bold' }}>Year</th>
                        <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 'bold' }}>Title</th>
                        <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 'bold', width: 32 }}>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {favorites.map((f, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '4px 8px' }}>{f.year ?? ''}</td>
                          <td style={{ padding: '4px 8px' }} title={f.title}>{f.title || ''}</td>
                          <td style={{ textAlign: 'center', padding: '4px 8px' }}>
                            <FaTrashAlt
                              style={{ color: '#d9534f', cursor: 'pointer', fontSize: 16 }}
                              title='Remove from favorites'
                              onClick={() => {
                                setFavorites(favorites.filter((_, i) => i !== idx));
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <button
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #4f6eea', background: '#f5f7ff', color: '#4f6eea', cursor: 'pointer', fontSize: 14 }}
                  onClick={saveFavorites}
                  disabled={!favorites.length}
                >Save</button>
                <button
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d9534f', background: '#fff5f5', color: '#d9534f', cursor: 'pointer', fontSize: 14 }}
                  onClick={() => {
                    if (favorites.length && window.confirm('Clear all favorites?')) setFavorites([]);
                  }}
                  disabled={!favorites.length}
                >Clear All</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='flex items-center justify-between p-3'>
        <div className='card__title'>Studies</div>
        <div className='text-sm text-gray-500'>
           {/* {query ? `Query: ${query}` : 'Query: (empty)'} */}
        </div>
      </div>
      {query && !loading && !err && (
          <div className='text-sm font-semibold mb-2' style={{ color: '#2563eb' }}>
            Total <b>{sorted.length}</b> records
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '8px', marginBottom: '18px' }}>
              <label htmlFor="resultsPerPage" style={{ fontWeight: 'normal', fontSize: 'inherit', color: '#000000ff', whiteSpace: 'nowrap', marginBottom: '4px' }}>Results per page:</label>
              <select
                id="resultsPerPage"
                className="results-dropdown"
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {[10, 20, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
      )}


      {query && loading && (
        <div className='grid gap-3 p-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='h-10 animate-pulse rounded-lg bg-gray-100' />
          ))}
        </div>
      )}

      {query && err && (
        <div className='mx-3 mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
          {err}
        </div>
      )}

      {query && !loading && !err && (
        <div className='overflow-auto'>
          <table className='min-w-full text-sm' style={{ borderCollapse: 'separate', borderSpacing: '0 0', tableLayout: 'fixed' }}>
            <thead className='sticky top-0 bg-gray-50 text-left'>
              <tr>
                <th className='px-2 py-2 font-semibold' style={{ width: '40px' }}></th>
                {[ 
                  { key: 'year', label: 'Year' },
                  { key: 'journal', label: 'Journal' },
                  { key: 'title', label: 'Title' },
                  { key: 'authors', label: 'Authors' },
                  { key: 'pubmed', label: 'Link' }
                ].map(({ key, label }) => (
                  <th key={key} className={key !== 'pubmed' ? 'cursor-pointer px-6 py-2 font-semibold' : 'px-6 py-2 font-semibold'} onClick={key !== 'pubmed' ? () => changeSort(key) : undefined}>
                    <span className='inline-flex items-center gap-2'>
                      {label}
                      {key !== 'pubmed' && <span className='text-xs text-gray-500'>{sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={4} className='px-6 py-4 text-gray-500'>No data</td></tr>
              ) : (
                pageRows.map((r, i) => {
                  const isFav = favorites.some(f => f.study_id === r.study_id);
                  return (
                    <tr
                      key={i}
                      className={classNames(
                        i % 2 === 0 ? 'bg-white' : 'bg-pastel-blue',
                        'studies-row'
                      )}
                      style={{ ...(i % 2 === 0 ? {} : { backgroundColor: '#d5e5fac9' }), height: '56px' }}
                    >
                      <td className='px-2 py-4' style={{ border: 'none', cursor: 'pointer', textAlign: 'center', verticalAlign: 'middle' }}
                        title={r.title}
                        onClick={() => {
                          if (isFav) {
                            setFavorites(favorites.filter(f => f.study_id !== r.study_id));
                          } else {
                            setFavorites([...favorites, r]);
                          }
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          {isFav ? <FaStar color='#f5b301' /> : <FaRegStar color='#aaa' />}
                        </span>
                      </td>
                      <td className='whitespace-nowrap px-6 py-4 align-top' style={{ border: 'none' }}>{r.year ?? ''}</td>
                      <td className='px-6 py-4 align-top' style={{ border: 'none' }}>{r.journal || ''}</td>
                      <td className='max-w-[540px] px-6 py-4 align-top' style={{ border: 'none' }}><div className='truncate' title={r.title}>{r.title || ''}</div></td>
                      <td className='px-6 py-4 align-top' style={{ border: 'none' }}>{r.authors || ''}</td>
                      <td className='px-6 py-4 align-top' style={{ border: 'none' }}>
                        {r.study_id ? (
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${r.study_id}/`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-600 underline hover:text-blue-800'
                          >
                            Open on PubMed
                          </a>
                        ) : ''}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {query && !loading && !err && (
        <div className='flex items-center justify-between border-t p-3 text-sm'>
          <div>Page <b>{page}</b>/<b>{totalPages}</b></div>
          <div className='flex items-center gap-2'>
            <button disabled={page <= 1} onClick={() => setPage(1)} className='rounded-lg border px-2 py-1 disabled:opacity-40'>{'<<'}</button>
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className='rounded-lg border px-2 py-1 disabled:opacity-40'>Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className='rounded-lg border px-2 py-1 disabled:opacity-40'>Next</button>
            <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className='rounded-lg border px-2 py-1 disabled:opacity-40'>{'>>'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

