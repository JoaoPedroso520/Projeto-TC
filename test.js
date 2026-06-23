
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
        const API_URL = isLocal ? 'http://localhost:5000/api' : 'https://c7-noticias-backend.onrender.com/api';
        const anunciosIntervalos = {};
        const CACHE_TTL_MS = 5 * 60 * 1000;
        const NOTICIAS_CACHE_PREFIX = 'c7-noticias-cache:';
        const CATEGORIAS_CACHE_KEY = 'c7-categorias-cache';
        const ANUNCIOS_CACHE_KEY = 'c7-anuncios-cache';
        const noticiasResumoCache = new Map();
        const noticiasDetalheCache = new Map();
        const imagensModalPreload = new Set();

        function getStorage() {
            try {
                const testKey = '__c7_cache_test__';
                localStorage.setItem(testKey, '1');
                localStorage.removeItem(testKey);
                return localStorage;
            } catch (e) {
                return sessionStorage;
            }
        }

        function getCache(key) {
            try {
                const raw = getStorage().getItem(key);
                if (!raw) return null;
                const cached = JSON.parse(raw);
                if (!cached || Date.now() - cached.time > CACHE_TTL_MS) return null;
                return cached.data;
            } catch (e) {
                return null;
            }
        }

        function getStaleCache(key) {
            try {
                const raw = getStorage().getItem(key);
                if (!raw) return null;
                const cached = JSON.parse(raw);
                return cached && cached.data ? cached.data : null;
            } catch (e) {
                return null;
            }
        }

        function setCache(key, data) {
            try {
                getStorage().setItem(key, JSON.stringify({ time: Date.now(), data }));
            } catch (e) {
                console.warn('Cache local indisponível:', e);
            }
        }

        function carregarImagemFallback(img, fallback) {
            if (!img || img.dataset.fallbackApplied === 'true') return;
            img.dataset.fallbackApplied = 'true';
            img.src = fallback || 'img/Logo.png';
        }

        function extrairGoogleDriveId(url) {
            const texto = String(url || '');
            const formatos = [
                /drive\.google\.com\/file\/d\/([^/?#]+)/i,
                /drive\.google\.com\/open\?id=([^&#]+)/i,
                /drive\.google\.com\/uc\?[^#]*id=([^&#]+)/i,
                /docs\.google\.com\/uc\?[^#]*id=([^&#]+)/i
            ];
            for (const formato of formatos) {
                const match = texto.match(formato);
                if (match && match[1]) return match[1];
            }
            return '';
        }

        function otimizarImagem(url, largura = 600, qualidade = 65) {
            const original = String(url || '').trim();
            if (!original || original.startsWith('data:') || original.startsWith('blob:') || original.startsWith('img/')) {
                return original || 'img/Logo.png';
            }

            if (original.includes('/api/imagens/')) {
                try {
                    const url = new URL(original, window.location.href);
                    url.searchParams.set('w', String(largura));
                    url.searchParams.set('q', String(qualidade));
                    return url.toString();
                } catch (e) {
                    return original;
                }
            }

            const driveId = extrairGoogleDriveId(original);
            if (driveId) {
                return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w${largura}`;
            }

            if (/googleusercontent\.com/i.test(original)) {
                return original.replace(/=s\d+(-[a-z])?$/i, `=s${largura}`).replace(/=w\d+(-h\d+)?(-[a-z])?$/i, `=w${largura}`);
            }

            if (!/^https?:\/\//i.test(original)) return original;

            const urlSemProtocolo = original.replace(/^https?:\/\//i, '');
            return `https://images.weserv.nl/?url=${encodeURIComponent(urlSemProtocolo)}&w=${largura}&q=${qualidade}&output=webp`;
        }

        function imagemResponsiva(url, larguraPequena, larguraGrande, qualidade = 65) {
            return `src="${otimizarImagem(url, larguraPequena, qualidade)}" srcset="${otimizarImagem(url, larguraPequena, qualidade)} ${larguraPequena}w, ${otimizarImagem(url, larguraGrande, qualidade)} ${larguraGrande}w"`;
        }

        function limparRotacao(containerId) {
            if (anunciosIntervalos[containerId]) {
                clearInterval(anunciosIntervalos[containerId]);
                delete anunciosIntervalos[containerId];
            }
        }

        function renderAnuncio(containerId, anuncio, placeholder) {
            const container = document.getElementById(containerId);
            if (!container) return;
            if (!anuncio) {
                container.innerHTML = '';
                return;
            }
            const imagem = imagemResponsiva(anuncio.foto, 480, 1200, 62);
            const prioridade = containerId === 'banner-topo';
            container.innerHTML = `
                <a href="${anuncio.link}" target="_blank" rel="noopener noreferrer" onclick="registrarClique('${anuncio._id}')">
                    <img ${imagem} sizes="(max-width: 768px) 100vw, 1200px" alt="${anuncio.titulo}" width="1200" height="200" ${prioridade ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low"'} decoding="async" onerror="carregarImagemFallback(this, '${placeholder}')">
                </a>
            `;
        }

        function getCyclicSlice(list, start, count) {
            if (!list || list.length === 0) return [];
            const result = [];
            for (let i = 0; i < count; i++) {
                result.push(list[(start + i) % list.length]);
            }
            return result;
        }

        function renderLateral(containerId, anuncios, startIndex = 0) {
            const container = document.getElementById(containerId);
            if (!container) return;
            const visible = getCyclicSlice(anuncios, startIndex, Math.min(3, anuncios.length));
            container.innerHTML = visible.map(a => `
                <a href="${a.link}" target="_blank" rel="noopener noreferrer" onclick="registrarClique('${a._id}')">
                    <img ${imagemResponsiva(a.foto, 240, 480, 62)} sizes="240px" alt="${a.titulo}" width="300" height="400" loading="lazy" decoding="async" onerror="carregarImagemFallback(this, 'img/Logo.png')">
                </a>
            `).join('');
        }

        function getTempoRotacaoMs(anuncios) {
            if (!anuncios || anuncios.length === 0) return null;
            const comTempo = anuncios.find(a => Number(a.tempoRotacaoSeg) > 0);
            if (!comTempo) return null;
            return Number(comTempo.tempoRotacaoSeg) * 1000;
        }

        function iniciarRotacaoSimples(containerId, anuncios, placeholder) {
            limparRotacao(containerId);
            if (!anuncios || anuncios.length === 0) {
                return;
            }
            let index = 0;
            renderAnuncio(containerId, anuncios[index], placeholder);
            const tempoMs = getTempoRotacaoMs(anuncios);
            if (!tempoMs || anuncios.length <= 1) return;
            anunciosIntervalos[containerId] = setInterval(() => {
                index = (index + 1) % anuncios.length;
                renderAnuncio(containerId, anuncios[index], placeholder);
            }, tempoMs);
        }

        function iniciarRotacaoLateral(containerId, anuncios) {
            limparRotacao(containerId);
            if (!anuncios || anuncios.length === 0) {
                return;
            }
            let index = 0;
            renderLateral(containerId, anuncios, index);
            const tempoMs = getTempoRotacaoMs(anuncios);
            if (!tempoMs || anuncios.length <= 3) return;
            anunciosIntervalos[containerId] = setInterval(() => {
                index = (index + 1) % anuncios.length;
                renderLateral(containerId, anuncios, index);
            }, tempoMs);
        }

        async function carregarTodas() {
            console.log('Carregando todas as notícias...');
            const cacheKey = `${NOTICIAS_CACHE_PREFIX}todas`;
            const noticiasCache = getCache(cacheKey) || getStaleCache(cacheKey);
            let exibiuCache = false;
            if (noticiasCache) {
                setFiltroAtivo('');
                exibir(noticiasCache);
                exibiuCache = true;
            }

            try {
                setFiltroAtivo('');
                const res = await fetch(`${API_URL}/noticias`, { cache: 'default' });
                console.log('Response status:', res.status);

                if (!res.ok) {
                    throw new Error(`HTTP erro! status: ${res.status}`);
                }

                const noticias = await res.json();
                setCache(cacheKey, noticias);
                console.log('Notícias recebidas:', noticias.length);
                exibir(noticias);
            } catch (e) {
                console.warn('Erro ao carregar:', e);
                if (!exibiuCache) {
                    document.getElementById('noticias-container').classList.remove('is-loading');
                    document.getElementById('noticias-container').innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: red;"><i class="fas fa-exclamation-triangle"></i> Erro ao conectar com o servidor<br><small>Tente novamente em instantes.</small></p>';
                }
            }
        }

        async function carregarPorCategoria(cat) {
            console.log('Carregando categoria:', cat);
            const cacheKey = `${NOTICIAS_CACHE_PREFIX}categoria:${cat}`;
            const noticiasCache = getCache(cacheKey) || getStaleCache(cacheKey);
            let exibiuCache = false;
            if (noticiasCache) {
                setFiltroAtivo(cat);
                exibir(noticiasCache);
                exibiuCache = true;
            }

            try {
                setFiltroAtivo(cat);
                const url = `${API_URL}/noticias/categoria/${encodeURIComponent(cat)}`;
                console.log('URL:', url);
                const res = await fetch(url);
                console.log('Response status:', res.status);

                if (!res.ok) {
                    const erro = await res.text();
                    console.warn('Erro do servidor:', erro);
                    throw new Error(`HTTP erro! status: ${res.status}`);
                }
                const noticias = await res.json();
                setCache(cacheKey, noticias);
                console.log('Notícias da categoria:', noticias.length);
                exibir(noticias);
            } catch (e) {
                console.warn('Erro ao carregar categoria:', e);
                if (!exibiuCache) {
                    document.getElementById('noticias-container').classList.remove('is-loading');
                    document.getElementById('noticias-container').innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ff6b6b;"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar categoria<br><small>Verifique o console (F12)</small></p>';
                }
            }
        }

        const LIMITE_DESTAQUE = 6;

        function renderNoticias(noticias, containerId, vazioMensagem) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.classList.remove('is-loading');

            if (!noticias || noticias.length === 0) {
                if (vazioMensagem !== undefined) {
                    container.innerHTML = vazioMensagem;
                } else {
                    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;"><i class="fas fa-search"></i> Nenhuma notícia encontrada</p>';
                }
                return;
            }

            container.innerHTML = noticias.map((n, index) => {
                const prioridade = containerId === 'noticias-container' && index < 2;
                noticiasResumoCache.set(String(n._id), n);
                return `
                <div class="noticia-card" data-id="${n._id}" role="button" tabindex="0" aria-label="${n.titulo}" onclick="abrirNoticia('${n._id}')" onmouseenter="prepararNoticia('${n._id}')" onfocus="prepararNoticia('${n._id}')" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); abrirNoticia('${n._id}'); }">
                    <div class="noticia-imagem">
                        <img ${imagemResponsiva(n.foto, 360, 800, 58)} sizes="(max-width: 768px) 100vw, 300px" alt="${n.titulo}" width="300" height="200" ${prioridade ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low"'} decoding="async" onerror="carregarImagemFallback(this, 'img/Logo.png')">
                    </div>
                    <div class="noticia-info">
                        <span class="noticia-categoria">${n.categoria}</span>
                        <div class="noticia-titulo">${n.titulo}</div>
                        <div class="noticia-data">
                            <i class="fas fa-eye"></i>
                            <span class="noticia-views" data-id="${n._id}">${n.views} visualizações</span>
                        </div>
                    </div>
                </div>
            `}).join('');
        }

        function exibir(noticias) {
            const lista = Array.isArray(noticias) ? noticias : [];
            const primeiras = lista.slice(0, LIMITE_DESTAQUE);

            const mensagemVazia = '<p style="grid-column: 1/-1; text-align: center;"><i class="fas fa-search"></i> Nenhuma notícia encontrada</p>';

            renderNoticias(primeiras, 'noticias-container', mensagemVazia);

            const todasSection = document.getElementById('todas-section');
            if (todasSection) todasSection.style.display = '';
            renderNoticias(lista, 'todas-noticias-container', mensagemVazia);

            const agendar = window.requestIdleCallback || ((callback) => setTimeout(callback, 700));
            agendar(() => primeiras.slice(0, 3).forEach(noticia => prepararNoticia(noticia._id)));
        }

        function preCarregarImagemModal(foto) {
            const src = otimizarImagem(foto, 800, 68);
            if (!src || imagensModalPreload.has(src)) return;
            imagensModalPreload.add(src);
            const img = new Image();
            img.decoding = 'async';
            img.src = src;
        }

        async function buscarNoticiaDetalhe(id, contarView = false) {
            const chave = String(id);
            if (!contarView && noticiasDetalheCache.has(chave)) return noticiasDetalheCache.get(chave);

            const url = `${API_URL}/noticias/${encodeURIComponent(chave)}${contarView ? '' : '?preview=1'}`;
            const promessa = fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP erro! status: ${res.status}`);
                    return res.json();
                })
                .then(noticia => {
                    noticiasDetalheCache.set(chave, noticia);
                    return noticia;
                })
                .catch(erro => {
                    if (!contarView) noticiasDetalheCache.delete(chave);
                    throw erro;
                });

            if (!contarView) noticiasDetalheCache.set(chave, promessa);
            return promessa;
        }

        function prepararNoticia(id) {
            const resumo = noticiasResumoCache.get(String(id));
            if (resumo && resumo.foto) preCarregarImagemModal(resumo.foto);
            buscarNoticiaDetalhe(id, false).catch(() => {});
        }

        async function abrirNoticia(id) {
            try {
                const resumo = noticiasResumoCache.get(String(id));
                if (resumo) preCarregarImagemModal(resumo.foto);
                const temDetalhe = noticiasDetalheCache.has(String(id));
                if (resumo && !temDetalhe) {
                    abrirModal({
                        ...resumo,
                        conteudo: '<p style="color:#b8c0c8;">Carregando...</p>',
                    });
                }
                const noticia = await buscarNoticiaDetalhe(id, false);
                atualizarViewsNoCard(id, noticia.views || 0);
                abrirModal(noticia);
                buscarNoticiaDetalhe(id, true)
                    .then(noticiaAtualizada => {
                        noticiasDetalheCache.set(String(id), noticiaAtualizada);
                        atualizarViewsNoCard(id, noticiaAtualizada.views || 0);
                    })
                    .catch(() => {});
            } catch (e) {
                console.warn('Erro ao abrir notícia:', e);
            }
        }

        function atualizarViewsNoCard(id, views) {
            document.querySelectorAll(`.noticia-views[data-id="${id}"]`).forEach(span => {
                span.textContent = `${views} visualizações`;
            });
        }

        function abrirModal(noticia) {
            const titulo = noticia.titulo || 'Notícia';
            const conteudo = noticia.conteudo || '';
            const foto = noticia.foto || 'img/Logo.png';
            const cat = noticia.categoria || 'Geral';
            const autor = noticia.autor || 'Administrador';
            const views = noticia.views || 0;
            const data = noticia.createdAt ? new Date(noticia.createdAt) : null;
            const dataFormatada = data ? data.toLocaleDateString('pt-BR') : '';

            document.getElementById('modal-body').innerHTML = `
                <img ${imagemResponsiva(foto, 800, 1200, 68)} sizes="(max-width: 768px) 100vw, 800px" alt="${titulo}" width="800" height="400" loading="eager" decoding="async" onerror="carregarImagemFallback(this, 'img/Logo.png')">
                <h2>${titulo}</h2>
                <div class="meta">
                    <span><i class="fas fa-folder"></i> ${cat}</span>
                    <span><i class="fas fa-calendar"></i> ${dataFormatada}</span>
                    <span><i class="fas fa-user"></i> ${autor}</span>
                    <span><i class="fas fa-eye"></i> ${views} views</span>
                </div>
                <div class="modal-conteudo">${conteudo}</div>
            `;
            document.getElementById('modal').classList.add('active');
            document.body.classList.add('modal-open');
        }

        function fecharModal() {
            document.getElementById('modal').classList.remove('active');
            document.body.classList.remove('modal-open');
        }

        async function carregarAnuncios() {
            console.log('Carregando anúncios...');
            const anunciosCache = getCache(ANUNCIOS_CACHE_KEY) || getStaleCache(ANUNCIOS_CACHE_KEY);
            if (anunciosCache) {
                renderizarAnuncios(anunciosCache);
            }

            try {
                const res = await fetch(`${API_URL}/anuncios`, { cache: 'default' });
                if (!res.ok) throw new Error('Erro ao carregar anúncios');

                const anuncios = await res.json();
                setCache(ANUNCIOS_CACHE_KEY, anuncios);
                console.log('Anúncios carregados:', anuncios.length);
                renderizarAnuncios(anuncios);
            } catch (e) {
                console.warn('Erro ao carregar anúncios:', e);
            }
        }

        function renderizarAnuncios(anuncios) {
            const lista = Array.isArray(anuncios) ? anuncios : [];
            const anunciosTopo = lista.filter(a => a.posicao === 'topo' && a.ativo);
            const anunciosMeio = lista.filter(a => a.posicao === 'meio' && a.ativo);
            const anunciosLateral = lista.filter(a => a.posicao === 'lateral' && a.ativo);
            const anunciosRodape = lista.filter(a => a.posicao === 'rodape' && a.ativo);

            iniciarRotacaoSimples('banner-topo', anunciosTopo, 'img/Logo.png');
            iniciarRotacaoSimples('banner-meio', anunciosMeio, 'img/Logo.png');
            iniciarRotacaoLateral('banners-lateral', anunciosLateral);
            iniciarRotacaoSimples('banner-rodape', anunciosRodape, 'img/Logo.png');
        }

        async function registrarClique(anuncioId) {
            try {
                await fetch(`${API_URL}/anuncios/${anuncioId}/clique`, { method: 'POST' });
                console.log('Clique registrado');
            } catch (e) {
                console.warn('Erro ao registrar clique:', e);
            }
        }

        function travarBounceSafari() {
            let touchStartY = 0;

            window.addEventListener('touchstart', (event) => {
                if (event.touches.length !== 1) return;
                touchStartY = event.touches[0].clientY;
            }, { passive: true });

            window.addEventListener('touchmove', (event) => {
                if (event.touches.length !== 1 || document.body.classList.contains('modal-open')) return;

                const touchY = event.touches[0].clientY;
                const puxandoParaBaixo = touchY > touchStartY;
                const puxandoParaCima = touchY < touchStartY;
                const topo = window.scrollY <= 0;
                const fim = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight;

                if ((topo && puxandoParaBaixo) || (fim && puxandoParaCima)) {
                    event.preventDefault();
                }
            }, { passive: false });
        }

        let categoriasCache = [];

        function normalizarTexto(value) {
            return String(value || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        function getCategoriaIcon(nome) {
            const n = normalizarTexto(nome);
            if (n.includes('polit')) return 'fa-landmark';
            if (n.includes('econ') || n.includes('negoc')) return 'fa-chart-line';
            if (n.includes('esport')) return 'fa-futbol';
            if (n.includes('tec') || n.includes('tech')) return 'fa-microchip';
            if (n.includes('cultur')) return 'fa-palette';
            if (n.includes('regi') || n.includes('regional')) return 'fa-map';
            if (n.includes('acident')) return 'fa-car-burst';
            if (n.includes('saud')) return 'fa-heartbeat';
            if (n.includes('entreten')) return 'fa-masks-theater';
            if (n.includes('geral')) return 'fa-newspaper';
            return 'fa-tag';
        }

        function renderCategoriasNav(lista) {
            const container = document.getElementById('menu-categorias');
            if (!container) return;
            container.innerHTML = '';

            lista.forEach((categoria) => {
                const btn = document.createElement('button');
                btn.className = 'menu-link menu-categoria';
                btn.dataset.categoria = categoria;
                btn.innerHTML = `<i class="fas ${getCategoriaIcon(categoria)}"></i> ${categoria}`;
                btn.addEventListener('click', () => {
                    carregarPorCategoria(categoria);
                    fecharMenuMobile();
                });
                container.appendChild(btn);
            });
        }

        function renderCategoriasFiltros(lista) {
            const container = document.getElementById('filtrosNoticias');
            if (!container) return;
            container.innerHTML = '';

            const botaoTodas = document.createElement('button');
            botaoTodas.className = 'filtro-btn active';
            botaoTodas.dataset.categoria = '';
            botaoTodas.textContent = 'Todas';
            botaoTodas.addEventListener('click', () => carregarTodas());
            container.appendChild(botaoTodas);

            lista.forEach((categoria) => {
                const btn = document.createElement('button');
                btn.className = 'filtro-btn';
                btn.dataset.categoria = categoria;
                btn.textContent = categoria;
                btn.addEventListener('click', () => carregarPorCategoria(categoria));
                container.appendChild(btn);
            });
        }

        async function carregarCategoriasPublicas() {
            const categoriasSalvas = getCache(CATEGORIAS_CACHE_KEY);
            if (categoriasSalvas) {
                categoriasCache = categoriasSalvas;
                renderCategoriasNav(categoriasCache);
                renderCategoriasFiltros(categoriasCache);
            }

            try {
                const res = await fetch(`${API_URL}/categorias?ativas=true`);
                const data = await res.json();
                categoriasCache = (data || []).map(c => c.nome || c);
                setCache(CATEGORIAS_CACHE_KEY, categoriasCache);
                renderCategoriasNav(categoriasCache);
                renderCategoriasFiltros(categoriasCache);
            } catch (e) {
                console.warn('Erro ao carregar categorias:', e);
            }
        }

        function setFiltroAtivo(categoria) {
            const alvo = normalizarTexto(categoria || '');

            const botoes = document.querySelectorAll('#filtrosNoticias .filtro-btn');
            botoes.forEach(btn => {
                const cat = normalizarTexto(btn.dataset.categoria || '');
                btn.classList.toggle('active', cat === alvo);
            });

            const navBtns = document.querySelectorAll('#menu-categorias .menu-categoria');
            navBtns.forEach(btn => {
                const cat = normalizarTexto(btn.dataset.categoria || '');
                btn.classList.toggle('active', cat === alvo);
            });
        }

        function toggleMenuMobile() {
            const menu = document.getElementById('menuPrincipal');
            if (!menu) return;
            menu.classList.toggle('menu-aberto');
        }

        function fecharMenuMobile() {
            const menu = document.getElementById('menuPrincipal');
            if (!menu) return;
            menu.classList.remove('menu-aberto');
        }

        function atualizarBotaoLimparBusca() {
            const input = document.getElementById('buscaInput');
            const botao = document.getElementById('buscaLimparBtn');
            if (!input || !botao) return;
            botao.classList.toggle('visivel', Boolean(input.value.trim()));
        }

        function limparBusca() {
            const input = document.getElementById('buscaInput');
            if (!input) return;
            input.value = '';
            atualizarBotaoLimparBusca();
            input.focus();
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                fecharModal();
                fecharMenuMobile();
            }
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                fecharMenuMobile();
            }
        });
        const modalOverlay = document.getElementById('modal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) fecharModal();
            });
        }

        // BUSCA
        async function fazerBusca() {
            const termo = document.getElementById('buscaInput').value.trim();
            if (!termo) {
                carregarTodas();
                return;
            }

            const cacheKey = `${NOTICIAS_CACHE_PREFIX}busca:${termo}`;
            const noticiasCache = getCache(cacheKey);
            if (noticiasCache) {
                setFiltroAtivo('');
                exibir(noticiasCache);
            }

            try {
                setFiltroAtivo('');
                const res = await fetch(`${API_URL}/utils/busca/${encodeURIComponent(termo)}`);
                const noticias = await res.json();
                setCache(cacheKey, noticias);
                exibir(noticias);
                document.getElementById('buscaInput').value = '';
                atualizarBotaoLimparBusca();
                fecharMenuMobile();
            } catch (e) {
                console.warn('Erro na busca:', e);
            }
        }

        // CLIMA (Open-Meteo sem API key)
        async function carregarClima() {
            const cidades = [
                { nome: 'Jardim Alegre', lat: -24.4662, lon: -54.6204 },
                { nome: 'Ivaiporã', lat: -24.2878, lon: -51.0355 },
                { nome: 'São João do Ivaí', lat: -23.7230, lon: -51.5460 },
            ];

            const weatherCodes = {
                0: { texto: 'Céu Limpo', icon: 'fas fa-sun' },
                1: { texto: 'Poucas nuvens', icon: 'fas fa-cloud-sun' },
                2: { texto: 'Parcialmente Nublado', icon: 'fas fa-cloud-sun' },
                3: { texto: 'Nublado', icon: 'fas fa-cloud' },
                45: { texto: 'Nevoeiro', icon: 'fas fa-smog' },
                48: { texto: 'Nevoeiro Gelado', icon: 'fas fa-smog' },
                51: { texto: 'Chuvisco', icon: 'fas fa-cloud-rain' },
                53: { texto: 'Chuvisco Moderado', icon: 'fas fa-cloud-rain' },
                55: { texto: 'Chuvisco Forte', icon: 'fas fa-cloud-showers-heavy' },
                61: { texto: 'Chuva', icon: 'fas fa-cloud-showers-heavy' },
                63: { texto: 'Chuva Moderada', icon: 'fas fa-cloud-showers-heavy' },
                65: { texto: 'Chuva Forte', icon: 'fas fa-cloud-showers-heavy' },
                71: { texto: 'Neve', icon: 'fas fa-snowflake' },
                73: { texto: 'Neve Moderada', icon: 'fas fa-snowflake' },
                75: { texto: 'Neve Forte', icon: 'fas fa-snowflake' },
                77: { texto: 'Granizo', icon: 'fas fa-icicles' },
                80: { texto: 'Pancadas de Chuva', icon: 'fas fa-cloud-rain' },
                81: { texto: 'Pancadas de Chuva', icon: 'fas fa-cloud-showers-heavy' },
                82: { texto: 'Pancadas Fortes', icon: 'fas fa-cloud-showers-heavy' },
                95: { texto: 'Tempestade', icon: 'fas fa-bolt' },
                96: { texto: 'Tempestade com granizo', icon: 'fas fa-bolt' },
                99: { texto: 'Tempestade severa', icon: 'fas fa-bolt' },
            };

            const cards = [];

            for (const cidade of cidades) {
                try {
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${cidade.lat}&longitude=${cidade.lon}&current_weather=true&timezone=auto`);
                    if (!res.ok) throw new Error(`Erro ${res.status}`);
                    const data = await res.json();
                    const current = data.current_weather;

                    const meta = weatherCodes[current.weathercode] || { texto: 'Desconhecido', icon: 'fas fa-question' };

                    cards.push(`
                        <div class="clima-card">
                            <h4>${cidade.nome}</h4>
                            <i class="clima-icon ${meta.icon}"></i>
                            <div class="clima-temp">${Math.round(current.temperature)}°C</div>
                            <div class="clima-desc">${meta.texto}</div>
                            <div class="clima-wind"><i class="fas fa-wind"></i> ${current.windspeed} km/h</div>
                        </div>
                    `);
                } catch (err) {
                    console.warn(`Erro ao carregar clima de ${cidade.nome}:`, err);
                    cards.push(`<div class="clima-card"><h4>${cidade.nome}</h4><div class="clima-error">Não foi possível obter o clima.</div></div>`);
                }
            }

            document.getElementById('climaCards').innerHTML = cards.join('');
            document.getElementById('climaWidget').style.display = 'block';
        }

        // MEGA SENA
        const MEGA_API_CANDIDATOS = [
            'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena',
            'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/2991',
            'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/2990'
        ];

        const MEGA_FALLBACK = {
            numero: '???',
            dataApuracao: 'N/A',
            listaDezenas: ['03', '12', '25', '36', '40', '57'],
            valorEstimadoProximoConcurso: 10000000.00,
            dataProximoConcurso: 'N/A',
            listaRateioPremio: [
                { descricaoFaixa: '6 acertos', numeroDeGanhadores: 0, valorPremio: 0 },
                { descricaoFaixa: '5 acertos', numeroDeGanhadores: 0, valorPremio: 0 },
                { descricaoFaixa: '4 acertos', numeroDeGanhadores: 0, valorPremio: 0 }
            ]
        };

        function formatFaixaMega(descricao) {
            const texto = String(descricao || '').toLowerCase();
            if (texto.includes('6')) return '6 acertos (Sena)';
            if (texto.includes('5')) return '5 acertos (Quina)';
            if (texto.includes('4')) return '4 acertos (Quadra)';
            return descricao || '';
        }

        function formatGanhadores(qtd) {
            const n = Number(qtd || 0);
            return `${n} ganhador${n === 1 ? '' : 'es'}`;
        }

        function exibirMegaSena(data, isFallback = false) {
            const megaMeta = document.getElementById('megaMeta');
            const megaNumbers = document.getElementById('megaNumbers');
            const megaError = document.getElementById('megaError');

            const numConcurso = data.numero || data.id || data.concurso || '???';
            const dataApuracao = data.dataApuracao || data.data_apuracao || 'N/A';
            const valorProximo = data.valorEstimadoProximoConcurso || data.valor_acumulado || 0;
            const dataProximo = data.dataProximoConcurso || data.data_proximo_concurso || 'N/A';
            const lista = data.listaDezenas || data.dezenas || data.listaDezenas && data.listaDezenas || data.dezenasSorteadasOrdemSorteio || [];

            megaMeta.innerHTML = `Concurso <strong>#${numConcurso}</strong> &middot; ${dataApuracao}`;
            megaNumbers.innerHTML = (lista || []).map(num => `<div class="mega-ball">${String(num).padStart(2, '0')}</div>`).join('');

            document.getElementById('megaHistory').innerHTML = '';

            const rateio = data.listaRateioPremio || data.lista_rateio_premio || [];

            const criarCardRateio = (titulo, ganhadores, valor) => `
                <div class="mega-prize-card">
                    <div class="mega-prize-title">${formatFaixaMega(titulo)}</div>
                    <div class="mega-prize-value">R$ ${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div class="mega-prize-winners">${formatGanhadores(ganhadores)}</div>
                </div>
            `;

            const premio6 = rateio.find(r => /6 acertos/i.test(r.descricaoFaixa || r.descricao_faixa || '')) || { descricaoFaixa: '6 acertos', numeroDeGanhadores: 0, valorPremio: 0 };
            const premio5 = rateio.find(r => /5 acertos/i.test(r.descricaoFaixa || r.descricao_faixa || '')) || { descricaoFaixa: '5 acertos', numeroDeGanhadores: 0, valorPremio: 0 };
            const premio4 = rateio.find(r => /4 acertos/i.test(r.descricaoFaixa || r.descricao_faixa || '')) || { descricaoFaixa: '4 acertos', numeroDeGanhadores: 0, valorPremio: 0 };

            const cards = `
                <div class="mega-prize-grid">
                    ${criarCardRateio(premio6.descricaoFaixa || premio6.descricao_faixa, premio6.numeroDeGanhadores || premio6.numero_de_ganhadores, premio6.valorPremio || premio6.valor_premio)}
                    ${criarCardRateio(premio5.descricaoFaixa || premio5.descricao_faixa, premio5.numeroDeGanhadores || premio5.numero_de_ganhadores, premio5.valorPremio || premio5.valor_premio)}
                    ${criarCardRateio(premio4.descricaoFaixa || premio4.descricao_faixa, premio4.numeroDeGanhadores || premio4.numero_de_ganhadores, premio4.valorPremio || premio4.valor_premio)}
                </div>
                <div class="mega-next-container">
                    <div class="mega-next-title">Próximo Concurso</div>
                    <div class="mega-next-amount">R$ ${Number(valorProximo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div class="mega-next-date">${dataProximo}</div>
                </div>
            `;

            document.getElementById('megaRateio').innerHTML = cards;
            document.getElementById('megaProximo').innerHTML = '';

            megaError.textContent = isFallback ? 'Dados de fallback (offline) exibidos.' : '';
            document.getElementById('megaWidget').style.display = 'block';
        }

        async function carregarMegaSena() {
            const megaError = document.getElementById('megaError');
            const megaMeta = document.getElementById('megaMeta');
            const megaNumbers = document.getElementById('megaNumbers');
            const megaRateio = document.getElementById('megaRateio');
            const megaProximo = document.getElementById('megaProximo');

            megaError.textContent = '';
            megaMeta.textContent = 'Carregando dados da Mega Sena...';
            megaNumbers.innerHTML = '';
            megaRateio.innerHTML = '';
            megaProximo.innerHTML = '';

            for (const url of MEGA_API_CANDIDATOS) {
                try {
                    const res = await fetch(url);
                    if (!res.ok) {
                        console.warn('Mega Sena, endpoint falhou:', url, res.status);
                        continue;
                    }
                    const data = await res.json();
                    if (!data || (!data.listaDezenas && !data.listaDezenas && !data.dezenas)) throw new Error('Resposta inválida');

                    exibirMegaSena(data, false);
                    return;
                } catch (err) {
                    console.warn('Tentativa de endpoint Mega Sena falhou:', url, err.message || err);
                    continue;
                }
            }

            console.warn('Todos endpoints Mega Sena falharam, usando fallback.');
            exibirMegaSena(MEGA_FALLBACK, true);
        }

        function gerarSurpresinha() {
            const numeroAleatorio = (min, max) => String(Math.floor(Math.random() * (max - min + 1) + min)).padStart(2, '0');
            const escolhidos = new Set();

            while (escolhidos.size < 6) {
                escolhidos.add(numeroAleatorio(1, 60));
            }

            const megaNumbers = document.getElementById('megaNumbers');
            megaNumbers.innerHTML = Array.from(escolhidos).sort((a, b) => a - b).map(num => `<div class="mega-ball">${num}</div>`).join('');
            document.getElementById('megaMeta').innerHTML = 'Surpresinha gerada localmente (sem vínculo oficial).';
            document.getElementById('megaHistory').innerHTML = '';
        }

        async function carregarHistoricoMegaSena() {
            const megaHistory = document.getElementById('megaHistory');
            const megaError = document.getElementById('megaError');
            megaError.textContent = '';
            megaHistory.innerHTML = 'Buscando histórico...';

            try {
                const resposta = await fetch('https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena');
                if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

                const atual = await resposta.json();
                const concursoAtual = Number(atual.numero || atual.id || 0);
                if (!concursoAtual) throw new Error('Concurso atual inválido');

                const concursos = Array.from({ length: 5 }, (_, i) => concursoAtual - i);
                const dadosSorteios = await Promise.all(concursos.map(async (c) => {
                    try {
                        const r = await fetch(`https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/${c}`);
                        if (!r.ok) throw new Error(`HTTP ${r.status}`);
                        return await r.json();
                    } catch (e) {
                        console.warn('Não foi possível obter concurso', c, e.message);
                        return null;
                    }
                }));

                const validos = dadosSorteios.filter(Boolean);
                if (validos.length === 0) {
                    megaHistory.innerHTML = '<p style="color: #ff6b6b;">Histórico não disponível no momento.</p>';
                    return;
                }

                megaHistory.innerHTML = validos.map(sorteio => {
                    const data = sorteio.dataApuracao || sorteio.data_apuracao || 'N/A';
                    const dezenas = (sorteio.listaDezenas || sorteio.dezenas || []).map(n => `<span class="mega-ball">${String(n).padStart(2, '0')}</span>`).join('');
                    const rateio = sorteio.listaRateioPremio || [];

                    const criarCardRateio = (titulo, ganhadores, valor) => `
                        <div class="mega-prize-card">
                            <div class="mega-prize-title">${formatFaixaMega(titulo)}</div>
                            <div class="mega-prize-value">R$ ${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div class="mega-prize-winners">${formatGanhadores(ganhadores)}</div>
                        </div>
                    `;

                    const premio6 = rateio.find(r => /6 acertos/i.test(r.descricaoFaixa || r.descricao_faixa || '')) || { descricaoFaixa: '6 acertos', numeroDeGanhadores: 0, valorPremio: 0 };
                    const premio5 = rateio.find(r => /5 acertos/i.test(r.descricaoFaixa || r.descricao_faixa || '')) || { descricaoFaixa: '5 acertos', numeroDeGanhadores: 0, valorPremio: 0 };
                    const premio4 = rateio.find(r => /4 acertos/i.test(r.descricaoFaixa || r.descricao_faixa || '')) || { descricaoFaixa: '4 acertos', numeroDeGanhadores: 0, valorPremio: 0 };

                    const cardsRateio = `
                        <div class="mega-prize-grid">
                            ${criarCardRateio(premio6.descricaoFaixa || premio6.descricao_faixa, premio6.numeroDeGanhadores || premio6.numero_de_ganhadores, premio6.valorPremio || premio6.valor_premio)}
                            ${criarCardRateio(premio5.descricaoFaixa || premio5.descricao_faixa, premio5.numeroDeGanhadores || premio5.numero_de_ganhadores, premio5.valorPremio || premio5.valor_premio)}
                            ${criarCardRateio(premio4.descricaoFaixa || premio4.descricao_faixa, premio4.numeroDeGanhadores || premio4.numero_de_ganhadores, premio4.valorPremio || premio4.valor_premio)}
                        </div>
                    `;

                    return `
                        <div class="mega-history-card">
                            <div style="font-weight:700; color:#fff; margin-bottom:6px;">Concurso #${sorteio.numero || sorteio.id || '?'} - ${data}</div>
                            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:6px;">${dezenas}</div>
                            <div style="color:#ccc; font-size:13px; margin-bottom:10px;">Próximo: R$ ${Number(sorteio.valorEstimadoProximoConcurso || sorteio.valor_estimado_proximo_concurso || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} em ${sorteio.dataProximoConcurso || sorteio.data_proximo_concurso || 'N/A'}</div>
                            ${cardsRateio}
                        </div>
                    `;
                }).join('');

            } catch (err) {
                console.warn('Erro ao carregar histórico Mega Sena:', err);
                megaHistory.innerHTML = '';
                megaError.textContent = 'Não foi possível carregar histórico.';
            }
        }

        function carregarSecundarios() {
            const agendar = window.requestIdleCallback || ((callback) => setTimeout(callback, 900));

            let carregou = false;
            const iniciar = () => {
                if (carregou) return;
                carregou = true;
                agendar(() => {
                    setTimeout(carregarClima, 250);
                    setTimeout(carregarMegaSena, 600);

                    setInterval(() => {
                        console.log('Atualizando Mega Sena automaticamente...');
                        carregarMegaSena();
                    }, 30 * 60 * 1000);
                });
            };

            const secao = document.getElementById('clima-mega-section');
            if (!secao || !('IntersectionObserver' in window)) {
                setTimeout(iniciar, 4000);
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                if (entries.some(entry => entry.isIntersecting)) {
                    observer.disconnect();
                    iniciar();
                }
            }, { rootMargin: '300px 0px' });

            observer.observe(secao);
        }

        // NOTIFICAÇÕES
        let notificacoes = JSON.parse(getStorage().getItem('c7-notificacoes') || '[]');
        let unreadCount = notificacoes.filter(n => !n.lida).length;

        function salvarNotificacoes() {
            getStorage().setItem('c7-notificacoes', JSON.stringify(notificacoes));
            atualizarBadgeNotificacoes();
            renderNotificacoes();
        }

        function adicionarNotificacao(titulo, tipo = 'news', data = new Date()) {
            // Evitar duplicatas recentes
            if (notificacoes.some(n => n.titulo === titulo && (Date.now() - new Date(n.data).getTime()) < 3600000)) return;

            notificacoes.unshift({
                id: Date.now().toString(),
                titulo,
                tipo,
                data: data.toISOString(),
                lida: false
            });
            
            // Manter apenas as últimas 50
            if (notificacoes.length > 50) notificacoes = notificacoes.slice(0, 50);
            
            unreadCount++;
            salvarNotificacoes();
        }

        function atualizarBadgeNotificacoes() {
            const badge = document.getElementById('notifBadge');
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        function toggleNotifPanel() {
            const panel = document.getElementById('notifPanel');
            const isOpen = panel.classList.contains('open');
            
            if (isOpen) {
                panel.classList.remove('open');
            } else {
                panel.classList.add('open');
                renderNotificacoes();
                // Marcar como lidas ao abrir
                if (unreadCount > 0) {
                    notificacoes.forEach(n => n.lida = true);
                    unreadCount = 0;
                    salvarNotificacoes();
                }
            }
        }

        function limparNotificacoes() {
            notificacoes = [];
            unreadCount = 0;
            salvarNotificacoes();
        }

        function formatTimeAgo(dateString) {
            const date = new Date(dateString);
            const seconds = Math.floor((new Date() - date) / 1000);
            
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + " anos atrás";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + " meses atrás";
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + " dias atrás";
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + " horas atrás";
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + " minutos atrás";
            return Math.floor(seconds) + " segundos atrás";
        }

        function renderNotificacoes() {
            const container = document.getElementById('notifPanelBody');
            if (notificacoes.length === 0) {
                container.innerHTML = '<div class="notif-empty">Nenhuma notificação no momento.</div>';
                return;
            }

            container.innerHTML = notificacoes.map(n => `
                <div class="notif-item ${n.lida ? '' : 'unread'}" onclick="toggleNotifPanel()">
                    <div class="notif-item-title">
                        <i class="fas ${n.tipo === 'sport' ? 'fa-futbol sport' : 'fa-newspaper news'} notif-item-icon"></i>
                        ${n.titulo}
                    </div>
                    <div class="notif-item-time">${formatTimeAgo(n.data)}</div>
                </div>
            `).join('');
        }

        // Fechar painel ao clicar fora
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notifPanel');
            const btn = document.getElementById('notifBellBtn');
            if (panel.classList.contains('open') && !panel.contains(e.target) && !btn.contains(e.target)) {
                panel.classList.remove('open');
            }
        });


        // ESPORTES
        const timesBrasileiros = [
            { id: '133704', nome: 'Flamengo', escudo: 'https://www.thesportsdb.com/images/media/team/badge/h6kuh71624632836.png', tipo: 'Série A' },
            { id: '133724', nome: 'Palmeiras', escudo: 'https://www.thesportsdb.com/images/media/team/badge/1k8h6q1514068305.png', tipo: 'Série A' },
            { id: '133739', nome: 'São Paulo', escudo: 'https://www.thesportsdb.com/images/media/team/badge/5kndol1624632788.png', tipo: 'Série A' },
            { id: '133702', nome: 'Corinthians', escudo: 'https://www.thesportsdb.com/images/media/team/badge/sxsxtx1473539824.png', tipo: 'Série A' },
            { id: '133705', nome: 'Fluminense', escudo: 'https://www.thesportsdb.com/images/media/team/badge/1x0q5i1514069795.png', tipo: 'Série A' },
            { id: '133737', nome: 'Grêmio', escudo: 'https://www.thesportsdb.com/images/media/team/badge/yqwutu1448819875.png', tipo: 'Série A' },
            { id: '133738', nome: 'Internacional', escudo: 'https://www.thesportsdb.com/images/media/team/badge/r1p50a1624632688.png', tipo: 'Série A' },
            { id: '133714', nome: 'Atlético-MG', escudo: 'https://www.thesportsdb.com/images/media/team/badge/usptut1448819694.png', tipo: 'Série A' },
            { id: '133715', nome: 'Cruzeiro', escudo: 'https://www.thesportsdb.com/images/media/team/badge/qvrxsp1448819717.png', tipo: 'Série A' },
            { id: '133703', nome: 'Botafogo', escudo: 'https://www.thesportsdb.com/images/media/team/badge/2e086s1514069876.png', tipo: 'Série A' },
            { id: '133706', nome: 'Vasco', escudo: 'https://www.thesportsdb.com/images/media/team/badge/1r994t1624632882.png', tipo: 'Série A' },
            { id: '133725', nome: 'Santos', escudo: 'https://www.thesportsdb.com/images/media/team/badge/vvwyq01514068393.png', tipo: 'Série B' }
        ];

        let timesFavoritos = JSON.parse(getStorage().getItem('c7-times-favoritos') || '[]');
        let timeModalAtual = null;
        let tabAtual = 'ultimos';

        function salvarFavoritos() {
            getStorage().setItem('c7-times-favoritos', JSON.stringify(timesFavoritos));
        }

        function toggleFavorito(id, event) {
            if (event) {
                event.stopPropagation();
            }
            if (timesFavoritos.includes(id)) {
                timesFavoritos = timesFavoritos.filter(t => t !== id);
            } else {
                timesFavoritos.push(id);
                const time = timesBrasileiros.find(t => t.id === id);
                if (time) {
                    adicionarNotificacao(`Você favoritou o ${time.nome}. Receberá notificações sobre resultados.`, 'sport');
                }
            }
            salvarFavoritos();
            renderEsportes();
            if (timeModalAtual && timeModalAtual.id === id) {
                atualizarBtnFavoritoModal();
            }
        }

        function toggleFavoritoModal() {
            if (timeModalAtual) {
                toggleFavorito(timeModalAtual.id, null);
            }
        }

        function atualizarBtnFavoritoModal() {
            const btn = document.getElementById('timeModalFavBtn');
            const icon = btn.querySelector('i');
            if (timesFavoritos.includes(timeModalAtual.id)) {
                btn.classList.add('favorito');
                icon.className = 'fas fa-star';
                btn.innerHTML = '<i class="fas fa-star"></i> Favorito';
            } else {
                btn.classList.remove('favorito');
                icon.className = 'far fa-star';
                btn.innerHTML = '<i class="far fa-star"></i> Favoritar';
            }
        }

        function renderEsportes() {
            const grid = document.getElementById('esportesTimesGrid');
            if (!grid) return;

            // Ordenar: Favoritos primeiro
            const timesOrdenados = [...timesBrasileiros].sort((a, b) => {
                const aFav = timesFavoritos.includes(a.id);
                const bFav = timesFavoritos.includes(b.id);
                if (aFav && !bFav) return -1;
                if (!aFav && bFav) return 1;
                return 0;
            });

            grid.innerHTML = timesOrdenados.map(time => {
                const isFav = timesFavoritos.includes(time.id);
                return `
                    <div class="esporte-time-card" onclick="abrirTimeModal('${time.id}')">
                        <i class="${isFav ? 'fas' : 'far'} fa-star esporte-fav-star ${isFav ? 'favorito' : ''}" onclick="toggleFavorito('${time.id}', event)"></i>
                        <img src="${time.escudo}" alt="${time.nome}" loading="lazy">
                        <div class="esporte-time-nome">${time.nome}</div>
                    </div>
                `;
            }).join('');
        }

        function abrirTimeModal(id) {
            const time = timesBrasileiros.find(t => t.id === id);
            if (!time) return;

            timeModalAtual = time;
            document.getElementById('timeModalNome').textContent = time.nome;
            document.getElementById('timeModalEscudo').src = time.escudo;
            document.getElementById('timeModalExtra').textContent = time.tipo;
            
            atualizarBtnFavoritoModal();
            document.getElementById('timeModal').classList.add('active');
            document.body.classList.add('modal-open');
            
            mudarTimeTab('ultimos');
        }

        function fecharTimeModal() {
            document.getElementById('timeModal').classList.remove('active');
            document.body.classList.remove('modal-open');
            timeModalAtual = null;
        }

        function mudarTimeTab(tab) {
            tabAtual = tab;
            document.getElementById('tabUltimos').classList.toggle('active', tab === 'ultimos');
            document.getElementById('tabProximos').classList.toggle('active', tab === 'proximos');
            carregarJogosTime();
        }

        async function carregarJogosTime() {
            const container = document.getElementById('timeJogosContainer');
            if (!timeModalAtual) return;

            container.innerHTML = '<div class="jogos-loading"><i class="fas fa-spinner fa-spin"></i> Carregando jogos...</div>';

            try {
                // Endpoint TheSportsDB: Past Events (eventslast.php) ou Next Events (eventsnext.php)
                // Usando chave 3 (free/test)
                const endpoint = tabAtual === 'ultimos' 
                    ? `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${timeModalAtual.id}`
                    : `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${timeModalAtual.id}`;

                const response = await fetch(endpoint);
                const data = await response.json();
                
                const events = data.results || data.events || [];

                if (events.length === 0) {
                    container.innerHTML = '<div class="notif-empty">Nenhum jogo encontrado.</div>';
                    return;
                }

                container.innerHTML = events.map(jogo => {
                    const dataJogo = new Date(jogo.strTimestamp || jogo.dateEvent);
                    const formatada = isNaN(dataJogo.getTime()) ? jogo.dateEvent : dataJogo.toLocaleDateString('pt-BR') + ' ' + (jogo.strTime ? jogo.strTime.substring(0, 5) : '');
                    
                    const placar = tabAtual === 'ultimos' 
                        ? `${jogo.intHomeScore || 0} - ${jogo.intAwayScore || 0}`
                        : 'vs';

                    return `
                        <div class="jogo-card">
                            <div class="jogo-time-nome" style="text-align: right;">${jogo.strHomeTeam}</div>
                            <div class="jogo-placar">${placar}</div>
                            <div class="jogo-time-nome">${jogo.strAwayTeam}</div>
                            <div class="jogo-data">${formatada}<br>${jogo.strLeague || ''}</div>
                        </div>
                    `;
                }).join('');

            } catch (err) {
                console.warn('Erro ao carregar jogos:', err);
                container.innerHTML = '<div class="notif-empty" style="color: #ff6b6b;">Erro ao carregar dados dos jogos.</div>';
            }
        }

        // Simula checagem de resultados para times favoritos (apenas visualmente para notificar)
        function checarResultadosFavoritos() {
            if (timesFavoritos.length > 0 && Math.random() > 0.7) {
                const id = timesFavoritos[Math.floor(Math.random() * timesFavoritos.length)];
                const time = timesBrasileiros.find(t => t.id === id);
                if (time) {
                    adicionarNotificacao(`Resultado atualizado para ${time.nome}. Confira os últimos jogos.`, 'sport');
                }
            }
        }

        // Intercepta a adição de notícias (simulado ou real) para adicionar notificação
        const originalExibir = typeof exibir === 'function' ? exibir : null;
        if (originalExibir) {
            exibir = function(noticias) {
                originalExibir(noticias);
                if (noticias && noticias.length > 0) {
                    // Simular notificação da notícia mais recente se ela for nova (baseado na data)
                    const maisRecente = noticias[0];
                    const chaveVisto = 'c7-last-news-seen';
                    const ultimoVisto = getStorage().getItem(chaveVisto);
                    
                    if (maisRecente._id !== ultimoVisto) {
                        adicionarNotificacao(`Nova notícia: ${maisRecente.titulo}`, 'news', new Date(maisRecente.dataPublicacao || Date.now()));
                        getStorage().setItem(chaveVisto, maisRecente._id);
                    }
                }
            };
        }

        // Carrega as notícias assim que o HTML fica pronto
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Página pronta, iniciando carregamento rápido de notícias...');
            atualizarBadgeNotificacoes();
            renderEsportes();
            travarBounceSafari();
            atualizarBotaoLimparBusca();
            carregarCategoriasPublicas();
            carregarTodas();
            carregarAnuncios();
            carregarSecundarios();
            
            setInterval(checarResultadosFavoritos, 60 * 1000 * 10); // A cada 10 min
        });
    