'use client'
import { useState, useEffect, useRef } from 'react'
import { Store, Drama, DoorOpen, Zap, Square, Circle, Minus, Type } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const GRID = 20
const TOOLS = [
  { type: 'booth',       label: 'Vendor Booth',  icon: Store,    defaultW: 100, defaultH: 80,  color: '#4338ca' },
  { type: 'table_rect',  label: 'Rect Table',    icon: Square,   defaultW: 120, defaultH: 60,  color: '#0369a1' },
  { type: 'table_round', label: 'Round Table',   icon: Circle,   defaultW: 80,  defaultH: 80,  color: '#0369a1' },
  { type: 'stage',       label: 'Stage',         icon: Drama,    defaultW: 240, defaultH: 120, color: '#7c3aed' },
  { type: 'entrance',    label: 'Entrance/Exit', icon: DoorOpen, defaultW: 60,  defaultH: 20,  color: '#059669' },
  { type: 'wall',        label: 'Wall',          icon: Minus,    defaultW: 160, defaultH: 16,  color: 'var(--color-slate-500)' },
  { type: 'electrical',  label: 'Electrical',    icon: Zap,      defaultW: 32,  defaultH: 32,  color: '#d97706' },
  { type: 'text',        label: 'Text Label',    icon: Type,     defaultW: 120, defaultH: 40,  color: 'transparent' },
]
const HANDLES = ['nw','n','ne','e','se','s','sw','w']
const CURSORS = { n:'n-resize', ne:'ne-resize', e:'e-resize', se:'se-resize', s:'s-resize', sw:'sw-resize', w:'w-resize', nw:'nw-resize' }
const BTN = { background:'var(--color-slate-900)', border:'1px solid var(--color-slate-700)', color:'var(--color-slate-400)', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:13 }
const LBL = { color:'var(--color-slate-500)', fontSize:12, display:'block', marginBottom:4 }
const INP = { width:'100%', background:'var(--color-slate-900)', border:'1px solid var(--color-slate-700)', color:'var(--color-slate-300)', borderRadius:6, padding:'6px 8px', fontSize:13, boxSizing:'border-box' }
function snap(v) { return Math.round(v / GRID) * GRID }
let _c = 1
function uid() { return 'i' + (_c++) + '_' + Date.now() }

