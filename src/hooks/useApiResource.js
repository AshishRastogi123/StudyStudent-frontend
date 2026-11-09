import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "../services/api";

export default function useApiResource(loader) {
  const loaderRef = useRef(loader);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  loaderRef.current = loader;
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loaderRef.current());
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}
