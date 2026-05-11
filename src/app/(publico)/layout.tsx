export default function LayoutPublico({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <main className="w-full max-w-md px-4">{children}</main>
    </div>
  );
}
