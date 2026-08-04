import { MediaUploadLab } from '@/components/settings/MediaUploadLab';

export default function AdminMediaLabPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold tracking-tight text-foreground">Media API Lab</h1>
      <MediaUploadLab />
    </div>
  );
}
