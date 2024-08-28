import { useState, useEffect, ChangeEvent, useRef } from "react";

interface Rate {
  value: number;
}

interface RatesResponse {
  rates: Record<string, Rate>;
}

const CurrencyConverter = () => {
  const [rates, setRates] = useState<Record<string, Rate>>({});
  const [fromCurrency, setFromCurrency] = useState<string>("btc");
  const [toCurrency, setToCurrency] = useState<string>("usd");
  const [amount, setAmount] = useState<number>(1);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // useRef для хранения времени последнего обновления
  const lastUpdateRef = useRef<Date | null>(null);

  // Загрузка данных из localStorage при монтировании компонента
  useEffect(() => {
    const storedRates = localStorage.getItem("data");
    const storedLastUpdate = localStorage.getItem("lastUpdate");

    if (storedRates) {
      try {
        setRates(JSON.parse(storedRates));
      } catch (e) {
        console.error("Failed to parse rates from localStorage", e);
        setRates({});
      }
    }

    if (storedLastUpdate) {
      const storedDate = new Date(storedLastUpdate);
      lastUpdateRef.current = storedDate;
    }
  }, []);

  // Функция для получения курсов крипты
  const fetchRates = async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/exchange_rates",
        { signal }
      );
      if (!response.ok) throw new Error("Failed to fetch rates");
      const data: RatesResponse = await response.json();
      setRates(data.rates);

      const now = new Date();
      localStorage.setItem("data", JSON.stringify(data.rates));
      localStorage.setItem("lastUpdate", now.toISOString());
      lastUpdateRef.current = now;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unknown error occurred");
      }
    }

    return () => controller.abort();
  };

  // Функция обновления данных
  const updateRates = async (isInit: boolean) => {
    if (isInit) {
      const now = new Date();
      if (
        !lastUpdateRef.current ||
        now.getTime() - lastUpdateRef.current.getTime() >= 10000
      ) {
        await fetchRates(); // Обновление данных, если прошло 10 секунд
      } else {
        const data = localStorage.getItem("data");
        if (data) {
          setRates(JSON.parse(data));
        }
      }
    } else {
      await fetchRates();
    }
  };

  useEffect(() => {
    updateRates(true);
    const interval = setInterval(() => {
      updateRates(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Конвертация
  useEffect(() => {
    if (rates[fromCurrency] && rates[toCurrency]) {
      const fromRate = rates[fromCurrency].value;
      const toRate = rates[toCurrency].value;
      setConvertedAmount((amount / fromRate) * toRate);
    }
  }, [fromCurrency, toCurrency, amount, rates]);

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmount(parseFloat(e.target.value));
  };

  const handleFromCurrencyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFromCurrency(e.target.value);
  };

  const handleToCurrencyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setToCurrency(e.target.value);
  };

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded text-gray-800">
      <h1 className="text-2xl font-bold text-blue-500 mb-4">
        Cryptocurrency Converter
      </h1>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={handleAmountChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">From Currency</label>
        <select
          value={fromCurrency}
          onChange={handleFromCurrencyChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        >
          {Object.keys(rates).map((currency) => (
            <option key={currency} value={currency}>
              {currency.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">To Currency</label>
        <select
          value={toCurrency}
          onChange={handleToCurrencyChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        >
          {Object.keys(rates).map((currency) => (
            <option key={currency} value={currency}>
              {currency.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <p className="text-lg">
          {amount} {fromCurrency.toUpperCase()} ={" "}
          <span className="font-bold">
            {convertedAmount !== null ? convertedAmount.toFixed(4) : "..."}
          </span>{" "}
          {toCurrency.toUpperCase()}
        </p>
      </div>
    </div>
  );
};

export default CurrencyConverter;
