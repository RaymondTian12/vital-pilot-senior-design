import { Redirect } from 'expo-router';
import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/context/auth-context';

export default function TabLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href='/signin' />;
  return <AppTabs />;
}
