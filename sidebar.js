// sidebar.js — StockFlow Pro v9.9.44
// ══════════════════════════════════════════════════════════════════
// Sidebar lateral deslizante estilo GitHub Mobile.
//
// ARQUITETURA:
//   • Overlay escuro (sidebar-overlay) fecha ao tocar fora.
//   • Painel (#sidebar-panel) desliza da esquerda com spring cubic-bezier.
//   • Botão hambúrguer (#btn-sidebar) injetado no .header-container (esquerda).
//   • Swipe-right para abrir (edge zone, igual ao mecanismo da FT).
//   • Swipe-left para fechar (dentro do painel).
//   • Estado persistido em localStorage('sidebarLastSection').
//   • Estrutura extensível: seções declaradas em SIDEBAR_SECTIONS[].
//   • Totalmente compatível com todos os temas (usa CSS custom props).
//   • Zero conflito com swipe.js, swipeFT e navegacao.js.
//
// CORREÇÕES PÓS-AUDITORIA:
//   • _handleSidebarAction: IDs de alertas/calculadora/exportar corrigidos
//     para usar abrirAlertaSheet(), btn-exportar e import() dinâmico.
//   • EDGE_WIDTH removida (era constante declarada e nunca usada; CSS usa 20px).
//   • adx removida de _onTouchEnd (variável declarada e nunca lida).
//   • Bloco morto do passo 10 (appVer nunca usado) removido de iniciarSidebar().
//   • Guard _inicializado adicionado contra double-init.
//
// ADIÇÃO DE NOVOS RECURSOS:
//   Acrescente um objeto em SIDEBAR_SECTIONS (ou um item em seção existente).
//   O render é automático. Nenhuma outra alteração necessária.
// ══════════════════════════════════════════════════════════════════

import { darFeedback } from './utils.js';
import { abrirAlertaSheet } from './alerta.js';

// ─────────────────────────────────────────────────────────────────
// DADOS — declaração das seções e itens da sidebar
// Estrutura extensível: adicione objetos aqui para novos recursos.
// ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} SidebarItem
 * @property {string} id         — Identificador único (usado em eventos)
 * @property {string} label      — Texto exibido
 * @property {string} icon       — SVG path data (viewBox 0 0 24 24)
 * @property {boolean} [active]  — Item marcado como ativo inicialmente
 * @property {string} [badge]    — Texto do badge (ex: "3", "novo")
 * @property {boolean} [soon]    — Exibe chip "Em breve"
 */

/**
 * @typedef {Object} SidebarSection
 * @property {string} id
 * @property {string} [title]    — Cabeçalho da seção (omitido = sem título)
 * @property {SidebarItem[]} items
 */

