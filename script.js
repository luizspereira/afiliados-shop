/**
 * Compra Justa - Script de Interatividade e Animação de Preços
 * 
 * Funcionalidades:
 * 1. Animação dinâmica do traço vermelho riscando o preço antigo
 * 2. Troca dinâmica e contagem animada do novo preço com aplicação de cupom extra
 * 3. Simulação global e individual de descontos com feedback visual e acessível
 * 4. Validação e feedback interativo para o formulário de newsletter
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    inicializarAnimacaoRiscado();
    inicializarControlesDePreco();
    inicializarFormularioNewsletter();
});

/**
 * 1. Ativa a animação do traço vermelho riscando o preço antigo
 * Utiliza IntersectionObserver para animar assim que o card fica visível na tela
 */
function inicializarAnimacaoRiscado() {
    const cards = document.querySelectorAll('.produto-card');

    if (!('IntersectionObserver' in window)) {
        // Fallback para navegadores antigos: ativa direto
        document.querySelectorAll('.preco-antigo').forEach(preco => {
            preco.classList.add('riscado-ativo');
        });
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Efeito escalonado (stagger) para cada card
                setTimeout(() => {
                    const precoAntigo = entry.target.querySelector('.preco-antigo');
                    const precoNovo = entry.target.querySelector('.preco-novo');
                    
                    if (precoAntigo) {
                        precoAntigo.classList.add('riscado-ativo');
                    }
                    if (precoNovo) {
                        precoNovo.classList.add('pulso-ativo');
                    }
                }, index * 120);

                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.25
    });

    cards.forEach(card => observer.observe(card));
}

/**
 * 2. Gerencia a troca do preço antigo e novo com animação e cálculo de cupom extra
 */
function inicializarControlesDePreco() {
    const botoesTrocarPreco = document.querySelectorAll('.botao-trocar-preco');
    const botaoGlobal = document.getElementById('btn-animar-todos');

    // Botões individuais de cada produto
    botoesTrocarPreco.forEach(botao => {
        botao.addEventListener('click', (evento) => {
            evento.preventDefault();
            const card = botao.closest('.produto-card');
            alternarPrecoComAnimacao(card);
        });
    });

    // Botão global no painel
    if (botaoGlobal) {
        let cuponsAtivos = false;

        botaoGlobal.addEventListener('click', () => {
            cuponsAtivos = !cuponsAtivos;
            const todosOsCards = document.querySelectorAll('.produto-card');

            todosOsCards.forEach((card, index) => {
                setTimeout(() => {
                    alternarPrecoComAnimacao(card, cuponsAtivos);
                }, index * 100);
            });

            botaoGlobal.innerHTML = cuponsAtivos
                ? '<span>↺</span> Reverter Preços Padrão'
                : '<span>⚡</span> Aplicar Cupom VIP em Todos';
        });
    }
}

/**
 * Executa a troca de preço e a animação do traço riscado
 * @param {HTMLElement} card - Elemento do card do produto
 * @param {boolean} [forcarEstado] - Estado opcional para forçar ativação ou desativação
 */
function alternarPrecoComAnimacao(card, forcarEstado = null) {
    const elPrecoAntigo = card.querySelector('.preco-antigo');
    const elPrecoNovo = card.querySelector('.preco-novo');
    const botaoTroca = card.querySelector('.botao-trocar-preco');
    const tagDesconto = card.querySelector('.tag-desconto');

    if (!elPrecoAntigo || !elPrecoNovo) return;

    // Guarda dados originais caso ainda não existam
    if (!card.dataset.precoAntigoOriginal) {
        card.dataset.precoAntigoOriginal = elPrecoAntigo.textContent.trim();
        card.dataset.precoNovoOriginal = elPrecoNovo.textContent.trim();
        card.dataset.valorOriginal = extrairValorNumerico(elPrecoNovo.textContent);
    }

    const valorOriginal = parseFloat(card.dataset.valorOriginal);
    const estaComCupom = card.classList.contains('com-cupom-ativo');
    const deveAtivar = forcarEstado !== null ? forcarEstado : !estaComCupom;

    // 1. Remove temporariamente o risco para recriar o efeito visual
    elPrecoAntigo.classList.remove('riscado-ativo');

    if (deveAtivar) {
        card.classList.add('com-cupom-ativo');

        // Calcula novo preço com 15% de desconto extra
        const valorComDescontoExtra = valorOriginal * 0.85;
        const textoPrecoAnterior = card.dataset.precoNovoOriginal;

        // Atualiza o texto do preço antigo para mostrar a nova base
        elPrecoAntigo.textContent = textoPrecoAnterior;
        
        // Dispara o redesenho do risco vermelho animado
        requestAnimationFrame(() => {
            setTimeout(() => {
                elPrecoAntigo.classList.add('riscado-ativo');
            }, 50);
        });

        // Contagem animada decrescente para o novo preço
        animarContagemNumerica(elPrecoNovo, valorOriginal, valorComDescontoExtra, 600);

        // Atualiza a tag de desconto e botão
        if (tagDesconto) {
            tagDesconto.textContent = 'CUPOM +15% OFF';
            tagDesconto.style.backgroundColor = '#16a34a';
        }

        if (botaoTroca) {
            botaoTroca.innerHTML = '<span>↺</span> Reverter Valor';
            botaoTroca.setAttribute('aria-pressed', 'true');
        }

        // Insere ou atualiza o badge de cupom ativo
        let badgeCupom = card.querySelector('.badge-cupom');
        if (!badgeCupom) {
            badgeCupom = document.createElement('span');
            badgeCupom.className = 'badge-cupom';
            elPrecoNovo.parentNode.appendChild(badgeCupom);
        }
        badgeCupom.textContent = '✓ Cupom VIP15 aplicado';

    } else {
        card.classList.remove('com-cupom-ativo');

        // Restaura os valores originais
        const valorAtual = extrairValorNumerico(elPrecoNovo.textContent);
        elPrecoAntigo.textContent = card.dataset.precoAntigoOriginal;

        requestAnimationFrame(() => {
            setTimeout(() => {
                elPrecoAntigo.classList.add('riscado-ativo');
            }, 50);
        });

        // Contagem animada crescente de volta ao preço original
        animarContagemNumerica(elPrecoNovo, valorAtual, valorOriginal, 400);

        // Restaura a tag de desconto
        if (tagDesconto && card.dataset.tagOriginal) {
            tagDesconto.textContent = card.dataset.tagOriginal;
            tagDesconto.style.backgroundColor = '';
        }

        if (botaoTroca) {
            botaoTroca.innerHTML = '<span>🏷️</span> Simular Cupom Extra';
            botaoTroca.setAttribute('aria-pressed', 'false');
        }

        const badgeCupom = card.querySelector('.badge-cupom');
        if (badgeCupom) {
            badgeCupom.remove();
        }
    }
}

