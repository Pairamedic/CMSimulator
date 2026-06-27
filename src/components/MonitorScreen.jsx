import { useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import ECGWaveform from './ECGWaveform'
import EtCO2Waveform from './EtCO2Waveform'
import VitalsDisplay from './VitalsDisplay'
import TwelveLeadModal from './TwelveLeadModal'
import { RHYTHMS } from '../data/rhythms'

export default function MonitorScreen() {
  const { state } = useSimulator()
  const rhythm = RHYTHMS[state.currentRhythm] || RHYTHMS.NSR
  const [show12Lead, setShow12Lead] = useState(false)

  const categoryColors = {
    normal:  'text-ecg-green',
    brady:   'text-ecg-blue',
    tachy:   'text-ecg-amber',
    shock:   'text-ecg-red',
    noshock: 'text-ecg-amber',
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-ecg-bg">

      {/* Rhythm label bar */}
      <div className="flex items-center justify-between px-3 pt-1 shrink-0">
        <span className="text-xs text-ecg-gray font-mono uppercase tracking-widest">LEAD II</span>
        {!state.labelHidden && (
          <span className={`text-xs font-bold font-mono uppercase tracking-widest ${categoryColors[rhythm.category] || 'text-white'}`}>
            {rhythm.label}
          </span>
        )}
        <div className="flex items-center gap-2">
          {!rhythm.pulse && (
            <span className="text-xs font-bold text-ecg-red">NO PULSE</span>
          )}
          {rhythm.shockable && (
            <span className="text-xs font-bold text-ecg-red">SHOCKABLE</span>
          )}
          <button
            onClick={() => setShow12Lead(true)}
            className="text-[10px] font-bold font-mono px-2.5 py-1 rounded border border-ecg-border text-ecg-gray hover:text-ecg-green hover:border-ecg-green transition-colors uppercase tracking-widest"
          >
            12-LEAD
          </button>
        </div>
      </div>

      {/* ECG Canvas */}
      <ECGWaveform />

      {/* EtCO2 Canvas */}
      <EtCO2Waveform />

      {/* Vitals row */}
      <VitalsDisplay />

      {show12Lead && <TwelveLeadModal onClose={() => setShow12Lead(false)} />}
    </div>
  )
}
