import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { BookOpen, MessageCircle, Search, Workflow } from 'lucide-react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { operationDataClient } from './data/client'
import { PlaybackProvider } from './data/playback-context'
import { findCatalogResults, type CatalogResult } from './data/selectors'
import type { FrontendCatalog } from './data/types'
import { AreasPage, DocumentationPage, HandoffsPage, SystemsPage } from './RefinedResourcePages'
import { ProcessDetailPage } from './pages'
import { AssistantPage } from './components/AssistantPage'
import { operationEntryHref } from './data/operation'
import { ThemeProvider, ThemeToggle } from './components/ThemeToggle'
import { AppShell as OrionAppShell } from './components/orion/blocks'
import type { BreadcrumbItem, NavigationItem, RenderLink } from './components/orion/blocks'
import { Button, Input } from './components/orion/ui'

const CatalogContext = createContext<FrontendCatalog | null>(null)

const navigation: NavigationItem[] = [
  { id: 'assistant', href: '/assistente', label: 'Perguntar', icon: MessageCircle },
  { id: 'operation', href: '/operacao', label: 'Processos', icon: Workflow },
  { id: 'documentation', href: '/documentacao', label: 'Evidências', icon: BookOpen },
]

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLoader />
      </BrowserRouter>
    </ThemeProvider>
  )
}

function AppLoader() {
  const [catalog, setCatalog] = useState<FrontendCatalog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setError(null)
    operationDataClient
      .loadCatalog()
      .then((loaded) => {
        if (active) setCatalog(loaded)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Falha ao carregar o modelo.')
      })
    return () => {
      active = false
    }
  }, [attempt])

  if (error)
    return (
      <main className="state-panel">
        <span className="state-symbol" aria-hidden="true">
          !
        </span>
        <span className="eyebrow">Mapa Operacional Super Trans</span>
        <h1>Modelo indisponível</h1>
        <p>{error}</p>
        <Button className="primary-button" onClick={() => setAttempt((value) => value + 1)}>
          Tentar novamente
        </Button>
      </main>
    )
  if (!catalog) return <AppBootSkeleton />

  return (
    <CatalogContext.Provider value={catalog}>
      <PlaybackProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/assistente" element={<AssistantRoute />} />
            <Route path="/operacao" element={<OverviewRoute />} />
            <Route path="/operacao/:processId" element={<ProcessRoute />} />
            <Route path="/processos" element={<ProcessesRoute />} />
            <Route path="/processos/:processId" element={<ProcessRoute />} />
            <Route path="/areas" element={<AreasRoute />} />
            <Route path="/sistemas" element={<SystemsRoute />} />
            <Route path="/handoffs" element={<HandoffsRoute />} />
            <Route path="/documentacao" element={<DocumentationRoute />} />
            <Route path="*" element={<NotFoundRoute />} />
          </Route>
        </Routes>
      </PlaybackProvider>
    </CatalogContext.Provider>
  )
}

function AppBootSkeleton() {
  return (
    <main className="boot-skeleton" aria-label="Carregando Mapa Operacional">
      <aside>
        <i />
        <i />
        <i />
        <i />
        <i />
      </aside>
      <section>
        <header>
          <i />
          <i />
        </header>
        <div>
          <i />
          <i />
          <i />
        </div>
      </section>
      <span className="sr-only">Carregando Control Tower…</span>
    </main>
  )
}

