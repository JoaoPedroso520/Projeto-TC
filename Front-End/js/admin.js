// Configuração da API
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://c7-noticias-backend.onrender.com/api';

// Estado
let noticiaEmEdicao = null;
let anuncioEmEdicao = null;
let itemParaDeletar = null;

// Elementos do DOM
const menuItems = document.querySelectorAll('.menu-item:not(.voltar)');
const tabContents = document.querySelectorAll('.tab-content');

const btnNovaNoticia = document.getElementById('btn-nova-noticia');
const formNoticia = document.getElementById('form-noticia');
const formularioNoticia = document.getElementById('formulario-noticia');
const cancelarNoticia = document.getElementById('cancelar-noticia');
const tbodyNoticias = document.getElementById('tbody-noticias');

const btnNovoAnuncio = document.getElementById('btn-novo-anuncio');
const formAnuncio = document.getElementById('form-anuncio');
const formularioAnuncio = document.getElementById('formulario-anuncio');
const cancelarAnuncio = document.getElementById('cancelar-anuncio');
const tbodyAnuncios = document.getElementById('tbody-anuncios');

const modal = document.getElementById('modal-confirmacao');
const btnConfirmar = document.getElementById('confirmar');
const btnCancelarModal = document.getElementById('modal-cancelar');

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarNoticias();
    carregarAnuncios();
    setupEventListeners();
});

// Setup de Event Listeners
function setupEventListeners() {
    // Menu de abas
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.dataset.tab;
            mudarAba(tabName);
        });
    });

    // Notícias
    btnNovaNoticia.addEventListener('click', abrirFormularioNoticia);
    cancelarNoticia.addEventListener('click', fecharFormularioNoticia);
    formularioNoticia.addEventListener('submit', salvarNoticia);

    // Anúncios
    btnNovoAnuncio.addEventListener('click', abrirFormularioAnuncio);
    cancelarAnuncio.addEventListener('click', fecharFormularioAnuncio);
    formularioAnuncio.addEventListener('submit', salvarAnuncio);

    // Modal
    btnCancelarModal.addEventListener('click', fecharModal);
}

// ========== NAVEGAÇÃO DE ABAS ==========
function mudarAba(tabName) {
    menuItems.forEach(item => item.classList.remove('active'));
    event.target.closest('.menu-item').classList.add('active');

    tabContents.forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.add('active');
}

// ========== NOTÍCIAS ==========

// Carregar notícias
async function carregarNoticias() {
    try {
        const response = await fetch(`${API_URL}/noticias`);
        const noticias = await response.json();
        exibirNoticias(noticias);
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
    }
}

// Exibir notícias na tabela
function exibirNoticias(noticias) {
    tbodyNoticias.innerHTML = '';

    if (noticias.length === 0) {
        tbodyNoticias.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Nenhuma notícia encontrada</td></tr>';
        return;
    }

    noticias.forEach(noticia => {
        const row = criarLinhaNoticias(noticia);
        tbodyNoticias.appendChild(row);
    });
}

// Criar linha da tabela de notícias
function criarLinhaNoticias(noticia) {
    const row = document.createElement('tr');
    const data = new Date(noticia.createdAt);
    const dataFormatada = data.toLocaleDateString('pt-BR');

    row.innerHTML = `
        <td>${noticia.titulo}</td>
        <td>${noticia.categoria}</td>
        <td><span class="status ${noticia.ativo  'ativo' : 'inativo'}">${noticia.ativo  'Ativo' : 'Inativo'}</span></td>
        <td>${noticia.views}</td>
        <td>${dataFormatada}</td>
        <td>
            <div class="acoes">
                <button class="btn btn-editar" onclick="editarNoticia('${noticia._id}')">Editar</button>
                <button class="btn btn-deletar" onclick="confirmarDelecao('noticia', '${noticia._id}', '${noticia.titulo}')">Deletar</button>
            </div>
        </td>
    `;

    return row;
}

