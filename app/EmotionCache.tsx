"use client";

import React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";

export function EmotionCacheProvider({ children }: { children: React.ReactNode }) {
  const [registry] = React.useState(() => {
    const cache = createCache({ key: "css" });
    cache.compat = true;
    let inserted: string[] = [];
    const originalInsert = cache.insert;
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return originalInsert(...args); // Correct call to original method
    };
    return { cache, flush: () => {
      const prev = inserted;
      inserted = [];
      return prev;
    }};
  });

  useServerInsertedHTML(() => {
    const names = registry.flush();
    if (names.length === 0) return null;
    let styles = "";
    for (const name of names) {
      styles += registry.cache.inserted[name];
    }
    return (
      <style
        data-emotion={`${registry.cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>;
}
