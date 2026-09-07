import { ClipboardList, Images } from 'lucide-react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@components/shared/Empty';

interface EmptyAttachmentStateProps {
  icon: 'images' | 'clipboard';
  title: string;
  description: string;
}

export default function EmptyAttachmentState({
  icon,
  title,
  description,
}: EmptyAttachmentStateProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon === 'images' ? <Images /> : <ClipboardList />}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
