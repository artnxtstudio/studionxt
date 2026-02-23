import Nav from '@/components/Nav';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div><Nav />{children}</div>;
}