/**
 * Anima os números do novo preço com efeito fluido (contador de números)
 * @param {HTMLElement} elemento - Elemento que exibe o preço
 * @param {number} valorInicial - Valor de início
 * @param {number} valorFinal - Valor alvo final
 * @param {number} duracao - Duração em milissegundos
 */
function animarContagemNumerica(elemento, valorInicial, valorFinal, duracao) {
    const inicio = performance.now();
    elemento.classList.add('pulso-ativo');

    function atualizar(tempoAtual) {
        const decorrido = tempoAtual - inicio;
        const progresso = Math.min(decorrido / duracao, 1);
        
        // Easing suave (easeOutQuad)
        const fatorSuavizacao = 1 - (1 - progresso) * (1 - progresso);
        const valorAtual = valorInicial + (valorFinal - valorInicial) * fatorSuavizacao;

        elemento.textContent = formatarMoeda(valorAtual);

        if (progresso < 1) {
            requestAnimationFrame(atualizar);
        } else {
            elemento.textContent = formatarMoeda(valorFinal);
            setTimeout(() => {
                elemento.classList.remove('pulso-ativo');
            }, 300);
        }
    }

    requestAnimationFrame(atualizar);
}

/**
 * Converte string no formato "R$ 1.999,90" para número float 1999.90
 * @param {string} textoMoeda 
 * @returns {number}
 */
function extrairValorNumerico(textoMoeda) {
    if (!textoMoeda) return 0;
    const limpo = textoMoeda
        .replace(/[^\d,\.]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    return parseFloat(limpo) || 0;
}

/**
 * Formata número float para moeda em Real Brasileiro (ex: R$ 99,90)
 * @param {number} valor 
 * @returns {string}
 */
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

/**
 * 3. Validação e feedback acessível do formulário de newsletter
 */
function inicializarFormularioNewsletter() {
    const formulario = document.querySelector('.form-newsletter');
    if (!formulario) return;

    formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        
        const inputEmail = formulario.querySelector('input[type="email"]');
        const botaoSubmit = formulario.querySelector('button[type="submit"]');
        let mensagemFeedback = formulario.querySelector('.newsletter-mensagem');

        if (!mensagemFeedback) {
            mensagemFeedback = document.createElement('div');
            mensagemFeedback.className = 'newsletter-mensagem';
            mensagemFeedback.setAttribute('role', 'status');
            mensagemFeedback.setAttribute('aria-live', 'polite');
            formulario.appendChild(mensagemFeedback);
        }

        const email = inputEmail ? inputEmail.value.trim() : '';

        if (!email || !email.includes('@')) {
            mensagemFeedback.className = 'newsletter-mensagem erro';
            mensagemFeedback.textContent = 'Por favor, insira um endereço de e-mail válido.';
            return;
        }

        // Simulação de envio com estado de carregamento
        const textoOriginal = botaoSubmit.textContent;
        botaoSubmit.disabled = true;
        botaoSubmit.textContent = 'Enviando...';
        mensagemFeedback.textContent = '';

        setTimeout(() => {
            botaoSubmit.disabled = false;
            botaoSubmit.textContent = textoOriginal;
            formulario.reset();

            mensagemFeedback.className = 'newsletter-mensagem sucesso';
            mensagemFeedback.textContent = '🎉 Parabéns! Você entrou no grupo VIP de ofertas.';

            setTimeout(() => {
                mensagemFeedback.textContent = '';
            }, 6000);
        }, 800);
    });
}

