import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      <div className="flex-1">
        <Select
          value={hour || null}
          onValueChange={(val) => onChange(`${val ?? '00'}:${minute ?? '00'}`)}
        >
          <SelectTrigger aria-label="Jam" className="bg-civic-cardFill">
            <SelectValue placeholder="Jam" />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {HOURS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <span className="font-bold text-civic-muted">:</span>
      <div className="flex-1">
        <Select
          value={minute || null}
          onValueChange={(val) => onChange(`${hour ?? '00'}:${val ?? '00'}`)}
        >
          <SelectTrigger aria-label="Menit" className="bg-civic-cardFill">
            <SelectValue placeholder="Menit" />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {MINUTES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
