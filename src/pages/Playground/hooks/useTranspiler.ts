import { useState, useEffect, useMemo } from 'react';
import { transpileCode } from '../utils/transpileReact';

export const useTranspiler = (code: string) => {
  const [transpiledCode, setTranspiledCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const transpile = async () => {
      try {
        const result = await transpileCode(code, 'typescript');
        setTranspiledCode(result);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    };

    transpile();
  }, [code]);

  return { transpiledCode, error };
};
