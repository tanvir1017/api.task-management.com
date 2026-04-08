'use client';

interface StatusBadgeProps {
  status: 'PENDING' | 'PROCESSING' | 'DONE';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800' },
    DONE: { bg: 'bg-green-100', text: 'text-green-800' },
  };

  const style = styles[status];

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
