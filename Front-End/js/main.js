// Configuração da API
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const API_URL = isLocal ? 'http://localhost:5000/api' : 'https://c7-noticias-backend.onrender.com/api';
let noticiaAtual = null;
let categoriaAtual = null;
let noticiasCacheStr = '';
let anunciosCacheStr = '';
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
    if (!original || original.startsWith('data:') || original.startsWith('blob:') || original.startsWith('../img/') || original.startsWith('img/')) {
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

    // Retorna a URL original diretamente para evitar a lentidão do proxy weserv.nl
    return original;
}

function imagemResponsiva(url, larguraPequena, larguraGrande, qualidade = 65) {
    return `src="${otimizarImagem(url, larguraPequena, qualidade)}" srcset="${otimizarImagem(url, larguraPequena, qualidade)} ${larguraPequena}w, ${otimizarImagem(url, larguraGrande, qualidade)} ${larguraGrande}w"`;
}

// Elementos do DOM
const noticiaContainer = document.getElementById('noticias-container');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close');
const menuLinks = document.querySelectorAll('.menu-link[data-categoria]');

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    carregarNoticias();
    carregarAnuncios();
    setupEventListeners();
    
    // Auto-Refresh a cada 1 segundo (quase instantâneo)
    setInterval(() => {
        if (categoriaAtual) {
            carregarNoticiasPorCategoria(categoriaAtual, true);
        } else {
            carregarNoticias(true);
        }
        carregarAnuncios(true);
    }, 1000);
});

// Setup de Event Listeners
function setupEventListeners() {
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            categoriaAtual = link.dataset.categoria;
            noticiasCacheStr = ''; // Reset cache on navigation
            carregarNoticiasPorCategoria(categoriaAtual);
        });
    });

    // Home link
    document.querySelector('.menu-principal .menu-link').addEventListener('click', (e) => {
        e.preventDefault();
        categoriaAtual = null;
        noticiasCacheStr = ''; // Reset cache on navigation
        carregarNoticias();
    });
}

// Carregar todas as notícias
async function carregarNoticias(isSilencioso = false) {
    try {
        const response = await fetch(`${API_URL}/noticias?t=${Date.now()}`);
        const noticias = await response.json();
        
        const novoCache = JSON.stringify(noticias);
        if (isSilencioso && novoCache === noticiasCacheStr) return; // Nenhuma mudança
        noticiasCacheStr = novoCache;
        
        exibirNoticias(noticias);
    } catch (error) {
        if (!isSilencioso) {
            console.error('Erro ao carregar notícias:', error);
            noticiaContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Erro ao carregar notícias. Certifique-se que o servidor está rodando.</p>';
        }
    }
}

// Carregar notícias por categoria
async function carregarNoticiasPorCategoria(categoria, isSilencioso = false) {
    try {
        const response = await fetch(`${API_URL}/noticias/categoria/${categoria}?t=${Date.now()}`);
        const noticias = await response.json();
        
        const novoCache = JSON.stringify(noticias);
        if (isSilencioso && novoCache === noticiasCacheStr) return; // Nenhuma mudança
        noticiasCacheStr = novoCache;
        
        exibirNoticias(noticias);
    } catch (error) {
        if (!isSilencioso) console.error(`Erro ao carregar notícias de ${categoria}:`, error);
    }
}

// Exibir notícias na página
function exibirNoticias(noticias) {
    noticiaContainer.innerHTML = '';

    if (noticias.length === 0) {
        noticiaContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Nenhuma notícia disponível</p>';
        return;
    }

    noticias.forEach(noticia => {
        const card = criarCardNoticia(noticia);
        noticiaContainer.appendChild(card);
    });
}

