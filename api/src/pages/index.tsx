import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>PokerEye+ API</title>
        <meta
          name="description"
          content="An easy-to-use Chrome extension that records & calculates statistics while playing on Ignition Casino's Online Poker in your browser."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-4 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            PokerEye<span className="text-[hsl(280,100%,70%)]">+</span> API
          </h1>
          <span className="italic opacity-75">
            The API is currently running...
          </span>
        </div>
      </main>
    </>
  );
}
