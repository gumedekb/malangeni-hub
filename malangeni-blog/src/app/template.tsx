/**
 * Mounts afresh on every navigation (unlike the layout), so each new page fades
 * and rises in. The header and footer live in the layout and stay put. Off when
 * the device asks for reduced motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in motion-reduce:animate-none">{children}</div>;
}
