/**
 * Configuração global do TanStack Query.
 *
 * `QueryClient` é o "cérebro" que guarda cache, estado de loading/erro,
 * e executa retries. Ele é criado UMA VEZ aqui e injetado no app pelo
 * `QueryClientProvider` (em `main.tsx`).
 *
 * Defaults escolhidos para desenvolvimento:
 *
 * - staleTime: 30s — dados ficam "frescos" por 30s; nesse período,
 *   navegar entre páginas NÃO refaz o fetch (economiza requisições).
 * - retry: 1 — em dev, 1 tentativa é suficiente. O padrão (3) torna
 *   o loading chato quando o backend está fora.
 * - refetchOnWindowFocus: false — ao trocar de aba e voltar, NÃO refaz
 *   o fetch. Padrão é `true`, mas em dev gera ruído.
 *
 * Em produção (Etapa 8), dá para aumentar staleTime e habilitar
 * refetchOnWindowFocus sem prejuízo.
 */

import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})