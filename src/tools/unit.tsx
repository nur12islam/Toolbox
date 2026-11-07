import { useState } from 'react'
import { convertUnit, getUnitGroupLabel, getUnits, unitGroupNames } from '../core/logic'

function UnitConverterTool() {
  const [group, setGroup] = useState('Length')
  const [value, setValue] = useState('1')
  const options = getUnits(group)
  const [from, setFrom] = useState(options[0]),
    [to, setTo] = useState(options[1])
  const units = options
  const result =
    Number.isFinite(Number(value)) && value !== ''
      ? convertUnit(Number(value), from, to, group)
      : NaN
  const formatted = Number.isFinite(result)
    ? new Intl.NumberFormat(undefined, { maximumSignificantDigits: 10 }).format(result)
    : '—'
  const changeGroup = (next: string) => {
    setGroup(next)
    const nextUnits = getUnits(next)
    setFrom(nextUnits[0])
    setTo(nextUnits[1])
  }
  return (
    <div className="single-tool unit-tool">
      <label className="field">
        Measurement
        <select value={group} onChange={(event) => changeGroup(event.target.value)}>
          {unitGroupNames.map((key) => (
            <option key={key} value={key}>
              {getUnitGroupLabel(key)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Value
        <input
          type="number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Enter a number"
        />
      </label>
      <div className="field-row">
        <label>
          From
          <select value={from} onChange={(event) => setFrom(event.target.value)}>
            {units.map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </label>
        <label>
          To
          <select value={to} onChange={(event) => setTo(event.target.value)}>
            {units.map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="unit-result">
        <span>CONVERTED VALUE</span>
        <strong>{formatted}</strong>
        <small>{to}</small>
      </div>
      <div className="signature-actions">
        <button
          className="btn secondary"
          onClick={() => {
            setFrom(to)
            setTo(from)
          }}
        >
          Swap units
        </button>
        <button
          className="btn primary"
          disabled={!Number.isFinite(result)}
          onClick={() => navigator.clipboard.writeText(String(result))}
        >
          Copy result
        </button>
      </div>
      <p className="hint">
        Conversions use standard metric and customary unit definitions. Data units include decimal
        (KB) and binary (KiB) sizes.
      </p>
    </div>
  )
}
export default UnitConverterTool
