import { Select } from '@components/shared/Select';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [hour, minute] = value.split(':');
  return (
    <div className="flex items-center gap-2">
      <Select
        value={hour || ''}
        onChange={(event) => onChange(`${event.target.value}:${minute ?? '00'}`)}
        aria-label="Jam"
        wrapperClassName="flex-1"
        className="font-body-md rounded-xl border border-outline-variant bg-surface py-3 pl-4 text-body-md transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
      >
        <option value="" disabled>
          Jam
        </option>
        {HOURS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>
      <span className="font-body-md text-on-surface-variant">:</span>
      <Select
        value={minute || ''}
        onChange={(event) => onChange(`${hour ?? '00'}:${event.target.value}`)}
        aria-label="Menit"
        wrapperClassName="flex-1"
        className="font-body-md rounded-xl border border-outline-variant bg-surface py-3 pl-4 text-body-md transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
      >
        <option value="" disabled>
          Menit
        </option>
        {MINUTES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>
    </div>
  );
}
