# PRD - SiderHub (Blacksider Society Ecosystem)

## 1. Visão Geral

### Resumo Executivo
**SiderHub** é o ecossistema digital da **Blacksider Society** (fórum de Marketing Digital), funcionando como hub central que integra múltiplos SaaS especializados e uma academia de cursos. Os membros acessam um único ponto de entrada com login unificado e têm acesso personalizado a diferentes ferramentas (Hidra para WhatsApp Marketing, Cybervault para recursos) e conteúdo educacional exclusivo.

### Problema
Profissionais de marketing digital e membros da Blacksider Society precisam de múltiplas ferramentas especializadas para suas operações, mas enfrentam:
- **Fragmentação**: Ferramentas separadas com logins diferentes
- **Curva de aprendizado**: Falta de treinamento integrado
- **Desorganização**: Recursos e materiais espalhados em várias plataformas
- **Gestão complexa**: Dificuldade em gerenciar acessos e permissões

### Solução Proposta
Hub unificado que centraliza:
1. **Acesso único (SSO)** - Login uma vez, acessa tudo
2. **Academia integrada** - Treinamento progressivo e certificações
3. **Ferramentas especializadas** - Hidra (WhatsApp Marketing) e Cybervault (biblioteca de recursos)
4. **Gestão granular** - Admins controlam quais SaaS e cursos cada membro acessa
5. **Comunidade integrada** - Extensão do fórum Blacksider Society

---

## 2. Objetivos de Negócio

### Contexto do Produto
- **Marca**: Blacksider Society (Fórum de Marketing Digital)
- **Produto**: SiderHub (Ecossistema de ferramentas)
- **Modelo**: Acesso por convite/aprovação (sem planos públicos na v1)
- **Público**: Membros ativos da comunidade Blacksider Society

### Objetivos Primários
- [ ] **Centralização**: 100% dos membros usando o hub como ponto único de acesso
- [ ] **Engajamento Academia**: 70%+ dos membros completam pelo menos 1 curso no primeiro mês
- [ ] **Adoção Hidra**: 50%+ dos membros criam pelo menos 1 campanha no primeiro trimestre
- [ ] **Utilização Cybervault**: 80%+ dos membros baixam recursos mensalmente
- [ ] **Satisfação**: NPS > 60 entre membros

### Objetivos Secundários
- [ ] Reduzir tickets de suporte relacionados a acessos em 80%
- [ ] Tempo médio de onboarding < 15 minutos
- [ ] Taxa de conclusão de cursos > 60%
- [ ] Membros ativos semanalmente > 75%

### Métricas de Sucesso (KPIs)

#### Engajamento
- **MAU (Monthly Active Users)**: % de membros que fazem login pelo menos 1x/mês
- **DAU (Daily Active Users)**: % de membros que fazem login diariamente
- **Session Duration**: Tempo médio de sessão
- **Feature Adoption**: % de membros usando cada SaaS

#### Academia
- **Course Completion Rate**: % de cursos iniciados que são concluídos
- **Video Engagement**: % de vídeos assistidos até o final
- **Average Progress**: Progresso médio dos alunos (%)
- **Comments per Lesson**: Média de comentários por aula

#### Hidra
- **Active Campaigns**: Campanhas ativas por membro
- **Messages Sent**: Total de mensagens enviadas via plataforma
- **Campaign Success Rate**: % de campanhas concluídas sem erros

#### Cybervault
- **Downloads per Member**: Média de downloads por membro/mês
- **Resource Views**: Visualizações de recursos
- **Search Efficiency**: % de buscas que resultam em download

#### Performance Técnica
- **Page Load Time**: < 2s para homepage
- **Video Start Time**: < 3s para primeiro frame
- **API Response Time**: < 200ms (p95)
- **Uptime**: > 99.5%

---

## 3. Funcionalidades Detalhadas

## 3.1 Hub Principal

### 3.1.1 Homepage Estilo Netflix

**Descrição**: Página inicial com experiência visual similar ao Netflix, focada em engajamento.

**Componentes**:

#### Banners Hero (Carrossel Superior)
- **Configurável pelo Admin** via painel
- **Campos configuráveis por banner**:
  - Imagem/background (upload)
  - Título (texto)
  - Descrição (texto longo)
  - CTA Principal (texto + link externo)
  - CTA Secundário (texto + link externo) - opcional
  - Ordem de exibição
  - Status (ativo/inativo)
  - Data início/fim (agendamento) - [CONFIRMAR SE NECESSÁRIO]
  
- **Comportamento**:
  - Auto-rotate a cada 5 segundos
  - Navegação manual (dots ou setas)
  - Responsivo (mobile/tablet/desktop)
  - Lazy loading de imagens

**Wireframe Conceitual**:
```
┌────────────────────────────────────────────────┐
│                                                │
│  [BANNER HERO - IMAGEM DE FUNDO]              │
│                                                │
│  Título do Banner                              │
│  Descrição do banner aqui...                   │
│                                                │
│  [CTA Principal]  [CTA Secundário]             │
│                                                │
│  ● ○ ○  (dots de navegação)                    │
└────────────────────────────────────────────────┘
```

---

#### Carrossel de Módulos/SaaS

**Descrição**: Seção abaixo dos banners mostrando os SaaS disponíveis.

**Comportamento**:
- Cards clicáveis em formato carrossel
- Cada card representa um SaaS (Hidra, Cybervault, etc.)
- Ao clicar: redirect para o SaaS correspondente
- [A CONFIRMAR: Cards mostram métricas? Ex: "5 campanhas ativas" no Hidra]

**Informações no Card**:
- Ícone/logo do SaaS
- Nome do SaaS
- Descrição curta (1 linha)
- [A CONFIRMAR: Badge de "novo" ou "atualizado"?]

**Wireframe Conceitual**:
```
┌─────────────────────────────────────────────────┐
│  Suas Ferramentas                               │
│                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ 📱   │  │ 🗄️   │  │ [+]  │  │      │  ◄ ►  │
│  │HIDRA │  │CYBER │  │NOVO  │  │      │       │
│  │      │  │VAULT │  │SAAS  │  │      │       │
│  └──────┘  └──────┘  └──────┘  └──────┘       │
└─────────────────────────────────────────────────┘
```

---

### 3.1.2 Área da Academia

**Descrição**: Seção dedicada aos cursos em vídeo com sistema de progressão trackeado.

#### Listagem de Cursos

**Visualização**:
- Grid de cards de cursos
- Cada card mostra:
  - Thumbnail do curso
  - Título
  - Descrição curta (2-3 linhas)
  - Badge de status:
    - 🔒 "Bloqueado" (se ainda não liberado por drip content)
    - 📚 "Não iniciado"
    - ⏳ "Em andamento" (X% concluído)
    - ✅ "Concluído" (100%)
  - Barra de progresso visual (%)
  - Informações: Nº de aulas | Duração total
  - CTA "Continuar" (se em andamento) OU "Começar" (se não iniciado)

**Filtros/Busca**:
- Busca por nome
- Filtro por status (todos/não iniciado/em andamento/concluído)
- Ordenação: alfabética, data de adição, progresso

**Wireframe**:
```
┌─────────────────────────────────────────────────────┐
│  🎓 Academia                                        │
│                                                     │
│  [Buscar cursos...]              [🔽 Filtros]      │
│                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│  │ [IMG]      │ │ [IMG]      │ │ [IMG] 🔒   │     │
│  │ Curso 1    │ │ Curso 2    │ │ Curso 3    │     │
│  │ Descrição  │ │ Descrição  │ │ Descrição  │     │
│  │ ⏳ 35%     │ │ ✅ 100%    │ │ Bloqueado  │     │
│  │ ████░░░░   │ │ ██████████ │ │            │     │
│  │ 12 aulas   │ │ 8 aulas    │ │ 15 aulas   │     │
│  │[Continuar] │ │[Revisar]   │ │[Liberado em│     │
│  └────────────┘ └────────────┘ │ 5 dias]    │     │
│                                 └────────────┘     │
└─────────────────────────────────────────────────────┘
```

---

#### Página do Curso (Área Interna)

**Configurações de Liberação por Curso** (definidas pelo admin):

1. **Liberação Completa**: Todos os módulos/aulas disponíveis imediatamente
2. **Drip Content**: Módulos liberados progressivamente
   - Por dias (ex: 1 módulo a cada 7 dias)
   - Por data específica (ex: Módulo 2 liberado em 15/02/2025)
   - Após conclusão (ex: Módulo 2 só libera após 100% do Módulo 1)

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  [Breadcrumb: Academia > Marketing Digital > Curso X]  │
├─────────────────────────────────────────────────────────┤
│  📚 Fundamentos de WhatsApp Marketing                   │
│  [Banner/Thumbnail do Curso]                            │
│                                                         │
│  📝 Sobre o curso:                                      │
│  Aprenda estratégias avançadas de marketing via...     │
│                                                         │
│  📊 Seu Progresso: ████████░░ 75% (9/12 aulas)         │
│                                                         │
│  ═══════════════════════════════════════════════       │
│                                                         │
│  Módulos:                                               │
│                                                         │
│  ▼ Módulo 1: Introdução (Concluído ✅)                 │
│    • Aula 1: Boas-vindas (10:30) [✓ Assistida]         │
│    • Aula 2: Configuração (15:45) [✓ Assistida]        │
│    • Aula 3: Primeiros passos (20:00) [✓ Assistida]    │
│                                                         │
│  ▼ Módulo 2: Estratégias (Em andamento ⏳)              │
│    • Aula 4: Segmentação (18:20) [▶️ 45% assistida]    │
│    • Aula 5: Funis de conversão (22:15)                │
│    • Aula 6: A/B Testing (25:00)                        │
│                                                         │
│  ► Módulo 3: Automação (🔒 Liberado em 3 dias)         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Comportamento**:
- Módulos em formato accordeon (expandir/colapsar)
- Indicação visual clara de:
  - ✅ Aulas/módulos concluídos (verde)
  - ▶️ Aula atual em andamento (azul)
  - 🔒 Módulos/aulas bloqueados (cinza) com data de liberação
  - ⚪ Aulas disponíveis mas não iniciadas
- Click na aula → redireciona para player
- Bloqueio via drip content: tooltip explicando quando libera

---