function AppShell() {
  const catalog = useCatalog()
  const navigate = useNavigate()
  const location = useLocation()
  const assistantView = location.pathname === '/assistente' || (location.pathname === '/' && !location.search)
  const [query, setQuery] = useState('')
  const results = useMemo(() => findCatalogResults(catalog, query), [catalog, query])
  const routeProcessId = location.pathname.match(/^\/(?:processos|operacao)\/(P\d{3})/)?.[1]
  const overviewProcessId = location.pathname === '/' ? (new URLSearchParams(location.search).get('process') ?? undefined) : undefined
  const processId = routeProcessId ?? overviewProcessId
  const activeItemId = assistantView ? 'assistant' :
    location.pathname.startsWith('/processos') || location.pathname.startsWith('/operacao')
      ? 'operation'
      : location.pathname === '/areas'
        ? 'areas'
        : location.pathname === '/sistemas'
          ? 'systems'
          : location.pathname === '/handoffs'
            ? 'operation'
            : location.pathname === '/documentacao'
              ? 'documentation'
              : 'operation'

  const selectResult = (result: CatalogResult) => {
    setQuery('')
    if (result.kind === 'process') navigate('/operacao/' + encodeURIComponent(result.id))
    else if (result.kind === 'activity' && result.processId)
      navigate('/operacao/' + result.processId + '?activity=' + encodeURIComponent(result.id))
    else if (result.kind === 'actor') navigate('/operacao?area=' + encodeURIComponent(result.id))
    else if (result.kind === 'system' || result.kind === 'channel' || result.kind === 'artifact')
      navigate(
        '/sistemas?kind=' +
          { system: 'systems', channel: 'channels', artifact: 'artifacts' }[result.kind] +
          '&resource=' +
          encodeURIComponent(result.id),
      )
  }

  const renderLink: RenderLink = ({ href, children, className, ...linkProps }) => (
    <Link to={href} className={className} {...linkProps}>
      {children}
    </Link>
  )
  const breadcrumbs = makeBreadcrumbs(location.pathname, location.search, catalog)
  const brand = (
    <div className="orion-brand">
      <span className="brand-mark">ST</span>
      <span>
        <strong>SUPER TRANS</strong>
        <small>MAPA OPERACIONAL</small>
      </span>
    </div>
  )

  return (
    <OrionAppShell
      className={`app-shell orion-app-shell${assistantView ? ' assistant-shell' : ''}`}
      contentClassName={`orion-main-content${assistantView ? ' assistant-main-content' : ''}`}
      sidebar={{
        brand,
        navigation,
        activeItemId,
        renderLink,
        footer: !assistantView && (
          <div className="sidebar-foot">
            <div className="mini-status">
              <span />
              Modelo canônico
              <br />
              <small>Bizagi + POP · carregado</small>
            </div>
            <span className="version-label">Fase 4 · versão demonstrável</span>
          </div>
        ),
      }}
      breadcrumbs={breadcrumbs}
      renderLink={renderLink}
    >
      <a className="skip-link" href="#main-content">
        Pular para conteúdo
      </a>
      {!assistantView && <header className="topbar portal-topbar">
        <div className="mobile-page-title">{processId ?? 'Mapa Operacional'}</div>
        <div className="global-search">
          <span aria-hidden="true">
            <Search size={17} />
          </span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && results[0]) selectResult(results[0])
              if (event.key === 'Escape') setQuery('')
            }}
            placeholder="Buscar processo, atividade, área ou sistema…"
            aria-label="Busca global"
            aria-expanded={Boolean(query)}
            aria-controls="global-search-results"
          />
          {query && (
            <div id="global-search-results" className="search-results" role="listbox">
              {results.slice(0, 8).map((result) => (
                <button role="option" aria-selected="false" key={result.kind + '-' + result.id} onClick={() => selectResult(result)}>
                  <span className={'result-kind result-' + result.kind}>{result.kind}</span>
                  <strong>{result.label}</strong>
                  {result.processId && <small>{result.processId}</small>}
                </button>
              ))}
              {results.length === 0 && (
                <span className="no-results" role="status">
                  Nenhum elemento encontrado.
                </span>
              )}
            </div>
          )}
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          <label className="process-select">
            <span>Contexto</span>
            <select
              value={processId ?? ''}
              onChange={(event) => navigate(event.target.value ? '/operacao/' + encodeURIComponent(event.target.value) : '/operacao')}
              aria-label="Selecionar processo"
            >
              <option value="">Visão geral</option>
              {catalog.processes.map((process) => (
                <option value={process.id} key={process.id}>
                  {process.id} · {process.name}
                </option>
              ))}
            </select>
          </label>
          <span className="model-status">
            <i />
            Fontes preservadas
          </span>
          <Button className="avatar-button" variant="outline" size="icon-sm" aria-label="Perfil do usuário">
            MT
          </Button>
        </div>
      </header>}
      <div id="main-content" className="content-shell">
        <Outlet />
      </div>
    </OrionAppShell>
  )
}

function makeBreadcrumbs(pathname: string, search: string, catalog: FrontendCatalog): BreadcrumbItem[] {
  if (pathname === '/assistente' || (pathname === '/' && !search)) return [{ label: 'Perguntar sobre processos', current: true }]
  const params = new URLSearchParams(search)
  if (pathname === '/') {
    const view = params.get('view')
    const label = view === 'matrix' ? 'Matriz de relações' : 'Operação'
    return [{ label, current: true }]
  }
  if (['/processos', '/operacao'].includes(pathname)) return [{ label: 'Operação', current: true }]
  const processId = pathname.match(/^\/(?:processos|operacao)\/(P\d{3})/)?.[1]
  if (processId) {
    const process = catalog.processes.find((item) => item.id === processId)
    return [
      { label: 'Operação', href: '/operacao' },
      { label: processId + ' · ' + (process?.name ?? 'Processo'), current: true },
    ]
  }
  const labels: Record<string, string> = {
    '/areas': 'Equipes',
    '/sistemas': 'Recursos',
    '/handoffs': 'Passagens entre equipes',
    '/documentacao': 'Evidências',
  }
  return [{ label: labels[pathname] ?? 'Mapa Operacional', current: true }]
}
function useCatalog() {
  const catalog = useContext(CatalogContext)
  if (!catalog) throw new Error('Catalog context missing')
  return catalog
}
function HomeRoute() {
  const location = useLocation()
  return location.search ? <OverviewRoute /> : <AssistantRoute />
}
function AssistantRoute() {
  return <AssistantPage catalog={useCatalog()} />
}
function OverviewRoute() {
  const catalog = useCatalog()
  const [params] = useSearchParams()
  const resourceId = params.get('resource')
  if (resourceId) {
    const kind = (['systems', 'channels', 'artifacts'] as const).find((kind) => catalog[kind].some((item) => item.id === resourceId))
    if (kind) return <Navigate replace to={`/sistemas?kind=${kind}&resource=${encodeURIComponent(resourceId)}`} />
  }
  return params.get('view') === 'matrix' ? (
    <HandoffsPage catalog={catalog} overview />
  ) : (
    <Navigate replace to={operationEntryHref(catalog, params)} />
  )
}
function ProcessesRoute() {
  return <OverviewRoute />
}
function ProcessRoute() {
  const { processId = 'P001' } = useParams()
  return <ProcessDetailPage catalog={useCatalog()} processId={processId} />
}
function AreasRoute() {
  return <AreasPage catalog={useCatalog()} />
}
function SystemsRoute() {
  return <SystemsPage catalog={useCatalog()} />
}
function HandoffsRoute() {
  return <OverviewRoute />
}
function DocumentationRoute() {
  return <DocumentationPage catalog={useCatalog()} />
}
function NotFoundRoute() {
  return (
    <div className="state-panel state-panel-contained">
      <span className="state-symbol" aria-hidden="true">
        404
      </span>
      <span className="eyebrow">Navegação</span>
      <h1>Página não encontrada.</h1>
      <p>Este endereço não corresponde a uma rota do Mapa Operacional.</p>
      <Link className="primary-button" to="/">
        Voltar à Visão Geral
      </Link>
    </div>
  )
}
