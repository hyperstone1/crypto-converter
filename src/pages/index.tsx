import Head from "next/head";
import CurrencyConverter from "../components/CurrencyConverter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Head>
        <title>Cryptocurrency Converter</title>
        <meta
          name="description"
          content="A test cryptocurrency converter app"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="w-full max-w-2xl">
        <CurrencyConverter />
      </main>
    </div>
  );
}
