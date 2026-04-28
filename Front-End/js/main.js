// Configuração da API
const API_URL = 'http://localhost:5000/api';
let noticiaAtual = null;

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
            const categoria = link.dataset.categoria;
            carregarNoticiasPorCategoria(categoria);
        });
    });

    // Home link
    document.querySelector('.menu-principal .menu-link').addEventListener('click', (e) => {
        e.preventDefault();
        carregarNoticias();
    });
}

// Carregar todas as notícias
async function carregarNoticias() {
    try {
        const response = await fetch(`${API_URL}/noticias`);
        const noticias = await response.json();
        exibirNoticias(noticias);
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
        noticiaContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Erro ao carregar notícias. Certifique-se que o servidor está rodando.</p>';
    }
}

// Carregar notícias por categoria
async function carregarNoticiasPorCategoria(categoria) {
    try {
        const response = await fetch(`${API_URL}/noticias/categoria/${categoria}`);
        const noticias = await response.json();
        exibirNoticias(noticias);
    } catch (error) {
        console.error(`Erro ao carregar notícias de ${categoria}:`, error);
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
            <img src="${noticia.foto}" alt="${noticia.titulo}" onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
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
        <img src="${noticia.foto}" alt="${noticia.titulo}" onerror="this.src='https://via.placeholder.com/800x400?text=Sem+Imagem'">
        <h2>${noticia.titulo}</h2>
        <p style="font-size: 12px; color: #888; margin-bottom: 15px;">
            ${dataFormatada} - ${noticia.categoria}
        </p>
        <div>${noticia.conteudo}</div>
    `;

    modal.style.display = 'block';
}

// Carregar anúncios
async function carregarAnuncios() {
    try {
        const response = await fetch(`${API_URL}/anuncios`);
        const anuncios = await response.json();

        // Anúncio do topo
        const anuncioBanner = anuncios.find(a => a.posicao === 'topo') || anuncios[0];
        if (anuncioBanner) {
            const bannerElement = document.getElementById('banner-img');
            bannerElement.src = anuncioBanner.foto;
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
                <img src="${anuncioLateral.foto}" alt="Anúncio" style="cursor: pointer;">
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
                <img src="${anuncioRodape.foto}" alt="Anúncio Rodapé" style="cursor: pointer;">
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