#### Player de Aula

**Layout Detalhado**:
```
┌──────────────────────────────────────────────────────────────┐
│  [Breadcrumb: Academia > Curso > Módulo 2 > Aula 4]        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [VIDEO PLAYER - FULL WIDTH]                                │
│  ════════════════════════════════════════════════════       │
│  [Play] ====●=============================== 12:30 / 18:20  │
│  [Vol] [Speed] [Quality] [Fullscreen]                       │
│                                                              │
├───────────────────────────┬──────────────────────────────────┤
│  📖 Aula 4: Segmentação   │  📋 Próximas Aulas:             │
│  de Audiência             │                                  │
│                           │  ▼ Módulo 2 (Continuação)       │
│  📝 Descrição:            │    • Aula 5: Funis (22:15)      │
│  Nesta aula você aprenderá│    • Aula 6: A/B Test (25:00)   │
│  técnicas avançadas de... │                                  │
│                           │  ► Módulo 3 (Liberado em 3d)    │
│  📎 Anexos:               │    🔒 Bloqueado                 │
│  • [📄] Guia_Seg.pdf (2MB)│                                  │
│  • [📊] Template.xlsx (1MB│  ─────────────────────────      │
│                           │  [⬅️ Aula Anterior]             │
│  ⭐ Avaliar esta aula:    │  [Marcar Concluída ✓]           │
│  [1] [2] [3] [4] [5]      │  [Próxima Aula ➡️]             │
│  (Sua avaliação: ★★★★★)   │                                  │
│                           │                                  │
│  ─────────────────────────│                                  │
│                           │                                  │
│  💬 Comentários (24):     │                                  │
│                           │                                  │
│  [Adicionar comentário...]│                                  │
│  [Enviar]                 │                                  │
│                           │                                  │
│  ─────────────────────────│                                  │
│                           │                                  │
│  👤 Maria Silva · há 2h   │                                  │
│  "Ótima explicação sobre  │                                  │
│  segmentação por interesse│                                  │
│  ⬆️ 12  💬 3  🚩 Reportar  │                                  │
│                           │                                  │
│    └─ 👤 João · há 1h     │                                  │
│       "Concordo! Apliquei │                                  │
│       e tive 30% mais...  │                                  │
│       ⬆️ 5  💬 Responder   │                                  │
│                           │                                  │
│       └─ 👤 Pedro · há 30m│                                  │
│          "Qual ferramenta │                                  │
│          vocês usaram?"   │                                  │
│          ⬆️ 2  💬 Responder│                                  │
│                           │                                  │
│  ─────────────────────────│                                  │
│                           │                                  │
│  👤 Carlos · há 1 dia      │                                  │
│  "Dúvida: isso funciona   │                                  │
│  para B2B também?"        │                                  │
│  ⬆️ 8  💬 2  🚩 Reportar   │                                  │
│                           │                                  │
│  [Carregar mais...]       │                                  │
│                           │                                  │
└───────────────────────────┴──────────────────────────────────┘
```

**Funcionalidades Detalhadas**:

---

##### 1. Video Player (Video.js Self-Hosted)

**Solução Escolhida**: Video.js (open-source player) + Supabase Storage + CDN

**Requisitos de Implementação**:
- **Player**: Video.js 8.x (biblioteca open-source)
- **Hosting**: Vídeos armazenados no Supabase Storage
- **CDN**: Supabase CDN nativo para delivery
- **Encoding**: Vídeos devem ser encodados antes do upload
  - Formatos aceitos: MP4 (H.264 codec)
  - Resolução máxima: 1080p
  - Bitrate recomendado: 4-8 Mbps
  - Tamanho máximo: 500MB por vídeo

**Funcionalidades do Player**:
- Controles padrão: play/pause, volume, seek bar, fullscreen
- Velocidade de playback: 0.5x, 0.75x, 1x (default), 1.25x, 1.5x, 2x
- Qualidades adaptativas: 1080p, 720p, 480p, 360p (se múltiplas versões forem upadas)
- Picture-in-Picture: suporte nativo do browser
- Keyboard shortcuts: Espaço (play/pause), ← → (seek), ↑ ↓ (volume), F (fullscreen)
- Responsivo: adapta ao tamanho da tela (mobile/tablet/desktop)

**Plugins Video.js**:
- `videojs-contrib-quality-levels`: Seleção de qualidade (se houver múltiplas)
- `videojs-hotkeys`: Atalhos de teclado
- Custom plugin para tracking de progresso

**Tracking de Progresso**:
- Sistema envia eventos a cada 10 segundos de reprodução
- Salva timestamp atual no banco (para "continuar de onde parou")
- Marca aula como "assistida" ao atingir 90% do vídeo
- Barra de progresso visual no card da aula
- Evento `timeupdate` do Video.js usado para tracking

**Considerações Técnicas**:
- **Encoding pré-upload**: Admin deve fazer encoding antes de upload (recomendação: HandBrake, FFmpeg)
- **Futuro**: Implementar encoding automático server-side (usando FFmpeg via worker)
- **Buffer/Loading**: Video.js handle automaticamente com adaptive buffering
- **Fallback**: Se vídeo falhar, exibir mensagem de erro amigável

---

##### 2. Informações da Aula

- Título (h1)
- Descrição (suporta markdown básico: negrito, itálico, listas, links)
- Duração total

---

##### 3. Anexos/Downloads

**Lista de arquivos**:
- Nome do arquivo + ícone por tipo
- Tamanho do arquivo
- Botão "Download"
- Tracking: sistema registra quem baixou e quando
- Sem limite de downloads

---

##### 4. Sistema de Avaliações ⭐

**Por Aula** (não por curso inteiro):

**Interface**:
- 5 estrelas clicáveis (1-5)
- Exibe média de avaliações: "4.7 ⭐ (89 avaliações)"
- Cada membro pode avaliar UMA VEZ por aula
- Pode editar sua avaliação posteriormente

**Admin Dashboard**:
- Ver média de avaliações por aula
- Identificar aulas com baixa avaliação para melhorias
- Filtrar aulas por rating

---

##### 5. Sistema de Comentários 💬 (Com Threads)

**Características**:
- **Por aula** (não por curso)
- **Threads/Respostas aninhadas** (até 3 níveis de profundidade)
- **Moderação por admin** (comentários aguardam aprovação)
- **Upvotes**: membros podem dar "like" em comentários
- **Report**: membros podem reportar comentários inapropriados

**Fluxo de Comentário**:

1. **Criar Comentário Raiz**:
   - Membro digita no textarea
   - Click "Enviar"
   - Sistema: "Seu comentário está aguardando moderação"
   - Status: `pending`

2. **Moderação (Admin)**:
   - Admin acessa painel de moderação
   - Ve lista de comentários pendentes
   - Pode:
     - ✅ Aprovar → Status muda para `approved`, aparece na aula
     - ❌ Rejeitar → Status muda para `rejected`, não aparece
     - ✏️ Editar conteúdo antes de aprovar (corrigir typo, etc)
     - 🗑️ Deletar permanentemente

3. **Responder Comentário**:
   - Qualquer membro pode responder comentários aprovados
   - Click em "💬 Responder" no comentário pai
   - Textarea aparece aninhado
   - Mesma moderação (pending → approved/rejected)

4. **Thread Visual**:
```
Comentário 1 (nível 0)
  └─ Resposta 1.1 (nível 1)
      └─ Resposta 1.1.1 (nível 2)
          └─ Resposta 1.1.1.1 (nível 3 - máximo)
```

**Elementos de Cada Comentário**:
- Avatar do autor (ou inicial do nome)
- Nome do autor
- Data/hora relativa ("há 2h", "há 1 dia")
- Texto do comentário (suporta markdown básico)
- Botão "⬆️ Upvote" + contador
- Botão "💬 Responder"
- Botão "🚩 Reportar" (abre modal)
- [Se for do próprio membro]: Botão "✏️ Editar" e "🗑️ Deletar"

