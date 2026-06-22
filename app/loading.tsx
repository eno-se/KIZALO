import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Image src="/loading.gif" alt="読み込み中" width={120} height={120} unoptimized />
    </div>
  );
}
