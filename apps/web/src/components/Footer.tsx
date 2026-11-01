import { Link } from '@tanstack/react-router'
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-[#110b06] text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-full bg-[#d67926] text-[#140d07] flex items-center justify-center font-bold text-lg flex-shrink-0">
              W
            </div>
            <div>
              <h4 className="font-semibold text-base text-foreground mb-1 tracking-wide">
                Segurança da carteira
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Proteja sua carteira e colecione arte digital verificada com confiança.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-full bg-[#d67926] text-[#140d07] flex items-center justify-center font-bold text-lg flex-shrink-0">
              C
            </div>
            <div>
              <h4 className="font-semibold text-base text-foreground mb-1 tracking-wide">
                Criadores em destaque
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-full bg-[#d67926] text-[#140d07] flex items-center justify-center font-bold text-lg flex-shrink-0">
              D
            </div>
            <div>
              <h4 className="font-semibold text-base text-foreground mb-1 tracking-wide">
                Alertas de lançamentos
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
              </p>
            </div>
          </div>

          <div className="bg-[#19110a] p-4 rounded-xl border border-border">
            <h4 className="font-semibold text-sm text-foreground mb-2">
              Antecipe-se ao próximo lançamento
            </h4>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 mb-2">
              <input
                type="email"
                placeholder="digite seu e-mail..."
                className="flex-1 bg-[#120a05] border border-border rounded px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="bg-[#d67926] hover:bg-[#e58832] text-[#140d07] font-semibold text-xs px-4 py-1.5 rounded transition-colors cursor-pointer"
              >
                Enviar
              </button>
            </form>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </div>
        </div>
      </div>

      <div className="border-y border-border/60 bg-[#160f08]">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <span className="font-extrabold tracking-widest text-primary text-base font-heading">
            KURIO
          </span>
          <span className="text-muted-foreground text-center">
            Feito para colecionadores, criadores e cultura
          </span>
          <div className="flex items-center gap-6 text-muted-foreground">
            <a href="mailto:contato@email.com" className="hover:text-primary transition-colors">
              contato@email.com
            </a>
            <span>+55 11 4002 8922</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div>
            <h5 className="font-semibold text-sm text-foreground mb-3 tracking-wide">
              Meu perfil
            </h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/profile" className="hover:text-primary transition-colors">
                  Meu perfil
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-primary transition-colors">
                  Minha coleção
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-primary transition-colors">
                  Atividade
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Estúdio do criador
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-primary transition-colors">
                  Lista de interesse
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-sm text-foreground mb-3 tracking-wide">
              Central de ajuda
            </h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Central de ajuda
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Como comprar NFTs
                </Link>
              </li>
              <li>
                <Link to="/wallets" className="hover:text-primary transition-colors">
                  Carteira e segurança
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Política do mercado
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Denunciar item
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-sm text-foreground mb-3 tracking-wide">
              Coleções
            </h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/" search={{ category: 'art' }} className="hover:text-primary transition-colors">
                  Arte digital
                </Link>
              </li>
              <li>
                <Link to="/" search={{ category: 'collectibles' }} className="hover:text-primary transition-colors">
                  Fotografia
                </Link>
              </li>
              <li>
                <Link to="/" search={{ category: 'music' }} className="hover:text-primary transition-colors">
                  Música
                </Link>
              </li>
              <li>
                <Link to="/" search={{ category: 'virtual-worlds' }} className="hover:text-primary transition-colors">
                  Arte 3D
                </Link>
              </li>
              <li>
                <Link to="/" search={{ category: 'sports' }} className="hover:text-primary transition-colors">
                  Utilidade
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-2">
            <h5 className="font-semibold text-sm text-foreground mb-3 tracking-wide">
              Redes sociais
            </h5>
            <div className="flex items-center gap-3 mb-6">
              <a href="#" aria-label="Facebook" className="w-8 h-8 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Instagram" className="w-8 h-8 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Twitter" className="w-8 h-8 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" aria-label="YouTube" className="w-8 h-8 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>

            <h5 className="font-semibold text-sm text-foreground mb-2 tracking-wide">
              Carteiras compatíveis
            </h5>
            <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground font-mono">
              <span className="px-2 py-1 rounded border border-border/80 bg-[#160f08]">
                METAMASK
              </span>
              <span className="px-2 py-1 rounded border border-border/80 bg-[#160f08]">
                WALLETCONNECT
              </span>
              <span className="px-2 py-1 rounded border border-border/80 bg-[#160f08]">
                COINBASE
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/60 text-center text-xs text-muted-foreground">
          © 2026 Kurio. Propriedade digital para todos.
        </div>
      </div>
    </footer>
  )
}