export default function FloorPlanPage() {
  const [events, setEvents] = useState([])
  const [vendors, setVendors] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [roomW, setRoomW] = useState(800)
  const [roomH, setRoomH] = useState(600)
  const [roomFeetW, setRoomFeetW] = useState(100)
  const [roomFeetH, setRoomFeetH] = useState(75)
  const [showRoomSetup, setShowRoomSetup] = useState(false)
  const [ghost, setGhost] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const canvasRef = useRef(null)
  const itemsRef = useRef([])
  const drag = useRef({ type: null })
  const zoomRef = useRef(1)

  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { loadData() }, [])
  useEffect(() => { if (selectedEvent) loadFloorPlan(selectedEvent) }, [selectedEvent])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }
    const { data: ev } = await supabase.from('events').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    const { data: ve } = await supabase.from('vendors').select('*').in('event_id', (ev||[]).map(e => e.id))
    setEvents(ev||[])
    setVendors(ve||[])
    if (ev && ev.length > 0) setSelectedEvent(ev[0].id)
  }

  async function loadFloorPlan(eventId) {
    const { data } = await supabase.from('floor_plan_items').select('*').eq('event_id', eventId)
    if (data && data.length > 0) {
      setItems(data.map(r => ({ id: r.id, type: r.shape, x: r.x, y: r.y, w: r.width, h: r.height, label: r.label||'', color: r.color||'#4338ca', vendorId: r.vendor_id||null })))
    } else {
      setItems([])
    }
  }

  async function handleSave() {
    if (!selectedEvent) return
    setSaving(true)
    await supabase.from('floor_plan_items').delete().eq('event_id', selectedEvent)
    if (itemsRef.current.length > 0) {
      await supabase.from('floor_plan_items').insert(
        itemsRef.current.map(i => ({ event_id: selectedEvent, vendor_id: i.vendorId||null, label: i.label, x: i.x, y: i.y, width: i.w, height: i.h, color: i.color, shape: i.type }))
      )
    }
    setSaving(false)
    setSaveMsg('Saved!')
    setTimeout(() => setSaveMsg(''), 2000)
  }
  function getCanvasPos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: snap((e.clientX - rect.left) / zoomRef.current),
      y: snap((e.clientY - rect.top) / zoomRef.current),
    }
  }

  function onCanvasMouseMove(e) {
    if (drag.current.type === 'move') {
      const { x, y } = getCanvasPos(e)
      const dx = x - drag.current.startMouseX
      const dy = y - drag.current.startMouseY
      setItems(prev => prev.map(i => i.id === drag.current.id
        ? { ...i, x: snap(drag.current.startX + dx), y: snap(drag.current.startY + dy) }
        : i
      ))
    } else if (drag.current.type === 'resize') {
      const { x, y } = getCanvasPos(e)
      const dx = x - drag.current.startMouseX
      const dy = y - drag.current.startMouseY
      setItems(prev => prev.map(i => {
        if (i.id !== drag.current.id) return i
        let { startX, startY, startW, startH, handle } = drag.current
        let nx = startX, ny = startY, nw = startW, nh = startH
        if (handle.includes('e')) nw = Math.max(GRID, snap(startW + dx))
        if (handle.includes('s')) nh = Math.max(GRID, snap(startH + dy))
        if (handle.includes('w')) { nw = Math.max(GRID, snap(startW - dx)); nx = snap(startX + startW - nw) }
        if (handle.includes('n')) { nh = Math.max(GRID, snap(startH - dy)); ny = snap(startY + startH - nh) }
        return { ...i, x: nx, y: ny, w: nw, h: nh }
      }))
    } else if (drag.current.type === 'toolbar') {
      const rect = canvasRef.current.getBoundingClientRect()
      setGhost({
        x: e.clientX - rect.left - drag.current.offX,
        y: e.clientY - rect.top - drag.current.offY,
        w: drag.current.w,
        h: drag.current.h,
      })
    }
  }

  function onCanvasMouseUp(e) {
    if (drag.current.type === 'toolbar') {
      const { x, y } = getCanvasPos(e)
      const tool = drag.current.tool
      const newItem = {
        id: uid(),
        type: tool.type,
        x: snap(x - drag.current.offX / zoomRef.current),
        y: snap(y - drag.current.offY / zoomRef.current),
        w: tool.defaultW,
        h: tool.defaultH,
        label: tool.label,
        color: tool.color,
        vendorId: null,
      }
      setItems(prev => [...prev, newItem])
      setSelectedId(newItem.id)
      setGhost(null)
    }
    drag.current = { type: null }
  }

  function onItemMouseDown(e, item) {
    e.stopPropagation()
    setSelectedId(item.id)
    const { x, y } = getCanvasPos(e)
    drag.current = { type: 'move', id: item.id, startMouseX: x, startMouseY: y, startX: item.x, startY: item.y }
  }

  function onHandleMouseDown(e, item, handle) {
    e.stopPropagation()
    const { x, y } = getCanvasPos(e)
    drag.current = { type: 'resize', id: item.id, handle, startMouseX: x, startMouseY: y, startX: item.x, startY: item.y, startW: item.w, startH: item.h }
  }

  function onToolbarDragStart(e, tool) {
    const rect = e.currentTarget.getBoundingClientRect()
    drag.current = {
      type: 'toolbar', tool,
      offX: tool.defaultW / 2,
      offY: tool.defaultH / 2,
      w: tool.defaultW,
      h: tool.defaultH,
    }
    e.dataTransfer.setDragImage(new Image(), 0, 0)
  }

  function onCanvasDrop(e) {
    e.preventDefault()
    if (drag.current.type !== 'toolbar') return
    const rect = canvasRef.current.getBoundingClientRect()
    const rawX = (e.clientX - rect.left) / zoomRef.current
    const rawY = (e.clientY - rect.top) / zoomRef.current
    const tool = drag.current.tool
    const newItem = {
      id: uid(),
      type: tool.type,
      x: snap(rawX - tool.defaultW / 2),
      y: snap(rawY - tool.defaultH / 2),
      w: tool.defaultW,
      h: tool.defaultH,
      label: tool.label,
      color: tool.color,
      vendorId: null,
    }
    setItems(prev => [...prev, newItem])
    setSelectedId(newItem.id)
    setGhost(null)
    drag.current = { type: null }
  }

  function deleteSelected() {
    setItems(prev => prev.filter(i => i.id !== selectedId))
    setSelectedId(null)
  }

  function updateSelected(key, val) {
    setItems(prev => prev.map(i => i.id === selectedId ? { ...i, [key]: val } : i))
  }

  const selectedItem = items.find(i => i.id === selectedId)
  const eventVendors = vendors.filter(v => v.event_id === selectedEvent)

  function renderItem(item) {
    const isSelected = item.id === selectedId
    const isRound = item.type === 'table_round'
    const isText = item.type === 'text'
    const isWall = item.type === 'wall'
    const isElec = item.type === 'electrical'

    return (
      <g key={item.id}
        style={{ cursor: 'move' }}
        onMouseDown={e => onItemMouseDown(e, item)}
      >
        {isRound ? (
          <ellipse
            cx={item.x + item.w / 2} cy={item.y + item.h / 2}
            rx={item.w / 2} ry={item.h / 2}
            fill={item.color} fillOpacity={0.85}
            stroke={isSelected ? '#f8fafc' : 'var(--color-slate-800)'}
            strokeWidth={isSelected ? 2.5 : 1}
          />
        ) : isText ? (
          <rect x={item.x} y={item.y} width={item.w} height={item.h}
            fill="none" stroke={isSelected ? 'var(--color-indigo-500)' : 'none'} strokeWidth={1} strokeDasharray="4 3" rx={3}
          />
        ) : (
          <rect x={item.x} y={item.y} width={item.w} height={item.h}
            fill={isWall ? 'var(--color-slate-600)' : isElec ? '#d97706' : item.color}
            fillOpacity={isWall ? 1 : 0.85}
            stroke={isSelected ? '#f8fafc' : 'var(--color-slate-800)'}
            strokeWidth={isSelected ? 2.5 : 1}
            rx={item.type === 'booth' ? 6 : item.type === 'stage' ? 8 : 3}
          />
        )}

        {!isText && (
          <text
            x={item.x + item.w / 2} y={item.y + item.h / 2}
            textAnchor="middle" dominantBaseline="central"
            fontSize={isElec ? 16 : item.type === 'booth' ? 12 : 11}
            fill="white" fontWeight="600"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {isElec ? '⚡' : item.label}
          </text>
        )}

        {isText && (
          <text
            x={item.x + 4} y={item.y + item.h / 2}
            dominantBaseline="central"
            fontSize={14} fill="#e2e8f0"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {item.label}
          </text>
        )}

        {isSelected && HANDLES.map(h => {
          let hx = item.x, hy = item.y
          if (h.includes('e')) hx = item.x + item.w
          if (h === 'n' || h === 's') hx = item.x + item.w / 2
          if (h.includes('s')) hy = item.y + item.h
          if (h === 'e' || h === 'w') hy = item.y + item.h / 2
          if (h === 'ne' || h === 'nw') hy = item.y
          return (
            <rect key={h}
              x={hx - 5} y={hy - 5} width={10} height={10}
              fill="white" stroke="var(--color-indigo-500)" strokeWidth={1.5} rx={2}
              style={{ cursor: CURSORS[h] }}
              onMouseDown={e => onHandleMouseDown(e, item, h)}
            />
          )
        })}
      </g>
    )
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--color-slate-950)', display: 'flex', flexDirection: 'column', zIndex: 100 }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--color-slate-900)', borderBottom: '1px solid var(--color-slate-800)', flexShrink: 0 }}>
        <a href="/dashboard" style={{ ...BTN, textDecoration: 'none', marginRight: 4 }}>← Back</a>
        <span style={{ color: 'var(--color-slate-300)', fontWeight: 700, fontSize: 16 }}>Floor Plan Builder</span>

        <select
          value={selectedEvent}
          onChange={e => setSelectedEvent(e.target.value)}
          style={{ ...INP, width: 200 }}
        >
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>

        <button onClick={() => setShowRoomSetup(true)} style={BTN}>Room Setup</button>
        <button onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))} style={BTN}>+ Zoom</button>
        <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} style={BTN}>- Zoom</button>
        <span style={{ color: 'var(--color-slate-500)', fontSize: 13 }}>{Math.round(zoom * 100)}%</span>

        {selectedId && (
          <button onClick={deleteSelected} style={{ ...BTN, color: '#f87171', borderColor: '#7f1d1d' }}>Delete</button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {saveMsg && <span style={{ color: 'var(--color-emerald-400)', fontSize: 13 }}>{saveMsg}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...BTN, background: 'var(--color-indigo-600)', color: 'white', borderColor: 'var(--color-indigo-600)', padding: '6px 18px', fontWeight: 600 }}
          >
            {saving ? 'Saving...' : 'Save Floor Plan'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left toolbar */}
        <div style={{ width: 130, background: 'var(--color-slate-900)', borderRight: '1px solid var(--color-slate-800)', padding: 10, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flexShrink: 0 }}>
          <p style={{ color: 'var(--color-slate-600)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Elements</p>
          {TOOLS.map(tool => {
            const IconComponent = tool.icon
            return (
              <div
                key={tool.type}
                draggable
                onDragStart={e => onToolbarDragStart(e, tool)}
                style={{
                  background: 'var(--color-slate-800)', border: '1px solid var(--color-slate-700)', borderRadius: 8,
                  padding: '8px 6px', cursor: 'grab', textAlign: 'center',
                  color: 'var(--color-slate-300)', fontSize: 12, userSelect: 'none',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-indigo-500)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-slate-700)'}
              >
                <div style={{ marginBottom: 3 }}><IconComponent size={20} color="var(--color-slate-300)" /></div>
                <div style={{ fontSize: 11, lineHeight: 1.2 }}>{tool.label}</div>
              </div>
            )
          })}
        </div>

        {/* Canvas area */}
        <div
          style={{ flex: 1, overflow: 'auto', background: 'var(--color-slate-900)', position: 'relative' }}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onDragOver={e => e.preventDefault()}
          onDrop={onCanvasDrop}
        >
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', padding: 40 }}>
            <svg
              ref={canvasRef}
              width={roomW}
              height={roomH}
              style={{ display: 'block', background: 'var(--color-slate-800)', borderRadius: 8, border: '2px solid var(--color-slate-700)', cursor: 'default' }}
              onMouseDown={e => { if (e.target === canvasRef.current) setSelectedId(null) }}
            >
              {/* Grid */}
              <defs>
                <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                  <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="var(--color-slate-700)" strokeWidth={0.5} opacity={0.5} />
                </pattern>
              </defs>
              <rect width={roomW} height={roomH} fill="url(#grid)" />

              {/* Room border */}
              <rect x={1} y={1} width={roomW - 2} height={roomH - 2} fill="none" stroke="var(--color-slate-600)" strokeWidth={2} rx={4} />

              {/* Room dimensions */}
              <text x={roomW / 2} y={roomH - 8} textAnchor="middle" fill="var(--color-slate-600)" fontSize={11}>{roomFeetW} ft</text>
              <text x={10} y={roomH / 2} textAnchor="middle" fill="var(--color-slate-600)" fontSize={11} transform={`rotate(-90, 10, ${roomH / 2})`}>{roomFeetH} ft</text>

              {/* Ghost preview while dragging */}
              {ghost && (
                <rect
                  x={ghost.x} y={ghost.y}
                  width={ghost.w} height={ghost.h}
                  fill="var(--color-indigo-500)" fillOpacity={0.3}
                  stroke="var(--color-indigo-500)" strokeWidth={1.5}
                  strokeDasharray="6 3" rx={4}
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {items.map(renderItem)}
            </svg>
          </div>
        </div>

        {/* Right properties panel */}
        <div style={{ width: 220, background: 'var(--color-slate-900)', borderLeft: '1px solid var(--color-slate-800)', padding: 14, overflowY: 'auto', flexShrink: 0 }}>
          {!selectedItem ? (
            <div>
              <p style={{ color: 'var(--color-slate-600)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Properties</p>
              <p style={{ color: 'var(--color-slate-700)', fontSize: 13 }}>Select an item to edit its properties.</p>
              <div style={{ marginTop: 24 }}>
                <p style={{ color: 'var(--color-slate-600)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Floor Plan</p>
                <p style={{ color: 'var(--color-slate-500)', fontSize: 12 }}>{items.length} items placed</p>
                <p style={{ color: 'var(--color-slate-500)', fontSize: 12, marginTop: 4 }}>Room: {roomFeetW}ft x {roomFeetH}ft</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ color: 'var(--color-slate-600)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Properties</p>

              <div>
                <label style={LBL}>Label</label>
                <input
                  style={INP}
                  value={selectedItem.label}
                  onChange={e => updateSelected('label', e.target.value)}
                />
              </div>

              <div>
                <label style={LBL}>Color</label>
                <input
                  type="color"
                  value={selectedItem.color === 'transparent' ? '#4b86d4' : selectedItem.color}
                  onChange={e => updateSelected('color', e.target.value)}
                  style={{ width: '100%', height: 36, border: '1px solid var(--color-slate-700)', borderRadius: 6, background: 'none', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={LBL}>Width</label>
                  <input
                    type="number"
                    style={INP}
                    value={selectedItem.w}
                    onChange={e => updateSelected('w', Math.max(GRID, snap(+e.target.value)))}
                  />
                </div>
                <div>
                  <label style={LBL}>Height</label>
                  <input
                    type="number"
                    style={INP}
                    value={selectedItem.h}
                    onChange={e => updateSelected('h', Math.max(GRID, snap(+e.target.value)))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={LBL}>X</label>
                  <input
                    type="number"
                    style={INP}
                    value={selectedItem.x}
                    onChange={e => updateSelected('x', snap(+e.target.value))}
                  />
                </div>
                <div>
                  <label style={LBL}>Y</label>
                  <input
                    type="number"
                    style={INP}
                    value={selectedItem.y}
                    onChange={e => updateSelected('y', snap(+e.target.value))}
                  />
                </div>
              </div>

              {selectedItem.type === 'booth' && (
                <div>
                  <label style={LBL}>Assign Vendor</label>
                  <select
                    style={INP}
                    value={selectedItem.vendorId || ''}
                    onChange={e => updateSelected('vendorId', e.target.value || null)}
                  >
                    <option value="">Unassigned</option>
                    {eventVendors.map(v => (
                      <option key={v.id} value={v.id}>{v.business_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={deleteSelected}
                style={{ ...BTN, color: '#f87171', borderColor: '#7f1d1d', marginTop: 8 }}
              >
                Delete Item
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Room setup modal */}
      {showRoomSetup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-slate-900)', border: '1px solid var(--color-slate-700)', borderRadius: 16, padding: 32, width: 360 }}>
            <h2 style={{ color: 'var(--color-slate-300)', fontWeight: 700, fontSize: 18, marginBottom: 24 }}>Room Setup</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LBL}>Room Width (feet)</label>
                <input type="number" style={INP} value={roomFeetW} onChange={e => setRoomFeetW(+e.target.value)} />
              </div>
              <div>
                <label style={LBL}>Room Height (feet)</label>
                <input type="number" style={INP} value={roomFeetH} onChange={e => setRoomFeetH(+e.target.value)} />
              </div>
              <div>
                <label style={LBL}>Canvas Width (pixels)</label>
                <input type="number" style={INP} value={roomW} onChange={e => setRoomW(+e.target.value)} />
              </div>
              <div>
                <label style={LBL}>Canvas Height (pixels)</label>
                <input type="number" style={INP} value={roomH} onChange={e => setRoomH(+e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setShowRoomSetup(false)}
                  style={{ ...BTN, flex: 1, background: 'var(--color-indigo-600)', color: 'white', borderColor: 'var(--color-indigo-600)', padding: '10px', fontWeight: 600 }}
                >
                  Apply
                </button>
                <button onClick={() => setShowRoomSetup(false)} style={{ ...BTN, flex: 1, padding: '10px' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}