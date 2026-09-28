import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  title: string;
  description: string;
  action: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  description,
  action,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const isDestructive =
    action.toLowerCase().includes('hapus') ||
    action.toLowerCase().includes('tolak') ||
    action.toLowerCase().includes('keluar') ||
    action.toLowerCase().includes('delete') ||
    action.toLowerCase().includes('reject');

  return (
    <AlertDialog open={true} onOpenChange={(open) => !open && !loading && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Memproses...' : action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
