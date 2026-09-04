"use client";

import { useCallback, useEffect, useState } from "react";
import { traduzirErro } from "@/lib/errors";

/** Busca `fetcher` ao montar e expõe `{data, erro, recarregar}` — o trio
 * fetch/loading/erro repetido em toda página que busca dados no mount. */
function useAsyncData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    fetcher()
      .then((resultado) => {
        setData(resultado);
        setErro(null);
      })
      .catch((error) => setErro(traduzirErro(error)));
  }, [fetcher]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { data, erro, recarregar };
}

export { useAsyncData };
