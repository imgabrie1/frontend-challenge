import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { nftsService } from "@/services/nfts";
import { NFTCard } from "@/features/catalog/NFTCard";
import { NFTCardSkeleton } from "@/features/catalog/NFTCardSkeleton";
import { CatalogSidebar, CatalogFilters } from "@/features/catalog/CatalogFilters";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import type { NFTFilters } from "@/types";
import { RefreshCw, ArrowRight } from "lucide-react";

const searchSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  network: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "newest", "popular"]).optional(),
  tab: z.enum(["all", "new", "trending"]).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) =>
    searchSchema.parse(search),
  component: HomePage,
});

const BLOG_ARTICLES = [
  {
    id: 1,
    date: '12 de setembro',
    readTime: '6 min',
    title: 'Como funciona a propriedade de NFTs',
    summary: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: 'https://picsum.photos/seed/blog1/400/400',
  },
  {
    id: 2,
    date: '13 de setembro',
    readTime: '2 min',
    title: '10 artistas digitais para acompanhar',
    summary: 'Conheça criadores que moldam a cultura digital.',
    image: 'https://picsum.photos/seed/blog2/400/400',
  },
  {
    id: 3,
    date: '15 de setembro',
    readTime: '3 min',
    title: 'Raridade, atributos e procedência',
    summary: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: 'https://picsum.photos/seed/blog3/400/400',
  },
  {
    id: 4,
    date: '15 de setembro',
    readTime: '2 min',
    title: 'Como proteger sua carteira',
    summary: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: 'https://picsum.photos/seed/blog4/400/400',
  },
];

function HomePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const page = search.page ?? 1;
  const limit = search.limit ?? 12;
  const activeTab = search.tab ?? 'all';

  const filters: NFTFilters = {
    search: search.search,
    category: search.category as NFTFilters["category"],
    network: search.network as NFTFilters["network"],
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    sortBy: search.sortBy ?? (activeTab === 'new' ? 'newest' : activeTab === 'trending' ? 'popular' : undefined),
    page,
    limit,
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["nfts", filters],
    queryFn: () => nftsService.list(filters),
  });

  const handleFilterChange = (newFilters: Partial<NFTFilters>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...newFilters,
        page: 1,
      }),
    });
  };

  const handlePageChange = (newPage: number) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        page: newPage,
      }),
    });
  };

  const pagination = data?.pagination;
  const items = data?.data ?? [];
  const hasItems = items.length > 0;

  return (
    <div className="space-y-16">
      <section className="container mx-auto px-4 pt-10 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="text-xs uppercase tracking-widest text-[#9d8975] font-mono">
              Bem-vindo à Kurio
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-foreground leading-[1.05]">
              SEJA DONO DO FUTURO<br />DA ARTE DIGITAL
              <span className="sr-only"> Discover Unique NFTs</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </p>
            <div className="pt-2">
              <a
                href="#catalogo"
                className="inline-block bg-[#d67926] hover:bg-[#e58832] text-[#140d07] font-bold text-xs uppercase tracking-widest px-8 py-3 rounded transition-colors shadow-lg cursor-pointer"
              >
                EXPLORAR
              </a>
            </div>

            <div className="flex items-center gap-2 pt-8">
              <span className="w-2 h-2 rounded-full bg-[#d67926]"></span>
              <span className="w-2 h-2 rounded-full bg-[#382516]"></span>
              <span className="w-2 h-2 rounded-full bg-[#382516]"></span>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden border border-border/80 bg-[#1c130b] shadow-2xl relative">
              <img
                src="https://picsum.photos/seed/nft1/800/800"
                alt="Arte digital em destaque"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="catalogo" className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="hidden lg:block">
            <CatalogSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border/60 pb-3">
              <div className="flex items-center gap-6 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => handleFilterChange({ sortBy: 'newest' })}
                  className={`pb-3 relative transition-colors cursor-pointer ${
                    activeTab === 'all' ? 'text-[#e5933a] font-semibold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todos os NFTs
                  {activeTab === 'all' && (
                    <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-[#d67926]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ sortBy: 'newest' })}
                  className="pb-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Novos lançamentos
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ sortBy: 'popular' })}
                  className="pb-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Em alta
                </button>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {isFetching && !isLoading && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                    <RefreshCw className="h-3 w-3 animate-spin" aria-hidden /> Atualizando...
                  </span>
                )}
                <label htmlFor="sort-select" className="text-xs text-muted-foreground whitespace-nowrap">
                  Ordenar por:
                </label>
                <select
                  id="sort-select"
                  value={filters.sortBy ?? 'newest'}
                  onChange={(e) => handleFilterChange({ sortBy: e.target.value as NFTFilters['sortBy'] })}
                  className="h-8 rounded border border-border bg-[#181009] px-2 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="newest">Listados recentemente</option>
                  <option value="popular">Mais populares</option>
                  <option value="price_asc">Preço: menor para maior</option>
                  <option value="price_desc">Preço: maior para menor</option>
                </select>
              </div>
            </div>

            <CatalogFilters filters={filters} onFilterChange={handleFilterChange} />

            <div aria-label="NFT Catalog" aria-live="polite" aria-busy={isLoading}>
              {isError && (
                <div
                  role="alert"
                  className="text-center py-16 rounded-xl border border-destructive/30 bg-[#1c130b]"
                >
                  <p className="text-destructive font-semibold text-base">
                    Unable to load NFTs
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    {error instanceof Error ? error.message : "A network error occurred."}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="border-border text-xs">
                    Try Again
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: limit }).map((_, i) => (
                    <NFTCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {!isLoading && !isError && (
                <>
                  {!hasItems ? (
                    <div
                      className="text-center py-16 rounded-xl border border-border bg-[#1a110a]"
                      role="status"
                    >
                      <p className="text-base font-medium">Nenhum NFT encontrado</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        Tente ajustar ou limpar seus filtros ativos.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleFilterChange({
                            search: undefined,
                            category: undefined,
                            network: undefined,
                            minPrice: undefined,
                            maxPrice: undefined,
                          })
                        }
                        className="text-xs border-border"
                      >
                        Limpar Filtros
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((nft) => (
                        <NFTCard key={nft.id} nft={nft} />
                      ))}
                    </div>
                  )}

                  {pagination && (
                    <Pagination
                      page={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#19110a] border border-border rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-[#25190f]">
              <img
                src="https://picsum.photos/seed/nft4/400/400"
                alt="Lançamentos gênesis"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-heading text-lg font-bold text-foreground tracking-wide">
                Lançamentos gênesis de edição limitada
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Colecione edições escassas diretamente dos criadores antes da revelação pública.
              </p>
              <div className="pt-1">
                <a
                  href="#catalogo"
                  className="inline-flex items-center gap-1.5 bg-[#d67926] hover:bg-[#e58832] text-[#140d07] font-semibold text-xs px-4 py-2 rounded transition-colors"
                >
                  <span>Explorar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="bg-[#19110a] border border-border rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-[#25190f]">
              <img
                src="https://picsum.photos/seed/nft5/400/400"
                alt="Arte digital selecionada"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-heading text-lg font-bold text-foreground tracking-wide">
                Arte digital selecionada e muito mais
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Explore novos artistas, coleções verificadas e obras digitais que definem a rede.
              </p>
              <div className="pt-1">
                <a
                  href="#catalogo"
                  className="inline-flex items-center gap-1.5 bg-[#d67926] hover:bg-[#e58832] text-[#140d07] font-semibold text-xs px-4 py-2 rounded transition-colors"
                >
                  <span>Explorar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        <div className="text-center space-y-2 mb-10">
          <h2 className="font-heading text-3xl font-extrabold uppercase tracking-wide text-foreground">
            Diário da Cunhagem
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BLOG_ARTICLES.map((article) => (
            <div
              key={article.id}
              className="bg-[#19110a] border border-border rounded-xl overflow-hidden flex flex-col group hover:border-primary/60 transition-colors"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#25190f]">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-[10px] text-muted-foreground font-mono mb-1.5">
                    {article.date} | Leitura de {article.readTime}
                  </div>
                  <h4 className="font-semibold text-sm text-foreground mb-1 leading-snug">
                    {article.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                </div>
                <span className="text-xs text-[#e5933a] font-semibold group-hover:underline inline-flex items-center gap-1 cursor-pointer">
                  Ler mais →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
