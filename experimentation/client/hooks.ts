import { useState, useEffect } from "react";
import { VariantDefinition } from "../schemas/experiment-schemas.js";
import { useExperimentationContext } from "./react-context.js";

export function useVariant(experimentKey: string) {
  const { getVariant, trackExposure, trackConversion } = useExperimentationContext();
  const [variant, setVariant] = useState<VariantDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getVariant(experimentKey)
      .then((v) => {
        if (isMounted) {
          setVariant(v);
          setLoading(false);
          // Automatically track exposure when variant is retrieved by the component
          if (v) {
            trackExposure(experimentKey);
          }
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [experimentKey, getVariant, trackExposure]);

  const convert = (metricName: string, value?: number) => {
    return trackConversion(experimentKey, metricName, value);
  };

  return { variant, loading, convert };
}