// Abrir formulário de nova notícia
function abrirFormularioNoticia() {
    noticiaEmEdicao = null;
    document.getElementById('noticia-id').value = '';
    formularioNoticia.reset();
    formNoticia.classList.remove('hidden');
    formNoticia.scrollIntoView({ behavior: 'smooth' });
}

// Fechar formulário de notícia
function fecharFormularioNoticia() {
    formNoticia.classList.add('hidden');
    noticiaEmEdicao = null;
}

// Editar notícia
async function editarNoticia(id) {
    try {
        const response = await fetch(`${API_URL}/noticias/${id}`);
        const noticia = await response.json();

        noticiaEmEdicao = noticia;
        document.getElementById('noticia-id').value = noticia._id;
        document.getElementById('noticia-titulo').value = noticia.titulo;
        document.getElementById('noticia-categoria').value = noticia.categoria;
        document.getElementById('noticia-foto').value = noticia.foto;
        document.getElementById('noticia-conteudo').value = noticia.conteudo;
        document.getElementById('noticia-ativo').checked = noticia.ativo;

        formNoticia.classList.remove('hidden');
        formNoticia.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Erro ao carregar notícia:', error);
    }
}

// Salvar notícia
async function salvarNoticia(e) {
    e.preventDefault();

    const id = document.getElementById('noticia-id').value;
    const dados = {
        titulo: document.getElementById('noticia-titulo').value,
        categoria: document.getElementById('noticia-categoria').value,
        foto: document.getElementById('noticia-foto').value,
        conteudo: document.getElementById('noticia-conteudo').value,
        ativo: document.getElementById('noticia-ativo').checked,
    };

    try {
        let response;
        if (id) {
            // Atualizar
            response = await fetch(`${API_URL}/noticias/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
            });
        } else {
            // Criar
            response = await fetch(`${API_URL}/noticias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
            });
        }

        if (response.ok) {
            fecharFormularioNoticia();
            carregarNoticias();
            alert(id ? 'Notícia atualizada com sucesso!' : 'Notícia criada com sucesso!');
        } else {
            alert('Erro ao salvar notícia');
        }
    } catch (error) {
        console.error('Erro ao salvar notícia:', error);
        alert('Erro ao salvar notícia');
    }
}

// ========== ANÚNCIOS ==========

// Carregar anúncios
async function carregarAnuncios() {
    try {
        const response = await fetch(`${API_URL}/anuncios/admin/todos`);
        const anuncios = await response.json();
        exibirAnuncios(anuncios);
    } catch (error) {
        console.error('Erro ao carregar anúncios:', error);
    }
}

// Exibir anúncios na tabela
function exibirAnuncios(anuncios) {
    tbodyAnuncios.innerHTML = '';

    if (anuncios.length === 0) {
        tbodyAnuncios.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Nenhum anúncio encontrado</td></tr>';
        return;
    }

    anuncios.forEach(anuncio => {
        const row = criarLinhaAnuncios(anuncio);
        tbodyAnuncios.appendChild(row);
    });
}

// Criar linha da tabela de anúncios
function criarLinhaAnuncios(anuncio) {
    const row = document.createElement('tr');
    const inicio = new Date(anuncio.dataInicio).toLocaleDateString('pt-BR');
    const fim = new Date(anuncio.dataFim).toLocaleDateString('pt-BR');
    const posicaoTexto = {
        topo: 'Topo',
        lateral: 'Lateral',
        rodape: 'Rodapé'
    };

    row.innerHTML = `
        <td>${anuncio.titulo}</td>
        <td>${posicaoTexto[anuncio.posicao]}</td>
        <td>${inicio} a ${fim}</td>
        <td><span class="status ${anuncio.ativo ? 'ativo' : 'inativo'}">${anuncio.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>${anuncio.cliques}</td>
        <td>
            <div class="acoes">
                <button class="btn btn-editar" onclick="editarAnuncio('${anuncio._id}')">Editar</button>
                <button class="btn btn-deletar" onclick="confirmarDelecao('anuncio', '${anuncio._id}', '${anuncio.titulo}')">Deletar</button>
            </div>
        </td>
    `;

    return row;
}

