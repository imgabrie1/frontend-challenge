import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { NFTCategory, NFTFilters, NFTNetwork } from "@/types";

interface CatalogFiltersProps {
  filters: NFTFilters;
  onFilterChange: (newFilters: Partial<NFTFilters>) => void;
}

const CATEGORIES: {
  label: string;
  testName: string;
  value: NFTCategory;
  count: number;
}[] = [
  { label: "Arte digital", testName: "Art", value: "art", count: 33 },
  {
    label: "Fotografia",
    testName: "Collectibles",
    value: "collectibles",
    count: 12,
  },
  { label: "Música", testName: "Music", value: "music", count: 65 },
  {
    label: "Arte 3D",
    testName: "Virtual Worlds",
    value: "virtual-worlds",
    count: 39,
  },
  {
    label: "Colecionáveis",
    testName: "Collectibles",
    value: "collectibles",
    count: 23,
  },
  { label: "Generativa", testName: "Gaming", value: "gaming", count: 17 },
  { label: "Jogos", testName: "Gaming", value: "gaming", count: 19 },
  { label: "Assinaturas", testName: "Sports", value: "sports", count: 13 },
  { label: "Utilidade", testName: "Sports", value: "sports", count: 18 },
];

const NETWORKS: { label: string; value: NFTNetwork; count: number }[] = [
  { label: "Ethereum", value: "ethereum", count: 119 },
  { label: "Polygon", value: "polygon", count: 78 },
  { label: "Solana", value: "solana", count: 86 },
];

export function CatalogSidebar({
  filters,
  onFilterChange,
}: CatalogFiltersProps) {
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice ?? "");
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice ?? "");

  useEffect(() => {
    setMinPriceInput(filters.minPrice ?? "");
  }, [filters.minPrice]);

  useEffect(() => {
    setMaxPriceInput(filters.maxPrice ?? "");
  }, [filters.maxPrice]);

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      minPrice: minPriceInput || undefined,
      maxPrice: maxPriceInput || undefined,
    });
  };

  const hasActiveFilters = !!(
    filters.category ||
    filters.network ||
    filters.minPrice ||
    filters.maxPrice
  );

  return (
    <aside
      className="w-56 flex-shrink-0 space-y-8"
      aria-label="Filtros de Catálogo"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading uppercase tracking-wider text-sm font-bold text-foreground">
            Coleções
          </h3>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  category: undefined,
                  network: undefined,
                  minPrice: undefined,
                  maxPrice: undefined,
                })
              }
              className="text-[11px] text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
        <ul
          className="space-y-1.5"
          role="tablist"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((cat, idx) => {
            const isSelected = filters.category === cat.value;
            return (
              <li key={`${cat.label}-${idx}`}>
                <button
                  type="button"
                  role="tab"
                  aria-label={cat.testName}
                  aria-selected={isSelected}
                  onClick={() =>
                    onFilterChange({
                      category: isSelected ? undefined : cat.value,
                    })
                  }
                  className={`w-full flex items-center justify-between text-xs py-1 px-1.5 rounded transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "text-primary font-bold bg-[#25190f]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="font-mono text-[11px] opacity-70">
                    ({cat.count})
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="font-heading uppercase tracking-wider text-sm font-bold text-foreground mb-3">
          Faixa de preço
        </h3>
        <div className="relative py-2 mb-2">
          <div className="h-1 bg-[#332315] rounded-full w-full"></div>
          <div className="absolute top-1/2 -translate-y-1/2 left-2 w-3 h-3 rounded-full bg-[#d67926]"></div>
          <div className="absolute top-1/2 -translate-y-1/2 right-4 w-3 h-3 rounded-full bg-[#d67926]"></div>
        </div>
        <p className="text-[11px] text-muted-foreground font-mono mb-2">
          Preço: {minPriceInput || "0,02"} - {maxPriceInput || "12,30"} ETH
        </p>
        <form onSubmit={handlePriceApply} className="space-y-2">
          <div className="flex gap-2 items-center">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.02"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-full bg-[#181009] border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
              aria-label="Preço mínimo"
            />
            <span className="text-muted-foreground text-xs">-</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="12.30"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-full bg-[#181009] border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
              aria-label="Preço máximo"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#d67926] hover:bg-[#e58832] text-[#140d07] font-semibold text-xs py-1.5 rounded transition-colors cursor-pointer"
          >
            Aplicar
          </button>
        </form>
      </div>

      <div>
        <h3 className="font-heading uppercase tracking-wider text-sm font-bold text-foreground mb-3">
          Rede
        </h3>
        <ul className="space-y-1.5">
          {NETWORKS.map((net) => {
            const isSelected = filters.network === net.value;
            return (
              <li key={net.value}>
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      network: isSelected ? undefined : net.value,
                    })
                  }
                  className={`w-full flex items-center justify-between text-xs py-1 px-1.5 rounded transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "text-primary font-bold bg-[#25190f]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{net.label}</span>
                  <span className="font-mono text-[11px] opacity-70">
                    ({net.count})
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="pt-2">
        <h3 className="font-heading uppercase tracking-wider text-xs font-bold text-[#e5933a] mb-0.5">
          NFT EM DESTAQUE
        </h3>
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
          OFERTA LIMITADA
        </p>
        <div className="rounded-xl overflow-hidden border border-border/80 bg-[#1c130b] aspect-square relative group">
          <img
            src="https:picsum.photos/seed/nft3/400/400"
            alt="NFT em Destaque"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      </div>
    </aside>
  );
}

export function CatalogFilters({
  filters,
  onFilterChange,
}: CatalogFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleFocusSearch = () => {
      inputRef.current?.focus();
    };

    window.addEventListener("focus-search-input", handleFocusSearch);
    return () => {
      window.removeEventListener("focus-search-input", handleFocusSearch);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search ?? "") !== searchInput) {
        onFilterChange({ search: searchInput || undefined });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search by name, creator, or collection..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 pr-3 h-8 text-xs bg-[#181009] border-border text-foreground rounded placeholder:text-muted-foreground"
            aria-label="Search NFTs"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-8 text-xs border-border bg-[#181009] text-foreground hover:text-primary flex items-center gap-1.5"
          aria-expanded={showAdvanced}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
          <span>Filters</span>
        </Button>
      </div>

      <div className="lg:hidden mt-3 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Filter by category mobile">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {CATEGORIES.map((cat, idx) => {
            const isSelected = filters.category === cat.value;
            return (
              <button
                key={`mobile-${cat.label}-${idx}`}
                type="button"
                role="tab"
                aria-label={cat.testName}
                aria-selected={isSelected}
                onClick={() =>
                  onFilterChange({
                    category: isSelected ? undefined : cat.value,
                  })
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                  isSelected
                    ? "bg-primary text-[#140d07] border-primary font-bold"
                    : "bg-[#181009] border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {showAdvanced && (
        <div className="p-3 mt-3 rounded-lg border border-border bg-[#19110a] flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="network-select"
              className="text-xs text-muted-foreground"
            >
              Rede:
            </label>
            <select
              id="network-select"
              value={filters.network ?? ""}
              onChange={(e) =>
                onFilterChange({
                  network: (e.target.value as NFTNetwork) || undefined,
                })
              }
              className="h-8 rounded border border-border bg-[#120a05] px-2 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">Todas</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="solana">Solana</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