**Painel de Moderação (Admin)**:
```
┌──────────────────────────────────────────────────┐
│  🛡️ Moderação de Comentários                     │
│                                                  │
│  [Pendentes: 8] [Aprovados] [Rejeitados]        │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ 👤 João Silva                            │   │
│  │ Curso: WhatsApp Marketing > Aula 4      │   │
│  │ há 10 minutos                            │   │
│  │                                          │   │
│  │ "Ótima aula! Mas tenho uma dúvida..."   │   │
│  │                                          │   │
│  │ [✅ Aprovar] [❌ Rejeitar] [✏️ Editar]    │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ 👤 Maria Santos                          │   │
│  │ Curso: Automação > Aula 2                │   │
│  │ há 1 hora                                │   │
│  │                                          │   │
│  │ [CONTEÚDO REPORTADO POR 2 USUÁRIOS]     │   │
│  │ "Este método não funciona, é..."        │   │
│  │                                          │   │
│  │ [✅ Aprovar] [❌ Rejeitar] [🗑️ Deletar]  │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

**Sistema de Reports**:
- Membro clica "🚩 Reportar"
- Modal: "Por que você está reportando?"
  - [ ] Spam
  - [ ] Ofensivo/Inapropriado
  - [ ] Informação incorreta
  - [ ] Outro (campo de texto)
- Admin vê comentários reportados em destaque
- Após 3 reports, comentário é automaticamente removido e enviado para revisão

---

##### 6. Timeline/Navegação

**Sidebar Direita**:
- Lista dos próximos módulos e aulas
- Indica aulas bloqueadas (🔒) com tooltip de quando libera
- Botões:
  - "⬅️ Aula Anterior" (se houver)
  - "Marcar como Concluída ✓" (se ainda não marcada)
  - "Próxima Aula ➡️" (se houver e estiver liberada)

**Comportamento "Marcar como Concluída"**:
- Click → sistema marca como 100% assistida
- Atualiza progresso do curso
- Se houver aulas bloqueadas que dependem desta, libera automaticamente
- Se for a última aula do curso → mostra modal de "Parabéns! Curso concluído 🎉"

**Auto-play da Próxima Aula**:
- [A DEFINIR: Implementar? Sim/Não]
- Se sim: Ao terminar vídeo, countdown de 10s antes de ir para próxima
- Botão "Cancelar auto-play" durante countdown

---

## 3.2 SaaS 1: Hidra (Disparador WhatsApp)

### Visão Geral
Ferramenta de coordenação e programação de disparos em massa via WhatsApp. **Importante**: O Hidra NÃO envia mensagens diretamente - ele coordena e programa os disparos através da Evolution API que cada membro tem hospedada em seu próprio servidor.

### Arquitetura de Integração
- **Cada membro** tem sua própria instância do Evolution API (self-hosted)
- **SiderHub (Hidra)** apenas:
  - Gerencia campanhas
  - Programa disparos
  - Coordena envios
  - Exibe métricas
- **Evolution API** (do membro) executa os envios efetivos

**Benefícios desta abordagem**:
- ✅ Sem limites de disparo impostos pelo SiderHub
- ✅ Membro controla seu próprio servidor
- ✅ Não há single point of failure
- ✅ Cada membro gerencia suas próprias taxas e limites no WhatsApp

---

### 3.2.1 Configuração Inicial (Primeira vez)

**Tela: Conectar Evolution API**

```
┌──────────────────────────────────────────────────┐
│  🔗 Conectar sua Evolution API                   │
│                                                  │
│  Para usar o Hidra, você precisa conectar sua   │
│  instância do Evolution API.                    │
│                                                  │
│  📦 Servidor Evolution API:                     │
│  [https://evolution.seuservidor.com          ]  │
│                                                  │
│  🔑 API Key:                                    │
│  [●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●          ]  │
│                                                  │
│  [📘 Como obter minha API Key?]                 │
│                                                  │
│  [Testar Conexão]  [Salvar e Continuar]        │
│                                                  │
│  ⚠️ Sua API Key é criptografada e armazenada    │
│  de forma segura.                               │
└──────────────────────────────────────────────────┘
```

**Campos**:
- **URL do servidor**: Input tipo URL
  - Validação: deve começar com `https://`
  - Placeholder: `https://evolution.exemplo.com`
  
- **API Key**: Input tipo password
  - Validação: não vazio, alfanumérico
  
**Botões**:
- **Testar Conexão**: 
  - Faz request à Evolution API
  - Verifica se API Key é válida
  - Testa endpoint de health check
  - Feedback visual: ✅ "Conexão bem-sucedida!" OU ❌ "Erro: [mensagem]"
  
- **Salvar e Continuar**:
  - Só habilitado após teste bem-sucedido
  - Salva credenciais criptografadas no banco (schema `hidra`)
  - Redireciona para dashboard

**Validações**:
- URL válida (formato https://)
- API Key não vazia
- Teste de conexão bem-sucedido obrigatório antes de salvar

**Link de Ajuda**:
- "Como obter minha API Key?" → Abre modal com tutorial:
  1. Acesse seu painel Evolution API
  2. Vá em Configurações > API Keys
  3. Gere uma nova key ou copie a existente
  4. Cole aqui no SiderHub

---

### 3.2.2 Dashboard Principal

**Métricas Exibidas**:
```
┌─────────────────────────────────────────────────────┐
│  📊 Dashboard Hidra                                 │
│  [⚙️ Configurações Evolution API]                   │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 1,234    │ │ 987      │ │ 42       │           │
│  │ Enviadas │ │ Entregues│ │ Falhas   │           │
│  │ (30 dias)│ │ (80%)    │ │ (3.4%)   │           │
│  └──────────┘ └──────────┘ └──────────┘           │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 5        │ │ 3        │ │ 150      │           │
│  │ Campanhas│ │ Ativas   │ │ Msg/dia  │           │
│  │ Total    │ │ Agora    │ │ (média)  │           │
│  └──────────┘ └──────────┘ └──────────┘           │
│                                                     │
│  📈 Envios nos últimos 7 dias                      │
│  [Gráfico de linha aqui]                           │
│   250│     ●                                        │
│   200│   ●   ●                                      │
│   150│ ●       ●     ●                              │
│   100│             ●   ●   ●                        │
│    50│                                              │
│      └─────────────────────────                    │
│       Seg Ter Qua Qui Sex Sáb Dom                  │
│                                                     │
│  ═══════════════════════════════════════════       │
│                                                     │
│  🚀 Campanhas Recentes:                            │
│  [Ver todas as campanhas]                          │
│                                                     │
│  • Campanha Black Friday - Ativa (120/500 enviadas│
│  • Onboarding Novos Leads - Pausada (45/200)      │
│  • Recuperação Carrinho - Concluída ✅             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Métricas**:
- **Enviadas**: Total de mensagens enviadas via suas campanhas (últimos 30 dias)
- **Entregues**: Confirmadas pela Evolution API como entregues (% de sucesso)
- **Falhas**: Mensagens que falharam (número inválido, bloqueado, erro API)
- **Campanhas Total**: Todas as campanhas criadas
- **Ativas Agora**: Campanhas rodando no momento
- **Msg/dia**: Média de mensagens enviadas por dia (últimos 7 dias)

**Gráfico**:
- Linha temporal dos últimos 7 dias
- Mostra volume de envios por dia
- Hover: tooltip com número exato

**Link "Configurações Evolution API"**:
- Permite reconectar/atualizar URL e API Key
- Testar conexão novamente
- Ver status da conexão (✅ Conectado | ❌ Erro)

---

### 3.2.3 Campanhas

#### Listagem de Campanhas

**Tabela com colunas**:
```
┌────────────────────────────────────────────────────────────┐
│  🚀 Minhas Campanhas                [+ Nova Campanha]     │
│                                                            │
│  [Buscar...] [Filtro: Todas ▼] [Ordenar: Recentes ▼]     │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Nome       │ Status  │ Progresso  │ Taxa │ Ações    │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ Black      │ 🟢 Ativa│ 120/500    │ 94%  │ [⏸][✏️] │ │
│  │ Friday     │         │ ████░░░░░  │      │ [🗑️]    │ │
│  │ 15/01/2025 │         │ 24%        │      │          │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ Onboarding │ ⏸ Pausada 45/200    │ 89%  │ [▶️][✏️] │ │
│  │ Novos      │         │ ███░░░░░░  │      │ [🗑️]    │ │
│  │ 12/01/2025 │         │ 22%        │      │          │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ Recuperação│ ✅ Concl.│ 180/180   │ 96%  │ [📊][📋] │ │
│  │ Carrinho   │         │ ██████████ │      │ [🗑️]    │ │
│  │ 08/01/2025 │         │ 100%       │      │          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [← Anterior]  Página 1 de 3  [Próxima →]                │
└────────────────────────────────────────────────────────────┘
```

**Colunas**:
- **Nome**: Nome da campanha + data de criação
- **Status**: 
  - 🟢 Ativa (enviando agora)
  - ⏸ Pausada (programada mas pausada manualmente)
  - 📅 Agendada (vai começar em data futura)
  - ✅ Concluída (todas mensagens enviadas)
  - ❌ Erro (problema na Evolution API)
- **Progresso**: 
  - Enviadas/Total
  - Barra visual
  - Porcentagem
- **Taxa de sucesso**: % de mensagens entregues vs enviadas
- **Ações**:
  - ⏸ Pausar (se ativa)
  - ▶️ Retomar (se pausada)
  - ✏️ Editar
  - 📊 Ver relatório
  - 📋 Duplicar campanha
  - 🗑️ Deletar

**Filtros**:
- Todas
- Ativas
- Pausadas
- Agendadas
- Concluídas
- Com erros

**Ordenação**:
- Mais recentes
- Mais antigas
- Nome (A-Z)
- Progresso (maior primeiro)

---

#### Criar/Editar Campanha (Wizard Multi-Step)

**Wizard Steps**:
1. Informações Básicas
2. Mensagem
3. Lista de Contatos
4. Agendamento
5. Revisão

---

##### **Step 1: Informações Básicas**

```
┌──────────────────────────────────────────────────┐
│  Nova Campanha - Passo 1/5                       │
│  ● Informações  ○ Mensagem  ○ Contatos  ○ ...   │
├──────────────────────────────────────────────────┤
│                                                  │
│  📝 Nome da Campanha *                          │
│  [Black Friday 2025                          ]  │
│                                                  │
│  📄 Descrição (opcional)                        │
│  [Campanha de ofertas especiais para         ]  │
│  [clientes que não compraram nos últimos...   ]  │
│                                                  │
│  [Cancelar]                    [Próximo →]      │
└──────────────────────────────────────────────────┘
```

**Validação**:
- Nome obrigatório (min 3 chars, max 100)

---

##### **Step 2: Mensagem e Mídia**

```
┌──────────────────────────────────────────────────┐
│  Nova Campanha - Passo 2/5                       │
│  ✓ Informações  ● Mensagem  ○ Contatos  ○ ...   │
├──────────────────────────────────────────────────┤
│                                                  │
│  💬 Texto da Mensagem *                         │
│  ┌────────────────────────────────────────────┐ │
│  │ Olá {nome}!                                │ │
│  │                                            │ │
│  │ Temos uma OFERTA ESPECIAL de Black Friday │ │
│  │ só para você! 🔥                           │ │
│  │                                            │ │
│  │ Use o cupom: {cupom} e ganhe 50% OFF!     │ │
│  │                                            │ │
│  │ Acesse: {link}                             │ │
│  └────────────────────────────────────────────┘ │
│  350/4096 caracteres                            │
│                                                  │
│  ═══════════════════════════════════════════    │
│                                                  │
│  📎 Anexar Mídia (opcional)                     │
│                                                  │
│  Tipo de mídia:                                 │
│  [◉] Imagem     [ ] Vídeo                       │
│  [ ] Documento  [ ] Áudio                       │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │                                            │ │
│  │     [📁] Arraste o arquivo aqui           │ │
│  │         ou clique para selecionar         │ │
│  │                                            │ │
│  │  Imagem: JPG, PNG (máx 5MB)               │ │
│  │  Vídeo: MP4, MOV (máx 16MB)               │ │
│  │  Documento: PDF, DOCX, XLSX (máx 10MB)    │ │
│  │  Áudio: MP3, OGG (máx 5MB)                │ │
│  │                                            │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ─── OU ───                                     │
│                                                  │
│  📷 Arquivo: oferta_blackfriday.jpg ✓           │
│  2.3 MB • 1920x1080px                           │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │                                            │ │
│  │     [PREVIEW DA IMAGEM AQUI]              │ │
│  │                                            │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [🗑️ Remover mídia]                            │
│                                                  │
│  ═══════════════════════════════════════════    │
│                                                  │
│  💡 Variáveis disponíveis:                      │
│  {nome} {telefone} {email} [+ seus campos CSV]  │
│                                                  │
│  ─────────────────────────────────────────────  │
│                                                  │
│  📱 Preview no WhatsApp:                        │
│  ┌────────────────────────────────────────────┐ │
│  │ WhatsApp                            10:30  │ │
│  │ ───────────────────────────────────────── │ │
│  │                                            │ │
│  │  ┌──────────────────────────────────────┐ │ │
│  │  │ [IMAGEM: oferta_blackfriday.jpg]     │ │ │
│  │  │                                      │ │ │
│  │  │ Olá João Silva!                      │ │ │
│  │  │                                      │ │ │
│  │  │ Temos uma OFERTA ESPECIAL de Black   │ │ │
│  │  │ Friday só para você! 🔥              │ │ │
│  │  │                                      │ │ │
│  │  │ Use o cupom: BF2025 e ganhe 50% OFF!│ │ │
│  │  │                                      │ │ │
│  │  │ Acesse: bit.ly/oferta123            │ │ │
│  │  └──────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [← Voltar]                    [Próximo →]      │
└──────────────────────────────────────────────────┘
```

**Funcionalidades**:

**Texto da Mensagem**:
- Textarea com contador de caracteres (limite WhatsApp: 4096)
- **Variáveis personalizadas**: `{nome}`, `{telefone}`, `{email}`, + campos do CSV
- **Preview em tempo real**: mostra como ficará no WhatsApp

**Upload de Mídia** (opcional):
- **Tipos aceitos**:
  - **Imagem**: JPG, JPEG, PNG, WebP (max 5MB)
  - **Vídeo**: MP4, MOV, AVI (max 16MB - limite do WhatsApp)
  - **Documento**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (max 10MB)
  - **Áudio**: MP3, OGG, AAC, M4A (max 5MB)

- **Features**:
  - Drag & drop OU seleção de arquivo
  - Preview visual (imagem mostra thumbnail, vídeo mostra primeiro frame)
  - Validação de tipo e tamanho
  - Compressão automática se necessário (apenas imagens)
  - Opção de remover e trocar mídia

**Validações**:
- Mensagem não vazia (texto OU mídia obrigatório)
- Se mídia anexada: formato e tamanho válidos
- Variáveis usadas devem existir no CSV (validado no próximo step)
- WhatsApp aceita mídia + texto juntos (caption)

**Comportamento**:
- Mídia é upada para Supabase Storage temporariamente
- Durante envio da campanha, Evolution API recebe:
  - Texto como `caption`
  - Mídia como base64 (ou URL pública se Evolution API suportar)
- Preview mostra exatamente como aparecerá no WhatsApp do destinatário

---

##### **Step 3: Lista de Contatos**

```
┌──────────────────────────────────────────────────┐
│  Nova Campanha - Passo 3/5                       │
│  ✓ Informações  ✓ Mensagem  ● Contatos  ○ ...   │
├──────────────────────────────────────────────────┤
│                                                  │
│  📋 Adicionar Contatos:                         │
│                                                  │
│  [◉] Fazer upload de CSV                        │
│  [ ] Importar de lista salva                    │
│  [ ] Adicionar manualmente                      │
│                                                  │
│  ═══════════════════════════════════════════    │
│                                                  │
│  📄 Upload de CSV:                              │
│  ┌────────────────────────────────────────────┐ │
│  │                                            │ │
│  │     [📁] Arraste o arquivo aqui           │ │
│  │         ou clique para selecionar         │ │
│  │                                            │ │
│  │     Formato aceito: .csv                  │ │
│  │     Tamanho máximo: 10MB                  │ │
│  │                                            │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [📘 Ver formato de CSV esperado]               │
│                                                  │
│  ─── OU ───                                     │
│                                                  │
│  📄 Arquivo: contatos_blackfriday.csv ✓         │
│  ✅ 487 contatos válidos                        │
│  ⚠️ 13 contatos com avisos (números duplicados) │
│  ❌ 5 contatos inválidos (formato incorreto)    │
│                                                  │
│  [Ver detalhes] [Remover arquivo]               │
│                                                  │
│  ═══════════════════════════════════════════    │
│                                                  │
│  📊 Preview dos contatos:                       │
│  ┌────────────────────────────────────────────┐ │
│  │ Nome         │ Telefone        │ Email    │ │
│  ├────────────────────────────────────────────┤ │
│  │ João Silva   │ +5511999999999  │ joao@... │ │
│  │ Maria Santos │ +5511988888888  │ maria@...│ │
│  │ ...          │ ...             │ ...      │ │
│  └────────────────────────────────────────────┘ │
│  Exibindo primeiros 10 de 487 contatos          │
│                                                  │
│  [← Voltar]                    [Próximo →]      │
└──────────────────────────────────────────────────┘
```

**Formato CSV Esperado** (modal ao clicar em "Ver formato"):
```csv
nome,telefone,email,cupom,link
João Silva,5511999999999,joao@exemplo.com,BF2025,bit.ly/joao123
Maria Santos,5511988888888,maria@exemplo.com,BF2026,bit.ly/maria456
```

**Regras de Validação**:
1. **Colunas obrigatórias**: `nome`, `telefone`
2. **Telefone**:
   - Formato: apenas números
   - Código país (55 para Brasil)
   - DDD + número (11 ou 10 dígitos)
   - Exemplos válidos: `5511999999999`, `5521988888888`
   - Sistema automaticamente adiciona `+` no início
3. **Deduplicação**: Remove telefones duplicados automaticamente
4. **Campos extras**: Qualquer coluna extra vira variável disponível na mensagem

**Feedback após Upload**:
- ✅ Contatos válidos: adicionados
- ⚠️ Avisos: duplicados (mostra quais), números limpos (espaços/hífens removidos)
- ❌ Inválidos: formato errado, linhas vazias (mostra linha e motivo)

**Opções Futuras** (não MVP):
- [ ] Importar de lista salva (listas criadas em outras campanhas)
- [ ] Adicionar manualmente (form com campos)

---

##### **Step 4: Agendamento**

```
┌──────────────────────────────────────────────────┐
│  Nova Campanha - Passo 4/5                       │
│  ✓ Informações  ✓ Mensagem  ✓ Contatos  ● Agen. │
├──────────────────────────────────────────────────┤
│                                                  │
│  📅 Quando enviar?                              │
│                                                  │
│  [◉] Começar imediatamente                      │
│  [ ] Agendar para data/hora específica          │
│                                                  │
│  ─────────────────────────────────────────────  │
│                                                  │
│  ⚙️ Configurações de Envio:                     │
│                                                  │
│  📊 Limite diário de disparos:                  │
│  [200                    ] mensagens/dia        │
│  💡 Recomendado: 200-500 para evitar bloqueios  │
│                                                  │
│  📆 Dias da semana permitidos:                  │
│  [✓] Seg  [✓] Ter  [✓] Qua  [✓] Qui  [✓] Sex  │
│  [ ] Sáb  [ ] Dom                               │
│                                                  │
│  🕐 Horário de envio:                           │
│  Das [09:00 ▼] às [18:00 ▼]                    │
│                                                  │
│  ⏱️ Intervalo entre mensagens:                  │
│  [15                    ] segundos              │
│  💡 Recomendado: 10-30 segundos                 │
│                                                  │
│  ─────────────────────────────────────────────  │
│                                                  │
│  📈 Previsão de Conclusão:                      │
│  Com base nas configurações acima:              │
│  • Total de contatos: 487                       │
│  • Limite diário: 200                           │
│  • Mensagens por hora: ~240 (intervalo 15s)    │
│  • Horário: 9h-18h (9 horas)                    │
│                                                  │
│  ⏰ Estimativa: 3 dias úteis                    │
│  📅 Conclusão prevista: 18/01/2025              │
│                                                  │
│  [← Voltar]                    [Próximo →]      │
└──────────────────────────────────────────────────┘
```

**Campos**:

1. **Início da Campanha**:
   - Imediato OU agendado
   - Se agendado: DateTimePicker

2. **Limite Diário**:
   - Input numérico (padrão: 200)
   - Info: "Sem limite técnico do SiderHub, mas recomendamos 200-500/dia para evitar bloqueio do WhatsApp"

3. **Dias permitidos**:
   - Checkboxes para cada dia da semana
   - Padrão: Seg-Sex marcados

4. **Horário**:
   - Select com horas (0-23)
   - Padrão: 9h-18h

5. **Intervalo entre mensagens**:
   - Input numérico em segundos
   - Padrão: 15s
   - Info: "Intervalos curtos podem aumentar risco de bloqueio"

**Cálculo de Previsão**:
- Sistema calcula automaticamente:
  - Mensagens possíveis por hora (3600 / intervalo)
  - Mensagens por dia (msg/hora * horas trabalhadas)
  - Dias necessários (total / msg_por_dia)
  - Data prevista de conclusão

**Validações**:
- Limite diário > 0
- Pelo menos 1 dia da semana selecionado
- Horário início < horário fim
- Intervalo >= 5 segundos

---

##### **Step 5: Revisão e Confirmação**

```
┌──────────────────────────────────────────────────┐
│  Nova Campanha - Passo 5/5                       │
│  ✓ Informações  ✓ Mensagem  ✓ Contatos  ✓ Agen. │
├──────────────────────────────────────────────────┤
│                                                  │
│  ✅ Revise os detalhes da campanha:             │
│                                                  │
│  📝 Informações Básicas:                        │
│  • Nome: Black Friday 2025                      │
│  • Descrição: Campanha de ofertas especiais... │
│  [✏️ Editar]                                     │
│                                                  │
│  ─────────────────────────────────────────────  │
│                                                  │
│  💬 Mensagem:                                   │
│  "Olá {nome}! Temos uma OFERTA ESPECIAL..."    │
│  [✏️ Editar]                                     │
│                                                  │
│  ─────────────────────────────────────────────  │
│                                                  │
│  📋 Contatos:                                   │
│  • Total: 487 contatos                          │
│  • Arquivo: contatos_blackfriday.csv            │
│  [✏️ Editar]                                     │
│                                                  │
│  ─────────────────────────────────────────────  │
│                                                  │
│  📅 Agendamento:                                │
│  • Início: Imediatamente após criação          │
│  • Limite diário: 200 mensagens                 │
│  • Dias: Seg-Sex                                │
│  • Horário: 9h-18h                              │
│  • Intervalo: 15 segundos                       │
│  • Conclusão prevista: 18/01/2025              │
│  [✏️ Editar]                                     │
│                                                  │
│  ═══════════════════════════════════════════    │
│                                                  │
│  [← Voltar]  [Salvar Rascunho]  [Criar e Ativar│
└──────────────────────────────────────────────────┘
```

**Ações Finais**:
- **Voltar**: Retorna ao step anterior
- **Salvar como Rascunho**: Cria campanha com status `draft` (não inicia envios)
- **Criar e Ativar**: Cria campanha e inicia envios imediatamente (ou no horário agendado)

**Após Criar**:
- Redirect para dashboard
- Toast de sucesso: "Campanha criada com sucesso! 🎉"
- Se início imediato: Toast adicional "Enviando mensagens..."

---

### 3.2.4 Listas de Contatos (Futuro - Não MVP)

[Gerenciamento de listas reutilizáveis - será implementado em versão futura]

---

### 3.2.5 Relatórios de Campanha

**Página: Relatório Detalhado**

```
┌──────────────────────────────────────────────────┐
│  📊 Relatório: Black Friday 2025                 │
│  [Voltar] [Exportar CSV] [Exportar PDF]         │
├──────────────────────────────────────────────────┤
│                                                  │
│  📈 Visão Geral:                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 487      │ │ 458      │ │ 29       │        │
│  │ Total    │ │ Entregues│ │ Falhas   │        │
│  │          │ │ (94%)    │ │ (6%)     │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                  │
│  Status: ✅ Concluída em 17/01/2025             │
│  Duração: 3 dias úteis                          │
│                                                  │
│  ─────────────────────────────────────────────  │
│                                                  │
│  📊 Progresso ao Longo do Tempo:                │
│  [Gráfico de linha: envios por dia]            │
│                                                  │
│  ─────────────────────────────────────────────  │
│                                                  │
│  📋 Detalhes por Contato:                       │
│  [Buscar...]  [Filtro: Todos ▼]                │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Nome      │ Telefone    │ Status │ Data    │ │
│  ├────────────────────────────────────────────┤ │
│  │ João Silva│ +5511999... │ ✅ OK  │ 15/01   │ │
│  │ Maria S.  │ +5511988... │ ✅ OK  │ 15/01   │ │
│  │ Pedro O.  │ +5511977... │ ❌ Falha│ 16/01  │ │
│  │           │             │ (Inv.) │         │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [← Anterior]  Página 1 de 20  [Próxima →]     │
│                                                  │
│  ─────────────────────────────────────────────  │
│                                                  │
│  ❌ Logs de Erros (29):                         │
│  [Ver todos os erros]                           │
│                                                  │
│  • +5511977777777: Número inválido (12 erros)  │
│  • +5521966666666: Bloqueado pelo WhatsApp (8) │
│  • Timeout na Evolution API (5 erros)          │
│  • Outros (4 erros)                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Seções**:
1. **Visão Geral**: Cards com totais e percentuais
2. **Gráfico**: Envios por dia/hora
3. **Tabela de Contatos**: Lista completa com status individual
4. **Logs de Erros**: Agrupados por tipo de erro

**Filtros na Tabela**:
- Todos
- Entregues
- Falhas
- Pendentes

**Exportação**:
- CSV: Todos os contatos com status
- PDF: Relatório formatado com gráficos

---

### 3.2.6 Configurações do Hidra

**Página de Configurações**:
```
┌──────────────────────────────────────────────────┐
│  ⚙️ Configurações - Hidra                        │
├──────────────────────────────────────────────────┤
│                                                  │
│  🔗 Evolution API:                              │
│  • Status: ✅ Conectado                         │
│  • Servidor: https://evolution.exemplo.com      │
│  • Última verificação: há 5 minutos             │
│                                                  │
│  [Testar Conexão]  [Reconectar]                 │
│                                                  │
│  ─────────────────────────────────────────────  │
│                                                  │
│  ⚙️ Configurações Padrão (para novas campanhas):│
│                                                  │
│  Limite diário: [200] mensagens                 │
│  Intervalo: [15] segundos                       │
│  Horário: [09:00] às [18:00]                    │
│                                                  │
│  Dias permitidos:                               │
│  [✓] Seg [✓] Ter [✓] Qua [✓] Qui [✓] Sex      │
│  [ ] Sáb [ ] Dom                                │
│                                                  │
│  [Salvar Alterações]                            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Funcionalidades**:
- Ver status da conexão Evolution API
- Testar conexão manualmente
- Reconectar (atualizar URL/API Key)
- Configurar valores padrão para novas campanhas
- [Futuro: Templates de mensagem salvos]

---

## 3.3 SaaS 2: Cybervault (Biblioteca de Recursos)

### Visão Geral
Repositório centralizado de recursos (PDFs, vídeos, templates, planilhas, etc.) organizados por categorias.

---

### 3.3.1 Página Principal

**Layout**:
```
┌─────────────────────────────────────────────────┐
│  🗄️ Cybervault - Biblioteca de Recursos        │
│                                                 │
│  [Barra de Busca]                    [Filtros]  │
│                                                 │
│  Categorias:                                    │
│  [Todas] [Templates] [Planilhas] [PDFs] [...]  │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 📄 Doc1  │ │ 📊 Plan1 │ │ 🎨 Temp1 │       │
│  │ Template │ │ Financeira│ │ Branding │       │
│  │ 2.5 MB   │ │ 1.2 MB   │ │ 5.3 MB   │       │
│  │ [⬇️ Baixar]│ │ [⬇️ Baixar]│ │ [⬇️ Baixar]│       │
│  └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────┘
```

---

### 3.3.2 Organização por Categorias

**Categorias** (configuráveis pelo admin):
- [A CONFIRMAR: Quais categorias iniciais? Ex: Templates, Planilhas, PDFs, Vídeos, Imagens, Ebooks, Scripts, etc.]
- Possibilidade de adicionar/editar/deletar categorias

**Filtros**:
- Por categoria
- Por tipo de arquivo (extensão)
- Por data de upload
- Por tamanho

**Busca**:
- Por nome do recurso
- Por descrição/tags

---

### 3.3.3 Card de Recurso

**Informações exibidas**:
- Thumbnail/ícone (baseado no tipo de arquivo)
- Nome do arquivo
- Tipo de arquivo (extensão)
- Tamanho
- Data de upload
- [A CONFIRMAR: Descrição curta?]
- [A CONFIRMAR: Tags?]
- [A CONFIRMAR: Nº de downloads?]
- [Botão] Download

---

### 3.3.4 Página de Detalhes do Recurso (Opcional)

[A CONFIRMAR SE NECESSÁRIO]

**Poderia incluir**:
- Preview do arquivo (se possível: PDF viewer, image viewer)
- Descrição completa
- Tags
- Estatísticas (downloads, visualizações)
- Recursos relacionados
- Comentários/avaliações

---

### 3.3.5 Download

**Comportamento**:
- Click no botão "Download" → inicia download direto
- [A CONFIRMAR: Tracking de quem baixou o quê?]
- [A CONFIRMAR: Limite de downloads por membro?]
- [A CONFIRMAR: Versões diferentes do mesmo arquivo?]

---

### 3.3.6 Upload de Recursos (Admin)

**Interface para Admin**:
- Upload de arquivo (drag & drop OU seleção)
- Tamanho máximo: [A CONFIRMAR: 50MB? 100MB? ilimitado?]
- Formatos aceitos: [A CONFIRMAR: Todos? OU lista específica?]
- Campos:
  - Nome do recurso
  - Descrição
  - Categoria (dropdown)
  - Tags (opcional)
  - Thumbnail customizada (opcional)
- [Botão] Upload

---

## 4. Painel de Administração

[A COMPLETAR COM MAIS DETALHES]

### 4.1 Gestão de Banners (Homepage)
- CRUD completo de banners
- Upload de imagens
- Configuração de CTAs
- Ordenação (drag & drop?)
- Ativar/desativar banners

### 4.2 Gestão de Membros
[A CONFIRMAR SE NECESSÁRIO]
- Adicionar novo membro manualmente
- Editar informações
- Desativar/reativar conta
- Redefinir senha
- Ver histórico de atividades

### 4.3 Gestão da Academia
- CRUD de cursos
- CRUD de módulos
- CRUD de aulas
- Upload de vídeos
- Upload de anexos
- [A CONFIRMAR: Moderação de comentários?]

### 4.4 Gestão do Cybervault
- CRUD de categorias
- Upload de recursos
- Editar/deletar recursos
- Ver estatísticas de downloads

### 4.5 Analytics Geral
[A CONFIRMAR SE NECESSÁRIO]
- Membros ativos
- Uso por SaaS
- Cursos mais acessados
- Recursos mais baixados

---

## 5. Requisitos de Autenticação & Permissões

### 5.1 Autenticação

**Login Único (SSO)**:
- Membro faz login UMA VEZ no SiderHub
- Acesso automático a todos os SaaS permitidos para ele
- Sessão compartilhada entre todos os sub-apps
- Token JWT gerenciado pelo Supabase Auth

**Fluxo de Login**:
1. Membro acessa siderhub.com
2. Tela de login (email + senha)
3. Após autenticação → redirect para homepage do Hub
4. Ao clicar em qualquer SaaS → verifica permissões e redireciona
5. Se não tiver permissão → mensagem "Você não tem acesso a este SaaS"

**Métodos de Autenticação**:
- Email + Senha (obrigatório)
- [Futuro: OAuth via Google/Facebook]

### 5.2 Sistema de Permissões Granular

**Conceito**: Admins controlam EXATAMENTE o que cada membro pode acessar.

#### Níveis de Usuário

**1. Super Admin**
- Acesso total ao sistema
- Gerencia outros admins
- Configurações globais
- Acesso a todos os SaaS e cursos

**2. Admin**
- Gerencia membros (criar, editar, desativar)
- Gerencia cursos e aulas
- Gerencia recursos (Cybervault)
- Modera comentários
- Configura banners
- **NÃO pode** criar outros admins
- **NÃO pode** alterar configurações globais

**3. Membro**
- Acesso personalizado definido por admin
- Pode ter acesso a:
  - Hidra (sim/não)
  - Cybervault (sim/não)
  - Academia (todos os cursos OU cursos específicos)
- Não tem acesso ao painel admin

#### Gestão de Permissões por Membro

**Tela: Editar Membro (Admin)**

```
┌───────────────────────────────────────────────┐
│  Editar Membro: João Silva                    │
├───────────────────────────────────────────────┤
│  📧 Email: joao@example.com                   │
│  👤 Nome: João Silva                          │
│  📅 Data de cadastro: 01/01/2025             │
│  ✅ Status: Ativo                             │
│                                               │
│  ═══ PERMISSÕES DE ACESSO ═══                │
│                                               │
│  🔧 SaaS:                                     │
│    [✓] Hidra (Disparador WhatsApp)           │
│    [✓] Cybervault (Biblioteca de Recursos)   │
│    [ ] [Futuro SaaS 3]                        │
│                                               │
│  🎓 Academia:                                 │
│    Acesso aos cursos:                         │
│    [○] Todos os cursos                        │
│    [●] Cursos específicos                     │
│                                               │
│    Cursos selecionados:                       │
│    [✓] Fundamentos de WhatsApp Marketing     │
│    [✓] Automação Avançada                    │
│    [ ] Growth Hacking Masterclass            │
│    [ ] Copywriting para Conversão            │
│                                               │
│  [Salvar Alterações]  [Cancelar]             │
└───────────────────────────────────────────────┘
```

**Comportamento**:
- Admin marca/desmarca SaaS disponíveis para o membro
- Para Academia: escolhe "todos" OU seleciona cursos específicos
- Mudanças são aplicadas imediatamente
- Membro perde acesso instantaneamente ao desmarcar

#### Controle de Acesso por SaaS

**Hidra**:
- Se membro NÃO tem permissão:
  - Card não aparece no carrossel do hub
  - Tentativa de acesso direto via URL → redirect para homepage com toast "Você não tem acesso ao Hidra"

**Cybervault**:
- Se membro NÃO tem permissão:
  - Card não aparece no carrossel
  - Tentativa de acesso direto → redirect + mensagem

**Academia**:
- Se membro NÃO tem permissão a nenhum curso:
  - Seção Academia não aparece na homepage
- Se tem permissão a cursos específicos:
  - Lista mostra APENAS os cursos permitidos
  - Tentativa de acessar curso não permitido → redirect + mensagem

### 5.3 Gestão de Sessão

**Token JWT (Supabase Auth)**:
- Armazenado em httpOnly cookie
- Expiração: 7 dias
- Refresh automático (30 dias)
- Revogação: admin pode forçar logout de um membro específico

**Segurança**:
- Rate limiting em tentativas de login (5 tentativas / 15min)
- IP tracking para detecção de tentativas suspeitas
- [Futuro: 2FA para admins]

**Logout**:
- Logout individual: apenas no dispositivo atual
- [Admin pode]: Forçar logout em todos os dispositivos de um membro

---

## 6. Requisitos Técnicos

### 6.1 Stack Tecnológico
- **Frontend**: React + Next.js 14+ (App Router)
- **Backend/Database**: Supabase Cloud
  - PostgreSQL (database)
  - Supabase Auth (autenticação)
  - Supabase Storage (arquivos)
  - Supabase Realtime (opcional para notificações)
- **UI Components**: Shadcn/ui
- **Estilização**: TailwindCSS
- **Validação**: Zod
- **Video Player**: Video.js 8.x (self-hosted)
  - Plugins: quality-levels, hotkeys, custom progress tracker
- **Form Management**: React Hook Form
- **State Management**: Zustand (ou Tanstack Query para server state)
- **Video Encoding**: FFmpeg (para encoding pré-upload, futuro: worker automático)

### 6.2 Arquitetura de Database (Supabase)

**Estratégia: Multi-Schema no mesmo Supabase Project**

**Por quê usar schemas separados?**
- ✅ **Organização**: Cada SaaS tem seu próprio namespace
- ✅ **Manutenção**: Facilita entender qual tabela pertence a qual módulo
- ✅ **Segurança**: Row Level Security (RLS) policies isoladas por schema
- ✅ **Escalabilidade**: Mais fácil migrar um schema específico se necessário

**Estrutura de Schemas**:

```sql
-- Schema: public (auth + global)
public
  ├── profiles (extend do auth.users)
  ├── user_permissions (quais SaaS/cursos cada user pode acessar)
  └── admin_users

-- Schema: hub
hub
  ├── homepage_banners
  ├── saas_modules (lista dos SaaS disponíveis)
  └── activity_logs

-- Schema: academy
academy
  ├── courses
  ├── modules
  ├── lessons
  ├── lesson_attachments
  ├── lesson_progress (tracking de progresso)
  ├── lesson_comments
  ├── comment_replies (threads)
  ├── lesson_ratings
  └── course_enrollments

-- Schema: hidra
hidra
  ├── evolution_api_configs (URL + API Key por user)
  ├── campaigns
  ├── campaign_contacts
  ├── campaign_messages (log de envios)
  └── campaign_errors

-- Schema: cybervault
cybervault
  ├── categories
  ├── resources
  ├── resource_downloads (tracking)
  └── resource_tags
```

**Benefícios desta Abordagem**:
1. **Queries organizadas**: `SELECT * FROM academy.courses` deixa claro de onde vem
2. **Migrations separadas**: Pode migrar só o schema `hidra` sem afetar `academy`
3. **Permissions granulares**: RLS policies específicas por schema
4. **Desenvolvimento paralelo**: Times diferentes podem trabalhar em schemas diferentes

**Exemplo de Tabela com Schema**:
```sql
CREATE TABLE academy.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE academy.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see courses they have access to"
ON academy.courses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_permissions up
    WHERE up.user_id = auth.uid()
    AND (
      up.all_courses = true 
      OR up.course_ids @> ARRAY[academy.courses.id]
    )
  )
);
```

### 6.3 Integração Evolution API (Hidra)

**Comunicação**:
- SiderHub → Evolution API do membro (via HTTPS)
- API REST
- Autenticação via API Key (no header)

**Endpoints Principais** (da Evolution API):
```
POST   /message/sendText          # Enviar mensagem de texto
POST   /message/sendMedia          # Enviar imagem/vídeo/documento
POST   /message/sendAudio          # Enviar áudio
GET    /message/status/:messageId  # Consultar status de entrega
GET    /instance/connectionState   # Verificar conexão WhatsApp
POST   /instance/connect           # Conectar instância
```

**Tipos de Envio Suportados**:

1. **Texto Simples**
```typescript
POST /message/sendText
{
  "number": "5511999999999",
  "text": "Olá! Sua mensagem aqui..."
}
```

2. **Imagem com Caption**
```typescript
POST /message/sendMedia
{
  "number": "5511999999999",
  "mediatype": "image",
  "mimetype": "image/jpeg",
  "media": "base64_encoded_image_here", // ou URL pública
  "fileName": "oferta.jpg",
  "caption": "Olá! Confira esta oferta especial..."
}
```

3. **Vídeo com Caption**
```typescript
POST /message/sendMedia
{
  "number": "5511999999999",
  "mediatype": "video",
  "mimetype": "video/mp4",
  "media": "base64_encoded_video_here", // ou URL pública
  "fileName": "demo.mp4",
  "caption": "Veja este vídeo explicativo..."
}
```

4. **Documento (PDF, DOCX, XLSX, etc)**
```typescript
POST /message/sendMedia
{
  "number": "5511999999999",
  "mediatype": "document",
  "mimetype": "application/pdf",
  "media": "base64_encoded_pdf_here", // ou URL pública
  "fileName": "catalogo.pdf",
  "caption": "Segue nosso catálogo completo!"
}
```

5. **Áudio**
```typescript
POST /message/sendAudio
{
  "number": "5511999999999",
  "audio": "base64_encoded_audio_here", // ou URL pública
  "encoding": true // para áudio PTT (push-to-talk)
}
```

**Flow de Envio com Mídia**:

1. **Upload no SiderHub**:
   - Admin/membro faz upload da mídia no wizard
   - Sistema valida tipo, tamanho, formato
   - Upload para Supabase Storage (`hidra-campaign-media/`)
   - Salva URL pública do arquivo

2. **Preparação da Campanha**:
   - Sistema salva em `hidra.campaign_messages`:
     - `message_text` (caption)
     - `media_url` (URL do Supabase Storage)
     - `media_type` (image/video/document/audio)
     - `media_filename`
     - `media_mimetype`
     - `status` = `pending`

3. **Envio via Evolution API**:
   - Cron job processa mensagens pendentes
   - Para cada mensagem com mídia:
     a. **Opção A - Base64** (mais compatível):
        - Download arquivo do Supabase Storage
        - Converte para base64
        - Envia para Evolution API com base64
     b. **Opção B - URL Pública** (mais eficiente):
        - Envia URL pública diretamente
        - Evolution API faz download
   - Atualiza status: `sending` → `sent` | `failed`
   - Salva `message_id` retornado pela API

4. **Verificação de Status**:
   - Outro cron job consulta status das mensagens `sent`
   - Evolution API retorna: `pending`, `sent`, `delivered`, `read`, `failed`
   - Atualiza tabela com status final

**Limites e Restrições** (do WhatsApp via Evolution API):
- **Imagem**: Max 5MB (JPG, PNG, WebP)
- **Vídeo**: Max 16MB (MP4, 3GP, MOV, AVI)
- **Documento**: Max 100MB (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP)
- **Áudio**: Max 16MB (MP3, OGG, AAC, M4A, OPUS)
- **Caption**: Max 1024 caracteres quando há mídia anexada

**Validações no SiderHub**:
- Tipo de arquivo permitido para o mediatype
- Tamanho dentro do limite
- Formato MIME type correto
- Se mídia for muito grande → sugerir compressão/conversão

**Tratamento de Erros**:
- Arquivo corrompido → salvar erro e notificar admin
- Timeout no upload/envio → retry automático (max 3x)
- Evolution API offline → pausar campanha e alertar membro
- WhatsApp bloqueou número → marcar contato como bloqueado
- Mídia inválida → registrar erro específico no log

**Segurança**:
- API Keys armazenadas **criptografadas** no banco
- Decrypt apenas no momento do uso
- Rate limiting para evitar abuso (respeitando limites do WhatsApp)
- Validação de MIME type server-side (não confiar no client)

### 6.4 Armazenamento (Supabase Storage)

**Buckets**:
```
hub-banners/          # Imagens dos banners da homepage
  └── {banner_id}.jpg

academy-videos/       # Vídeos das aulas (self-hosted)
  └── {course_id}/
      └── {lesson_id}/
          ├── video_1080p.mp4  # Qualidade máxima
          ├── video_720p.mp4   # Qualidade média (opcional)
          ├── video_480p.mp4   # Qualidade baixa (opcional)
          └── thumbnail.jpg    # Thumbnail do vídeo

academy-attachments/  # Anexos das aulas
  └── {lesson_id}/
      └── {filename}

hidra-campaign-media/ # Mídia das campanhas do Hidra (NEW)
  └── {user_id}/
      └── {campaign_id}/
          ├── {media_id}_image.jpg
          ├── {media_id}_video.mp4
          ├── {media_id}_document.pdf
          └── {media_id}_audio.mp3

cybervault-resources/ # Recursos da biblioteca
  └── {category_id}/
      └── {resource_id}_{filename}

user-avatars/         # Avatars dos usuários
  └── {user_id}.jpg
```

**Policies de Acesso**:
- **hub-banners**: Public read (qualquer um vê)
- **academy-videos**: Authenticated read + RLS (apenas membros com acesso ao curso)
- **academy-attachments**: RLS (apenas quem tem acesso ao curso)
- **hidra-campaign-media**: RLS (apenas o dono da campanha + admins)
- **cybervault-resources**: RLS (apenas quem tem acesso ao Cybervault)
- **user-avatars**: Public read

**Limites e Especificações**:

| Tipo | Tamanho Máx | Formatos | Observações |
|------|-------------|----------|-------------|
| Banner | 5MB | JPG, PNG, WebP | Recomendado: 1920x1080px |
| Vídeo aula | 500MB | MP4 (H.264) | 1080p máx, bitrate 4-8 Mbps |
| Anexo aula | 50MB | Qualquer | PDF, DOCX, XLSX, ZIP, etc |
| **Hidra Imagem** | **5MB** | **JPG, PNG, WebP** | **Compressão auto se > 5MB** |
| **Hidra Vídeo** | **16MB** | **MP4, MOV, AVI** | **Limite do WhatsApp** |
| **Hidra Documento** | **10MB** | **PDF, DOC, XLS, PPT** | **Validação MIME type** |
| **Hidra Áudio** | **5MB** | **MP3, OGG, AAC, M4A** | **Para mensagens de voz** |
| Recurso Cybervault | 100MB | Qualquer | Todos os formatos aceitos |
| Avatar | 2MB | JPG, PNG | Recomendado: 512x512px |

**Encoding de Vídeos**:

**Processo Manual (MVP)**:
1. Admin faz upload do vídeo original
2. Sistema valida:
   - Formato: MP4
   - Codec: H.264
   - Resolução ≤ 1080p
   - Tamanho ≤ 500MB
3. Se válido → upload para Supabase Storage
4. Se inválido → mensagem de erro com instruções

**Processo Automatizado (Futuro - v2)**:
1. Admin faz upload de qualquer vídeo (MOV, AVI, MKV, etc)
2. Sistema enfileira job de encoding
3. Worker (FFmpeg) processa:
   ```bash
   # Gerar 1080p
   ffmpeg -i input.mp4 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -vf scale=1920:1080 output_1080p.mp4
   
   # Gerar 720p
   ffmpeg -i input.mp4 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -vf scale=1280:720 output_720p.mp4
   
   # Gerar thumbnail
   ffmpeg -i input.mp4 -ss 00:00:05 -vframes 1 thumbnail.jpg
   ```
4. Upload das versões encodadas para Supabase Storage
5. Atualiza registro da aula com URLs dos vídeos

**Recomendações para Admin (Documentação)**:
- Use HandBrake (GUI) ou FFmpeg (CLI) para encoding pré-upload
- Preset: "Fast 1080p30" ou similar
- Formato: MP4 (H.264 + AAC)
- Se vídeo > 500MB, reduza bitrate ou resolução

**CDN**:
- Supabase Storage tem CDN nativo (Cloudflare)
- Cache headers configurados automaticamente
- Geolocation: serve do edge mais próximo do usuário
- **Importante**: Primeiros loads podem ser lentos (cold start), depois fica em cache

---

## 7. Requisitos Não-Funcionais

### 7.1 Performance
- Tempo de carregamento da homepage: < 2s
- Tempo de carregamento de vídeo: < 3s (first frame)
- Carrossel fluido (60fps)
- Lazy loading de imagens

### 7.2 Segurança
- HTTPS obrigatório
- JWT tokens seguros (httpOnly cookies)
- Rate limiting em APIs
- Validação server-side de todos os inputs
- Files upload com validação de tipo/tamanho
- [A CONFIRMAR: 2FA para admins?]

### 7.3 Escalabilidade
- Suportar [A CONFIRMAR: 1.000? 10.000?] membros simultâneos
- Database indexing adequado
- CDN para assets estáticos

### 7.4 Compatibilidade
- Navegadores: Chrome, Firefox, Safari, Edge (últimas 2 versões)
- Responsivo: Mobile, Tablet, Desktop
- [A CONFIRMAR: Progressive Web App (PWA)?]

### 7.5 Disponibilidade
- Uptime target: 99.5%
- Backups diários do banco de dados
- [A CONFIRMAR: Disaster recovery plan?]

---

## 8. User Stories

### US-01: Acesso ao Hub
**Como** membro  
**Eu quero** fazer login no Hub  
**Para que** eu possa acessar todos os SaaS e a Academia com um único login

**Critérios de Aceitação**:
- [ ] Tela de login funcional
- [ ] Validação de credenciais
- [ ] Redirect para homepage após login bem-sucedido
- [ ] Mensagem de erro clara em caso de falha

---

### US-02: Visualizar Banners
**Como** membro  
**Eu quero** ver banners promocionais na homepage  
**Para que** eu fique informado sobre novidades e promoções

**Critérios de Aceitação**:
- [ ] Banners carregam corretamente
- [ ] Auto-rotate funciona
- [ ] CTAs são clicáveis e redirecionam corretamente
- [ ] Responsivo em todos os dispositivos

---

### US-03: Acessar SaaS
**Como** membro  
**Eu quero** clicar em um módulo do carrossel  
**Para que** eu seja redirecionado para o SaaS desejado

**Critérios de Aceitação**:
- [ ] Carrossel exibe todos os SaaS disponíveis
- [ ] Click no card redireciona corretamente
- [ ] Acesso sem necessidade de novo login

---

### US-04: Assistir Aula
**Como** membro  
**Eu quero** assistir uma videoaula  
**Para que** eu possa aprender sobre o tópico

**Critérios de Aceitação**:
- [ ] Vídeo carrega e reproduz corretamente
- [ ] Controles funcionam (play, pause, volume, fullscreen)
- [ ] Descrição e anexos são exibidos
- [ ] Timeline de próximas aulas funciona
- [ ] [A CONFIRMAR: Progresso é salvo?]

---

### US-05: Comentar em Aula
**Como** membro  
**Eu quero** deixar um comentário em uma aula  
**Para que** eu possa tirar dúvidas ou compartilhar feedback

**Critérios de Aceitação**:
- [ ] Form de comentário funcional
- [ ] Comentário aparece na lista após submit
- [ ] [A CONFIRMAR: Moderação antes de aparecer?]

---

### US-06: Criar Campanha no Hidra
**Como** membro  
**Eu quero** criar uma campanha de disparo no WhatsApp  
**Para que** eu possa enviar mensagens para meus leads

**Critérios de Aceitação**:
- [ ] Wizard de criação funcional
- [ ] Upload de CSV funciona
- [ ] Validação de números funciona
- [ ] Agendamento funciona corretamente
- [ ] Campanha é criada e inicia conforme configurado

---

### US-07: Baixar Recurso do Cybervault
**Como** membro  
**Eu quero** baixar um recurso da biblioteca  
**Para que** eu possa usar em meus projetos

**Critérios de Aceitação**:
- [ ] Busca e filtros funcionam
- [ ] Click em "Download" inicia o download
- [ ] Arquivo baixado está íntegro
- [ ] [A CONFIRMAR: Download é rastreado?]

---

### US-08: Gerenciar Banners (Admin)
**Como** administrador  
**Eu quero** adicionar/editar banners da homepage  
**Para que** eu possa promover conteúdos e ofertas

**Critérios de Aceitação**:
- [ ] CRUD de banners funcional
- [ ] Upload de imagem funciona
- [ ] Preview antes de salvar
- [ ] Mudanças refletem imediatamente na homepage

---

[MAIS USER STORIES CONFORME NECESSÁRIO]

---

## 9. Casos de Uso

### UC-01: Login no Hub

**Ator**: Membro  
**Pré-condições**: Membro tem conta criada  
**Fluxo Principal**:
1. Membro acessa hub.exemplo.com
2. Insere email e senha
3. Clica em "Entrar"
4. Sistema valida credenciais
5. Sistema gera token JWT
6. Sistema redireciona para homepage do Hub

**Fluxos Alternativos**:
- 4a. Credenciais inválidas → Sistema exibe mensagem de erro
- [A CONFIRMAR: 4b. Conta desativada → Sistema exibe mensagem específica]
- [A CONFIRMAR: 4c. Esqueci minha senha → Link para reset]

---

### UC-02: Assistir Aula Completa

**Ator**: Membro  
**Pré-condições**: Membro está logado e tem acesso ao curso  
**Fluxo Principal**:
1. Membro acessa Academia
2. Seleciona um curso
3. Expande um módulo
4. Clica em uma aula
5. Sistema carrega player de vídeo
6. Membro assiste vídeo
7. [A CONFIRMAR: Sistema marca aula como assistida ao atingir 90%?]
8. Membro pode baixar anexos
9. Membro pode deixar comentário
10. Membro pode avaliar aula

**Fluxos Alternativos**:
- [A CONFIRMAR: 4a. Aula bloqueada (módulo anterior incompleto) → Sistema exibe mensagem]
- 5a. Erro ao carregar vídeo → Sistema exibe mensagem de erro

---

### UC-03: Criar e Executar Campanha no Hidra

**Ator**: Membro  
**Pré-condições**: Membro configurou Evolution API  
**Fluxo Principal**:
1. Membro acessa Hidra
2. Clica em "Nova Campanha"
3. Preenche nome e descrição
4. Escreve mensagem
5. Faz upload de CSV com contatos
6. Sistema valida contatos
7. Configura agendamento (limite diário, horários, etc.)
8. Revisa e confirma
9. Sistema salva campanha
10. Sistema inicia disparos conforme agendamento
11. Membro pode ver progresso em tempo real no dashboard

**Fluxos Alternativos**:
- 6a. CSV inválido → Sistema exibe erros e permite correção
- 6b. Números duplicados → Sistema remove duplicatas automaticamente
- 10a. Erro na Evolution API → Sistema registra erro e tenta novamente
- [A CONFIRMAR: 10b. Limite diário atingido → Sistema pausa e retoma no dia seguinte]

---

[MAIS CASOS DE USO CONFORME NECESSÁRIO]

---

## 10. Escopo MVP vs Futuro

### MVP (Versão 1.0) - CORE FEATURES

**Deve ter** (bloqueantes, sem isso não lança):
- ✅ **Hub Principal**
  - Homepage com banners configuráveis (carrossel)
  - Carrossel de SaaS modules
  - SSO/Login único
  - Sistema de permissões granular
  
- ✅ **Academia**
  - CRUD de cursos, módulos, aulas (admin)
  - Player de vídeo com tracking de progresso
  - Sistema de drip content configurável
  - Comentários com threads (3 níveis) + moderação
  - Avaliações por estrelas (1-5) por aula
  - Download de anexos
  - Barra de progresso visual por curso
  
- ✅ **Hidra (WhatsApp)**
  - Configuração Evolution API
  - CRUD de campanhas
  - Upload CSV de contatos
  - **Upload de mídia** (imagens, vídeos, documentos, áudio)
  - Agendamento (limite diário, horários, dias)
  - Dashboard com métricas
  - Relatórios de campanha
  - Logs de erros
  
- ✅ **Cybervault**
  - Upload de recursos (admin)
  - Organização por categorias
  - Busca e filtros
  - Download tracking básico
  
- ✅ **Painel Admin**
  - Gestão de banners
  - Gestão de membros (criar, editar, permissões)
  - Gestão de cursos/aulas
  - Gestão de categorias Cybervault
  - Moderação de comentários
  - Ver analytics básico

**Pode ter** (nice to have, mas não bloqueante):
- ⚠️ **Certificados de conclusão** → DECISÃO: Incluir no MVP?
- ⚠️ **Envio de mídia no Hidra** → DECISÃO: Incluir no MVP?
- ⚠️ **Auto-play próxima aula** → DECISÃO: Incluir no MVP?
- ⚠️ **Notificações** (email quando comentário é aprovado, nova aula liberada)

### Versão 2.0 (Pós-MVP) - ENHANCEMENTS

**Funcionalidades futuras confirmadas**:
- [ ] **Academia Avançada**
  - Quiz/provas ao final de módulos
  - Certificado digital com QR code
  - Live streaming de aulas ao vivo
  - Fórum/comunidade integrado
  - Sistema de badges/gamificação
  
- [ ] **Hidra Avançado**
  - Templates de mensagem salvos
  - Listas de contatos reutilizáveis
  - Segmentação avançada de audiência
  - A/B testing de mensagens
  - Respostas automáticas (chatbot simples)
  - Integração com CRM externo
  
- [ ] **Cybervault Avançado**
  - Versionamento de arquivos (v1, v2, v3)
  - Preview de arquivos (PDF viewer, image viewer)
  - Limite de downloads por recurso
  - Sistema de favoritos
  - Recomendações de recursos relacionados
  
- [ ] **Hub & Admin**
  - Analytics avançado (Google Analytics style)
  - Relatórios exportáveis (PDF, Excel)
  - Logs de auditoria (quem fez o quê quando)
  - Sistema de notificações in-app
  - Dark mode
  
- [ ] **Novos SaaS**
  - SaaS 3: [A definir]
  - SaaS 4: [A definir]
  
- [ ] **Integrações**
  - Zapier/Make webhooks
  - API pública para desenvolvedores
  - Webhooks para eventos (nova aula, curso concluído, etc)
  
- [ ] **Mobile**
  - PWA otimizado
  - App nativo iOS/Android (futuro distante)

---

## 11. Fora de Escopo (v1.0)

**Explicitamente NÃO incluído no MVP**:
- ❌ Sistema de pagamentos/checkout (Stripe, etc) - membros adicionados manualmente
- ❌ Auto-registro de membros (signup público)
- ❌ Marketplace de terceiros
- ❌ API pública para integrações externas
- ❌ Multi-tenancy / white-label
- ❌ App mobile nativo
- ❌ Integração com redes sociais (Facebook, Instagram, etc)
- ❌ Sistema de afiliados
- ❌ Multi-idioma (apenas português no MVP)
- ❌ Email marketing integrado (foco em WhatsApp)

---

## 12. Perguntas Pendentes / Decisões Necessárias

### Alta Prioridade (bloqueantes para iniciar desenvolvimento)
1. ✅ ~~Nome oficial do produto?~~ → **SiderHub (Blacksider Society)**
2. ✅ ~~Modelo de negócio e público-alvo?~~ → **Membros do fórum, sem planos, acesso via admin**
3. ✅ ~~Membros se auto-registram OU apenas admin cria contas?~~ → **Apenas admin cria**
4. ✅ ~~Níveis de acesso?~~ → **Granular: Super Admin, Admin, Membro (com permissões customizadas)**
5. ✅ ~~Cursos com drip content?~~ → **Configurável por curso (admin escolhe)**
6. ✅ ~~Progresso trackeado?~~ → **Sim**
7. ✅ ~~Comentários?~~ → **Por aula, com threads, moderação admin**
8. ✅ ~~Avaliações?~~ → **Estrelas 1-5, por aula**
9. ✅ ~~Qual video player usar?~~ → **Video.js self-hosted (500MB máx por vídeo)**
10. ✅ ~~Hidra: cada membro tem Evolution API?~~ → **Sim, própria**

### Média Prioridade (importante mas não bloqueante imediato)
11. ❓ **Certificados de conclusão de curso?**
    - MVP: Sim ou deixar para v2?
12. ❓ **Auto-play próxima aula?**
    - Implementar ou não?

### Baixa Prioridade (refinamento futuro)
13. ❓ PWA (Progressive Web App)?
14. ❓ 2FA para admins?
15. ❓ Notificações push?
16. ❓ Versões de recursos no Cybervault? (v1, v2, v3)

---

## 13. Decisões Tomadas (Registro)

| # | Decisão | Rationale | Data |
|---|---------|-----------|------|
| 1 | Multi-schema no Supabase | Organização, manutenção, escalabilidade | 02/11/2025 |
| 2 | Shadcn/ui para componentes | Customizável, acessível, mantido | 02/11/2025 |
| 3 | Next.js 14+ App Router | Server components, performance | 02/11/2025 |
| 4 | Comentários com threads (3 níveis) | Melhor UX para discussões | 02/11/2025 |
| 5 | Drip content configurável | Flexibilidade para diferentes cursos | 02/11/2025 |
| 6 | Evolution API self-hosted por membro | Sem limites centralizados, controle do membro | 02/11/2025 |
| 7 | Video.js self-hosted (500MB máx) | Controle total, sem custos mensais, Supabase CDN | 02/11/2025 |
| 8 | Hidra com envio de mídia (imagem/vídeo/doc/áudio) | Funcionalidade completa, essencial para marketing visual | 02/11/2025 |

---

## 13. Cronograma Estimado

[A COMPLETAR após clarificação do escopo]

**Fases sugeridas**:
1. **Fase 1** (Semanas 1-2): Setup + Autenticação + Homepage básica
2. **Fase 2** (Semanas 3-4): Academia (cursos + player)
3. **Fase 3** (Semanas 5-6): Hidra (disparador WhatsApp)
4. **Fase 4** (Semanas 7): Cybervault
5. **Fase 5** (Semanas 8-9): Painel Admin
6. **Fase 6** (Semana 10): Testes + Ajustes + Deploy

**Total estimado: 10-12 semanas**

---

## 14. Riscos e Mitigações

### Risco 1: Integração com Evolution API
**Impacto**: Alto  
**Probabilidade**: Média  
**Mitigação**: 
- Criar layer de abstração para facilitar troca de provider
- Testes extensivos com API antes de integrar
- Documentação clara de setup para usuários

### Risco 2: Performance com vídeos pesados
**Impacto**: Alto  
**Probabilidade**: Média  
**Mitigação**:
- Usar serviço especializado (Vimeo/Mux) com CDN
- Compressão automática de vídeos
- Adaptive bitrate streaming

### Risco 3: Upload de arquivos grandes no Cybervault
**Impacto**: Médio  
**Probabilidade**: Alta  
**Mitigação**:
- Implementar limit de tamanho
- Upload com progresso e retry
- Validação de tipo de arquivo

[OUTROS RISCOS A CONSIDERAR]

---

## 15. Anexos

### Wireframes
[A COMPLETAR: Link para Figma/protótipo]

### Referências Visuais
- Homepage Netflix: [exemplos]
- Players de vídeo: [exemplos]
- Dashboards: [exemplos]

---

## Aprovações

| Stakeholder | Papel | Data | Assinatura |
|-------------|-------|------|------------|
| [Nome] | Product Owner | [Data] | _______ |
| [Nome] | Tech Lead | [Data] | _______ |
| [Nome] | Designer | [Data] | _______ |

---

**Versão**: 0.1 (Draft)  
**Data**: 2025-11-02  
**Autor**: [Seu Nome]  
**Status**: 🔴 Aguardando clarificações
