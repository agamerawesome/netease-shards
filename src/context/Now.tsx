import { createContext, useContext, useEffect, useState } from 'react';
import { DateTime } from 'luxon';

export interface Now {
  local: DateTime;
  application: DateTime;
}

export const NowContext = createContext<Now>({
  local: DateTime.now(),
  application: DateTime.now().setZone('Asia/Shanghai'),
});

export const useNow = () => useContext(NowContext);
export const NowConsumer = NowContext.Consumer;

export function NowProvider({ children }: { children: React.ReactNode }) {
  const [local, setLocal] = useState(DateTime.now());
  const [application, setApplication] = useState(DateTime.now().setZone('Asia/Shanghai'));

  useEffect(() => {
    const interval = setInterval(() => {
      const now = DateTime.now();
      setLocal(now);
      setApplication(now.setZone('Asia/Shanghai'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <NowContext.Provider value={{ local, application }}>{children}</NowContext.Provider>;
}