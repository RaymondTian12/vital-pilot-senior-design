import { Redirect } from 'expo-router';
import { useAuth } from '@/context/auth-context';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Redirect href={user ? '/home' : '/welcome'} />;
}