// Abrir formulário de novo anúncio
function abrirFormularioAnuncio() {
    anuncioEmEdicao = null;
    document.getElementById('anuncio-id').value = '';
    formularioAnuncio.reset();
    formAnuncio.classList.remove('hidden');
    formAnuncio.scrollIntoView({ behavior: 'smooth' });
}

// Fechar formulário de anúncio
function fecharFormularioAnuncio() {
    formAnuncio.classList.add('hidden');
    anuncioEmEdicao = null;
}

// Editar anúncio
async function editarAnuncio(id) {
    try {
        const response = await fetch(`${API_URL}/anuncios`);
        const anuncios = await response.json();
        const anuncio = anuncios.find(a => a._id === id);

        if (!anuncio) {
            alert('Anúncio não encontrado');
            return;
        }

        anuncioEmEdicao = anuncio;
        document.getElementById('anuncio-id').value = anuncio._id;
        document.getElementById('anuncio-titulo').value = anuncio.titulo;
        document.getElementById('anuncio-foto').value = anuncio.foto;
        document.getElementById('anuncio-link').value = anuncio.link || '';
        document.getElementById('anuncio-inicio').value = formatarDataTimeLocal(anuncio.dataInicio);
        document.getElementById('anuncio-fim').value = formatarDataTimeLocal(anuncio.dataFim);
        document.getElementById('anuncio-posicao').value = anuncio.posicao;
        document.getElementById('anuncio-ativo').checked = anuncio.ativo;

        formAnuncio.classList.remove('hidden');
        formAnuncio.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Erro ao carregar anúncio:', error);
    }
}

// Salvar anúncio
async function salvarAnuncio(e) {
    e.preventDefault();

    const id = document.getElementById('anuncio-id').value;
    const dados = {
        titulo: document.getElementById('anuncio-titulo').value,
        foto: document.getElementById('anuncio-foto').value,
        link: document.getElementById('anuncio-link').value || '#',
        dataInicio: document.getElementById('anuncio-inicio').value,
        dataFim: document.getElementById('anuncio-fim').value,
        posicao: document.getElementById('anuncio-posicao').value,
        ativo: document.getElementById('anuncio-ativo').checked,
    };

    try {
        let response;
        if (id) {
            // Atualizar
            response = await fetch(`${API_URL}/anuncios/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
            });
        } else {
            // Criar
            response = await fetch(`${API_URL}/anuncios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
            });
        }

        if (response.ok) {
            fecharFormularioAnuncio();
            carregarAnuncios();
            alert(id ? 'Anúncio atualizado com sucesso!' : 'Anúncio criado com sucesso!');
        } else {
            alert('Erro ao salvar anúncio');
        }
    } catch (error) {
        console.error('Erro ao salvar anúncio:', error);
        alert('Erro ao salvar anúncio');
    }
}

// ========== EXCLUSÃO ==========

// Confirmar deleção
function confirmarDelecao(tipo, id, nome) {
    itemParaDeletar = { tipo, id, nome };
    const modal = document.getElementById('modal-confirmacao');
    document.getElementById('modal-mensagem').textContent = `Tem certeza que deseja deletar "${nome}"?`;
    modal.classList.add('active');
}

// Fechar modal
function fecharModal() {
    const modal = document.getElementById('modal-confirmacao');
    modal.classList.remove('active');
    itemParaDeletar = null;
}

// Deletar item
btnConfirmar.addEventListener('click', async () => {
    if (!itemParaDeletar) return;

    const { tipo, id } = itemParaDeletar;
    const endpoint = tipo === 'noticia' ? 'noticias' : 'anuncios';

    try {
        const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            fecharModal();
            tipo === 'noticia' ? carregarNoticias() : carregarAnuncios();
            alert(`${tipo === 'noticia'  'Notícia' : 'Anúncio'} deletado com sucesso!`);
        } else {
            alert('Erro ao deletar');
        }
    } catch (error) {
        console.error('Erro ao deletar:', error);
        alert('Erro ao deletar');
    }
});

// ========== UTILITÁRIOS ==========

// Formatar data para input datetime-local
function formatarDataTimeLocal(data) {
    const d = new Date(data);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
}