// Criar card da notícia
function criarCardNoticia(noticia) {
    const card = document.createElement('div');
    card.className = 'noticia-card';

    const data = new Date(noticia.createdAt);
    const dataFormatada = data.toLocaleDateString('pt-BR') + ' - ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    card.innerHTML = `
        <div class="noticia-imagem">
            <img ${imagemResponsiva(noticia.foto, 360, 720, 58)} sizes="(max-width: 768px) 100vw, 300px" alt="${noticia.titulo}" width="300" height="200" loading="lazy" decoding="async" onerror="this.src='img/Logo.png'">
        </div>
        <div class="noticia-info">
            <span class="noticia-categoria">${noticia.categoria}</span>
            <h3 class="noticia-titulo">${noticia.titulo}</h3>
            <p class="noticia-data">${dataFormatada} • ${noticia.views} views</p>
        </div>
    `;

    card.addEventListener('click', () => {
        noticiaAtual = noticia;
        mostrarNoticiaCompleta(noticia);
    });

    return card;
}

// Mostrar notícia completa no modal
function mostrarNoticiaCompleta(noticia) {
    const data = new Date(noticia.createdAt);
    const dataFormatada = data.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    modalBody.innerHTML = `
        <img ${imagemResponsiva(noticia.foto, 800, 1200, 68)} sizes="(max-width: 768px) 100vw, 800px" alt="${noticia.titulo}" width="800" height="400" loading="eager" decoding="async" onerror="this.src='img/Logo.png'">
        <h2>${noticia.titulo}</h2>
        <p style="font-size: 12px; color: #888; margin-bottom: 15px;">
            ${dataFormatada} - ${noticia.categoria}
        </p>
        <div>${noticia.conteudo}</div>
    `;

    modal.style.display = 'block';
}

// Carregar anúncios
async function carregarAnuncios(isSilencioso = false) {
    try {
        const response = await fetch(`${API_URL}/anuncios`);
        const anuncios = await response.json();

        const novoCache = JSON.stringify(anuncios);
        if (isSilencioso && novoCache === anunciosCacheStr) return; // Nenhuma mudança
        anunciosCacheStr = novoCache;

        // Anúncio do topo
        const anuncioBanner = anuncios.find(a => a.posicao === 'topo') || anuncios[0];
        if (anuncioBanner) {
            const bannerElement = document.getElementById('banner-img');
            bannerElement.src = otimizarImagem(anuncioBanner.foto, 1200, 62);
            bannerElement.srcset = `${otimizarImagem(anuncioBanner.foto, 480, 62)} 480w, ${otimizarImagem(anuncioBanner.foto, 1200, 62)} 1200w`;
            bannerElement.sizes = '(max-width: 768px) 100vw, 1200px';
            bannerElement.addEventListener('click', () => {
                if (anuncioBanner.link !== '#') {
                    window.open(anuncioBanner.link, '_blank');
                }
                registrarClique(anuncioBanner._id);
            });
        }

        // Anúncio lateral
        const anuncioLateral = anuncios.find(a => a.posicao === 'lateral') || anuncios[1];
        if (anuncioLateral) {
            const lateralElement = document.getElementById('anuncio-lateral');
            lateralElement.innerHTML = `
                <img ${imagemResponsiva(anuncioLateral.foto, 240, 480, 62)} sizes="240px" alt="Anúncio" width="300" height="400" loading="lazy" decoding="async" style="cursor: pointer;">
            `;
            lateralElement.querySelector('img').addEventListener('click', () => {
                if (anuncioLateral.link !== '#') {
                    window.open(anuncioLateral.link, '_blank');
                }
                registrarClique(anuncioLateral._id);
            });
        }

        // Anúncio do rodapé
        const anuncioRodape = anuncios.find(a => a.posicao === 'rodape') || anuncios[2];
        if (anuncioRodape) {
            const rodapeElement = document.getElementById('anuncio-rodape');
            rodapeElement.innerHTML = `
                <img ${imagemResponsiva(anuncioRodape.foto, 480, 1200, 62)} sizes="(max-width: 768px) 100vw, 1200px" alt="Anúncio Rodapé" width="1200" height="200" loading="lazy" decoding="async" style="cursor: pointer;">
            `;
            rodapeElement.querySelector('img').addEventListener('click', () => {
                if (anuncioRodape.link !== '#') {
                    window.open(anuncioRodape.link, '_blank');
                }
                registrarClique(anuncioRodape._id);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar anúncios:', error);
    }
}

// Registrar clique no anúncio
async function registrarClique(anuncioId) {
    try {
        await fetch(`${API_URL}/anuncios/${anuncioId}/clique`, { method: 'POST' });
    } catch (error) {
        console.error('Erro ao registrar clique:', error);
    }
}
