import { getAdminRole } from '@/lib/admin-session';
import PostForm from '@/components/admin/PostForm';

export default async function NewPostPage() {
  const role = await getAdminRole();
  return <PostForm authorName={role === 'owner' ? 'SAKURA' : 'TOMOMI'} />;
}
