import { Link, useRouter, useLocation } from "@tanstack/react-router";
import {
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Menu,
  Wallet,
  Search,
  LogIn,
  X,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { cartService } from "@/services/cart";

export function Header() {
  const { user, isAuthenticated, logout } = useSession();
  const router = useRouter();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: cartService.get,
    staleTime: 5000,
  });

  const cartCount = cart?.items.reduce((acc, i) => acc + i.quantity, 0) ?? 0;

  const handleLogout = async () => {
    await logout();
    void router.navigate({ to: "/" });
  };

  const isHome = location.pathname === "/";
  const isMarket =
    location.pathname.startsWith("/nfts") || location.pathname === "/catalog";
  const isCart =
    location.pathname === "/cart" || location.pathname === "/checkout";
  const isFavorites = location.pathname === "/favorites";
  const isWallets = location.pathname === "/wallets";
  const isProfile = location.pathname === "/profile";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-[#140d07]/95 backdrop-blur supports-[backdrop-filter]:bg-[#140d07]/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-heading font-extrabold text-2xl tracking-[0.15em] text-foreground group-hover:text-primary transition-colors">
            KURIO
          </span>
        </Link>

        <nav
          className="hidden md:flex items-center gap-8 text-sm"
          aria-label="Main navigation"
        >
          <Link
            to="/"
            className={`font-medium transition-colors relative py-1 ${
              isHome
                ? "text-primary font-semibold"
                : "text-foreground/80 hover:text-foreground"
            }`}
          >
            Início
            {isHome && (
              <span className="absolute bottom-[-18px] left-0 right-0 h-[2px] bg-primary" />
            )}
          </Link>
          <Link
            to="/"
            className={`font-medium transition-colors relative py-1 ${
              isMarket
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mercado
            {isMarket && (
              <span className="absolute bottom-[-18px] left-0 right-0 h-[2px] bg-primary" />
            )}
          </Link>
          <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            Criadores
          </span>
          <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            Aprenda
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Buscar"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("focus-search-input"));
            }}
            className="p-2 text-foreground/80 hover:text-primary transition-colors cursor-pointer"
          >
            <Search className="h-5 w-5" aria-hidden />
          </button>

          <Link
            to="/cart"
            aria-label="Cart"
            className={`p-2 relative transition-colors flex items-center ${
              isCart ? "text-primary" : "text-foreground/80 hover:text-primary"
            }`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="ml-1 text-[11px] font-mono font-bold text-primary border border-primary/60 rounded-full px-1.5 py-0.2 min-w-[18px] text-center leading-tight"
              >
                ({cartCount})
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label="Favorites"
                className={
                  isFavorites
                    ? "text-primary bg-accent/20"
                    : "text-foreground/80 hover:text-primary"
                }
              >
                <Link to="/favorites">
                  <Heart className="h-5 w-5" aria-hidden />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label="Wallets"
                className={
                  isWallets
                    ? "text-primary bg-accent/20"
                    : "text-foreground/80 hover:text-primary"
                }
              >
                <Link to="/wallets">
                  <Wallet className="h-5 w-5" aria-hidden />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label={`Profile: ${user?.name}`}
                className={
                  isProfile
                    ? "text-primary bg-accent/20"
                    : "text-foreground/80 hover:text-primary"
                }
              >
                <Link to="/profile">
                  <User className="h-5 w-5" aria-hidden />
                  <span className="sr-only">Profile</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Logout"
                className="text-foreground/80 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" aria-hidden />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                aria-label="Sign in"
                className="bg-[#d67926] hover:bg-[#e58832] text-[#140d07] font-semibold text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden />
                <span>Entrar</span>
              </Link>
              <Link
                to="/register"
                aria-label="Get Started"
                className="hidden sm:inline-flex border border-border hover:border-primary text-foreground hover:text-primary text-xs px-3 py-1.5 rounded transition-colors"
              >
                Cadastrar
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border px-4 py-4 space-y-3 bg-[#140d07]">
          <Link
            to="/"
            className={`block text-sm font-medium ${isHome ? "text-primary font-semibold" : "hover:text-primary"}`}
            onClick={() => setMenuOpen(false)}
          >
            Início
          </Link>
          <Link
            to="/"
            className={`block text-sm font-medium ${isMarket ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"}`}
            onClick={() => setMenuOpen(false)}
          >
            Mercado
          </Link>
          <Link
            to="/cart"
            className={`block text-sm flex items-center justify-between ${isCart ? "text-primary font-semibold" : "hover:text-primary"}`}
            onClick={() => setMenuOpen(false)}
          >
            <span>Carrinho</span>
            <span className="font-mono text-xs text-primary">
              ({cartCount})
            </span>
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/favorites"
                className={`block text-sm ${isFavorites ? "text-primary font-semibold" : "hover:text-primary"}`}
                onClick={() => setMenuOpen(false)}
              >
                Favoritos
              </Link>
              <Link
                to="/profile"
                className={`block text-sm ${isProfile ? "text-primary font-semibold" : "hover:text-primary"}`}
                onClick={() => setMenuOpen(false)}
              >
                Perfil ({user?.name})
              </Link>
              <Link
                to="/wallets"
                className={`block text-sm ${isWallets ? "text-primary font-semibold" : "hover:text-primary"}`}
                onClick={() => setMenuOpen(false)}
              >
                Carteiras
              </Link>
              <button
                className="block text-sm text-destructive hover:underline text-left w-full cursor-pointer pt-2"
                onClick={() => {
                  setMenuOpen(false);
                  void handleLogout();
                }}
              >
                Sair
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                aria-label="Sign in"
                className="block text-center py-2 bg-primary text-[#140d07] font-semibold text-sm rounded"
                onClick={() => setMenuOpen(false)}
              >
                Entrar
              </Link>
              <Link
                to="/register"
                aria-label="Get Started"
                className="block text-center py-2 border border-border text-foreground text-sm rounded"
                onClick={() => setMenuOpen(false)}
              >
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
