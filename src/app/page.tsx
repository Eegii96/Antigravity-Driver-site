'use client';

import dynamic from "next/dynamic";

const AppClient = dynamic(() => import("../components/AppClient"), {
  ssr: false,
});

export default function Home() {
  return <AppClient />;
}
