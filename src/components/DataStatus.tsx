import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { formatThaiDateTime } from '../utils/format';

interface Props {
  generatedAt: string;
}

// Shows how fresh the committed snapshot is and warns when the browser is
// offline (so an installed PWA makes clear it may be serving cached data).
export const DataStatus = ({ generatedAt }: Props): JSX.Element | null => {
  const online = useOnlineStatus();
  const stamp = formatThaiDateTime(generatedAt);
  if (!stamp && online) return null;

  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
      {stamp && <span>อัปเดตข้อมูลล่าสุด {stamp}</span>}
      {!online && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          ออฟไลน์ · แสดงข้อมูลที่บันทึกไว้
        </span>
      )}
    </p>
  );
};