/** @type {SidebarSection[]} */
const SIDEBAR_SECTIONS = [
    {
        id: 'navegacao',
        items: [
            {
                id: 'inicio',
                label: 'Início',
                active: true,
                icon: 'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z M9 21V12h6v9',
            },
            {
                id: 'alertas',
                label: 'Alertas',
                icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
            },
            {
                id: 'historico',
                label: 'Histórico',
                icon: 'M12 20h9 M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
            },
            {
                id: 'relatorios',
                label: 'Relatórios',
                icon: 'M3 3v18h18 M18.7 8l-5.1 5.2-2.8-2.7L7 14.3',
            },
            {
                id: 'exportar',
                label: 'Exportar',
                icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
            },
        ],
    },
    {
        id: 'ferramentas',
        title: 'Ferramentas',
        items: [
            {
                id: 'calculadora',
                label: 'Calculadora',
                icon: 'M4 4h16v16H4z M8 10h2m2 0h2 M8 14h2m4 0h2 M8 18h8 M8 6h8',
            },
            {
                id: 'categorias',
                label: 'Categorias',
                icon: 'M4 6h16M4 10h16M4 14h10M4 18h6',
            },
            {
                id: 'configuracoes',
                label: 'Configurações',
                icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
            },
        ],
    },
    {
        id: 'em-breve',
        title: 'Em desenvolvimento',
        items: [
            {
                id: 'integracao-fiscal',
                label: 'NF-e / Fiscal',
                soon: true,
                icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
            },
            {
                id: 'fornecedores',
                label: 'Fornecedores',
                soon: true,
                icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
            },
            {
                id: 'multiusuario',
                label: 'Multi-usuário',
                soon: true,
                icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8',
            },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────
const LS_KEY          = 'sidebarLastSection';
const OPEN_CLASS      = 'sidebar-open';
const THRESHOLD_PX    = 80;    // px — deslocamento mínimo para confirmar swipe
const VEL_THRESHOLD   = 0.35;  // px/ms — velocidade mínima (flick)

// ─────────────────────────────────────────────────────────────────
// RENDER HTML DA SIDEBAR
// ─────────────────────────────────────────────────────────────────

/**
 * Gera o ícone SVG a partir do path data.
 */
function _svgIcon(pathData, size = 20) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="${pathData}"/>
    </svg>`;
}

/**
 * Cria o HTML do painel da sidebar a partir de SIDEBAR_SECTIONS.
 */
function _buildSidebarHTML() {
    const sectionsHTML = SIDEBAR_SECTIONS.map(section => {
        const titleHTML = section.title
            ? `<div class="sidebar-section-title">${section.title}</div>`
            : '';

        const itemsHTML = section.items.map(item => {
            const activeClass = item.active ? ' sidebar-item--active' : '';
            const badgeHTML   = item.badge
                ? `<span class="sidebar-item-badge">${item.badge}</span>`
                : '';
            const soonHTML    = item.soon
                ? `<span class="sidebar-item-soon">Em breve</span>`
                : '';
            const disabledAttr = item.soon ? ' aria-disabled="true"' : '';

            return `
            <button class="sidebar-item${activeClass}"
                    data-sidebar-id="${item.id}"
                    ${disabledAttr}
                    type="button">
                <span class="sidebar-item-icon" aria-hidden="true">
                    ${_svgIcon(item.icon)}
                </span>
                <span class="sidebar-item-label">${item.label}</span>
                ${badgeHTML}${soonHTML}
            </button>`;
        }).join('');

        return `
        <div class="sidebar-section" data-section="${section.id}">
            ${titleHTML}
            <div class="sidebar-section-items">
                ${itemsHTML}
            </div>
        </div>`;
    }).join('');

    return `
    <!-- ===== SIDEBAR OVERLAY ===== -->
    <div id="sidebar-overlay" class="sidebar-overlay" aria-hidden="true"></div>

    <!-- ===== SIDEBAR PANEL ===== -->
    <aside id="sidebar-panel" class="sidebar-panel"
           role="navigation" aria-label="Menu lateral"
           aria-hidden="true">

        <!-- Cabeçalho da sidebar -->
        <div class="sidebar-header">
            <div class="sidebar-header-logo" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"
                     class="sidebar-logo-icon" aria-hidden="true">
                    <defs>
                        <linearGradient id="sbLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%"   stop-color="#2979FF"/>
                            <stop offset="100%" stop-color="#00E5FF"/>
                        </linearGradient>
                    </defs>
                    <rect width="120" height="120" rx="26" fill="#0D1B2A"/>
                    <rect x="0.5" y="0.5" width="119" height="119" rx="25.5"
                          fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="1"/>
                    <path d="M 82 28 C 82 28,88 28,88 38 C 88 50,72 52,60 52 C 48 52,32 54,32 66 C 32 78,38 82,50 82 C 58 82,88 82,88 82"
                          fill="none" stroke="url(#sbLogoGrad)" stroke-width="7"
                          stroke-linecap="round"/>
                    <circle cx="88" cy="82" r="5.5" fill="#00E5FF"/>
                    <circle cx="82" cy="28" r="3.5" fill="#2979FF" opacity="0.85"/>
                </svg>
            </div>
            <div class="sidebar-header-info">
                <span class="sidebar-header-name">StockFlow<span class="sidebar-header-pro">PRO</span></span>
                <span class="sidebar-header-version" id="sidebar-version">v9.9.44</span>
            </div>
            <button id="btn-sidebar-close" class="sidebar-close-btn"
                    aria-label="Fechar menu lateral" type="button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
            </button>
        </div>

        <!-- Separador -->
        <div class="sidebar-divider" aria-hidden="true"></div>

        <!-- Conteúdo rolável -->
        <div class="sidebar-scroll" role="list">
            ${sectionsHTML}
        </div>

        <!-- Rodapé -->
        <div class="sidebar-footer">
            <div class="sidebar-footer-text">
                StockFlow Pro · Gestão inteligente de estoque
            </div>
        </div>

    </aside>

    <!-- Edge zone para swipe-right abrir (fora do painel) -->
    <div id="sidebar-swipe-edge" aria-hidden="true"></div>
    `;
}

// ─────────────────────────────────────────────────────────────────
// LÓGICA DE ABERTURA / FECHAMENTO
// ─────────────────────────────────────────────────────────────────

let _isOpen       = false;
let _panel        = null;
let _overlay      = null;
let _btnHamburger = null;

function _abrir() {
    if (_isOpen) return;
    _isOpen = true;
    darFeedback();

    _panel.removeAttribute('aria-hidden');
    _overlay.removeAttribute('aria-hidden');
    _panel.classList.add(OPEN_CLASS);
    _overlay.classList.add(OPEN_CLASS);
    _btnHamburger?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('sidebar-is-open');

    // Foco no primeiro item interativo
    setTimeout(() => _panel.querySelector('.sidebar-item')?.focus(), 340);
}

function _fechar() {
    if (!_isOpen) return;
    _isOpen = false;
    darFeedback();

    _panel.classList.remove(OPEN_CLASS);
    _overlay.classList.remove(OPEN_CLASS);
    _btnHamburger?.setAttribute('aria-expanded', 'false');

    const cleanup = () => {
        _panel.setAttribute('aria-hidden', 'true');
        _overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('sidebar-is-open');
    };
    // Aguarda a transição CSS (320 ms) antes de esconder
    setTimeout(cleanup, 360);
}

function _toggle() {
    _isOpen ? _fechar() : _abrir();
}

// ─────────────────────────────────────────────────────────────────
// SWIPE GESTURES
// ─────────────────────────────────────────────────────────────────

/**
 * Swipe-RIGHT na edge zone (borda esquerda) → abre a sidebar.
 * Swipe-LEFT dentro do painel → fecha a sidebar.
 * Idêntico ao mecanismo usado pela FT (navegacao.js).
 */
function _initSwipe() {
    const edge = document.getElementById('sidebar-swipe-edge');
    if (!edge) return;

    // ── Estado ─────────────────────────────────────────────────
    let _startX = 0, _startY = 0, _lastX = 0, _lastT = 0;
    let _vel = 0, _dragging = false, _locked = false;
    let _gestureActive = false;
    let _gestureTarget = null; // 'edge' | 'panel'

    // ── Helpers de animação live ───────────────────────────────
    function _applyDrag(dx, opening) {
        const clamped = opening
            ? Math.min(Math.max(0, dx), _panel.offsetWidth)
            : Math.min(0, dx);
        _panel.style.transition = 'none';
        _panel.style.transform  = `translateX(calc(-100% + ${opening ? clamped : _panel.offsetWidth + clamped}px))`;
    }

    function _snapBack() {
        _panel.style.transition = '';
        _panel.style.transform  = '';
    }

    // ── touchstart ─────────────────────────────────────────────
    function _onTouchStart(e) {
        const t = e.touches[0];
        _startX = t.clientX;
        _startY = t.clientY;
        _lastX  = _startX;
        _lastT  = performance.now();
        _vel    = 0; _dragging = false; _locked = false;

        // Abertura: toque na edge zone E sidebar fechada
        if (e.currentTarget === edge && !_isOpen) {
            _gestureActive = true;
            _gestureTarget = 'edge';
        }
        // Fechamento: toque dentro do painel E sidebar aberta
        else if (e.currentTarget === _panel && _isOpen) {
            _gestureActive = true;
            _gestureTarget = 'panel';
        } else {
            _gestureActive = false;
        }
    }

    function _onTouchMove(e) {
        if (!_gestureActive || _locked) return;

        const dx = e.touches[0].clientX - _startX;
        const dy = e.touches[0].clientY - _startY;

        if (!_dragging) {
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
            if (Math.abs(dy) >= Math.abs(dx)) { _locked = true; return; }
            // Verifica direção correta
            if (_gestureTarget === 'edge'  && dx < 0) { _locked = true; return; }
            if (_gestureTarget === 'panel' && dx > 0) { _locked = true; return; }
            _dragging = true;
        }

        const now = performance.now();
        const dt  = now - _lastT;
        if (dt > 0) _vel = (e.touches[0].clientX - _lastX) / dt;
        _lastX = e.touches[0].clientX;
        _lastT = now;

        if (e.cancelable) e.preventDefault();
        _applyDrag(dx, _gestureTarget === 'edge');
    }

    function _onTouchEnd(e) {
        if (!_gestureActive) return;
        _gestureActive = false;

        if (!_dragging) { _snapBack(); return; }
        _dragging = false;

        const dx  = e.changedTouches[0].clientX - _startX;

        _snapBack();

        if (_gestureTarget === 'edge') {
            if (dx > THRESHOLD_PX || _vel > VEL_THRESHOLD) _abrir();
        } else {
            if (-dx > THRESHOLD_PX || -_vel > VEL_THRESHOLD) _fechar();
        }
    }

    function _onTouchCancel() {
        _gestureActive = false;
        _dragging = false;
        _snapBack();
    }

    // ── Bind ───────────────────────────────────────────────────
    [edge, _panel].forEach(el => {
        el.addEventListener('touchstart',  _onTouchStart,  { passive: true });
        el.addEventListener('touchmove',   _onTouchMove,   { passive: false });
        el.addEventListener('touchend',    _onTouchEnd,    { passive: true });
        el.addEventListener('touchcancel', _onTouchCancel, { passive: true });
    });
}

// ─────────────────────────────────────────────────────────────────
// BOTÃO HAMBÚRGUER — injetado no hdr-btns (lado esquerdo)
// ─────────────────────────────────────────────────────────────────

function _criarBotaoHamburger() {
    const headerContainer = document.querySelector('.header-container');
    if (!headerContainer) return;

    const btn = document.createElement('button');
    btn.id              = 'btn-sidebar';
    btn.className       = 'btn-sidebar-toggle';
    btn.type            = 'button';
    btn.setAttribute('aria-label',    'Abrir menu lateral');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'sidebar-panel');
    btn.innerHTML = `
        <span class="btn-sidebar-bars" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
        </span>`;

    // Insere como PRIMEIRO filho do header-container (canto esquerdo)
    headerContainer.insertBefore(btn, headerContainer.firstElementChild);
    _btnHamburger = btn;

    btn.addEventListener('click', () => {
        darFeedback();
        _toggle();
    });
}

// ─────────────────────────────────────────────────────────────────
// INTERAÇÃO COM OS ITENS
// ─────────────────────────────────────────────────────────────────

function _initItemListeners() {
    _panel.querySelectorAll('.sidebar-item').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.getAttribute('aria-disabled') === 'true') {
                darFeedback();
                return; // itens "Em breve" não disparam ação
            }

            darFeedback();

            // Marca item como ativo
            _panel.querySelectorAll('.sidebar-item').forEach(b =>
                b.classList.remove('sidebar-item--active'));
            btn.classList.add('sidebar-item--active');

            const id = btn.dataset.sidebarId;
            try { localStorage.setItem(LS_KEY, id); } catch(e) {}

            // Dispara evento customizado (para integração futura de módulos)
            document.dispatchEvent(new CustomEvent('sidebarAction', {
                detail: { id, btn }
            }));

            // Mapeamento para ações existentes do app
            _handleSidebarAction(id);

            // Fecha o painel após a ação
            setTimeout(_fechar, 80);
        });
    });
}

/**
 * Mapeamento de IDs de sidebar para ações existentes no app.
 * Estende sem quebrar: ações desconhecidas são ignoradas silenciosamente.
 */
function _handleSidebarAction(id) {
    switch (id) {
        case 'inicio':
            // Navega para a aba Estoque (aba padrão)
            document.querySelector('.nav-tab[data-tab="estoque"]')?.click();
            break;

        case 'alertas':
            // Abre o bottom sheet de alertas via função exportada de alerta.js
            abrirAlertaSheet();
            break;

        case 'historico':
            // Abre o calendário de histórico existente
            document.getElementById('btn-calendario')?.click();
            break;

        case 'relatorios':
            // Navega para Produção (relatório mais próximo disponível)
            document.querySelector('.nav-tab[data-tab="producao"]')?.click();
            break;

        case 'exportar':
            // Aciona o btn-exportar real do DOM (export.js ouve este elemento)
            document.getElementById('btn-exportar')?.click();
            break;

        case 'calculadora':
            // Abre calculadora no input padrão (novoQtd — campo de adição de item)
            // Garante que a aba "adicionar" está ativa para o campo existir no DOM
            document.querySelector('.nav-tab[data-tab="adicionar"]')?.click();
            setTimeout(() => {
                const input = document.getElementById('novoQtd');
                if (input) {
                    // Importação dinâmica evita acoplamento circular no boot
                    import('./calculadora.js').then(({ abrirCalculadora }) => {
                        abrirCalculadora(input);
                    }).catch(() => {});
                }
            }, 120); // aguarda a aba renderizar
            break;

        case 'categorias':
            // Navega para a aba adicionar (onde categorias são gerenciadas)
            document.querySelector('.nav-tab[data-tab="adicionar"]')?.click();
            break;

        case 'configuracoes':
            // Cicla tema — ação de configuração disponível
            document.getElementById('btn-tema')?.click();
            break;

        // 'integracao-fiscal' | 'fornecedores' | 'multiusuario' → soon, ignorados
        default:
            break;
    }
}

// ─────────────────────────────────────────────────────────────────
// INICIALIZAÇÃO PRINCIPAL
// ─────────────────────────────────────────────────────────────────

let _inicializado = false;

export function iniciarSidebar() {
    // Guard contra double-init (hot-reload, chamada dupla acidental)
    if (_inicializado) {
        console.warn('[sidebar] iniciarSidebar() chamada mais de uma vez — ignorado.');
        return;
    }
    _inicializado = true;

    // 1. Injeta o HTML da sidebar no body
    const wrapper = document.createElement('div');
    wrapper.innerHTML = _buildSidebarHTML();
    document.body.appendChild(wrapper);

    // 2. Resolve referências
    _panel   = document.getElementById('sidebar-panel');
    _overlay = document.getElementById('sidebar-overlay');

    if (!_panel || !_overlay) {
        console.warn('[sidebar] Elementos não encontrados após injeção.');
        return;
    }

    // 3. Cria o botão hambúrguer no header
    _criarBotaoHamburger();

    // 4. Listeners do overlay (fechar ao clicar fora)
    _overlay.addEventListener('click', _fechar);

    // 5. Botão de fechar dentro da sidebar
    document.getElementById('btn-sidebar-close')
        ?.addEventListener('click', () => { darFeedback(); _fechar(); });

    // 6. Tecla Escape fecha a sidebar
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && _isOpen) _fechar();
    });

    // 7. Listeners dos itens
    _initItemListeners();

    // 8. Swipe gestures
    _initSwipe();

    // 9. Restaura item ativo do localStorage
    try {
        const lastId = localStorage.getItem(LS_KEY);
        if (lastId) {
            const btn = _panel.querySelector(`[data-sidebar-id="${lastId}"]`);
            if (btn && btn.getAttribute('aria-disabled') !== 'true') {
                _panel.querySelectorAll('.sidebar-item')
                    .forEach(b => b.classList.remove('sidebar-item--active'));
                btn.classList.add('sidebar-item--active');
            }
        }
    } catch(e) {}
}

/**
 * API pública — atualiza a versão exibida na sidebar.
 * Chamado opcionalmente por main.js após import.
 */
export function sidebarSetVersion(version) {
    const el = document.getElementById('sidebar-version');
    if (el) el.textContent = version;
}

/** API pública — abre a sidebar programaticamente. */
export { _abrir as abrirSidebar, _fechar as fecharSidebar };
