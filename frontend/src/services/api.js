// src/services/api.js (Versão Corrigida para Endpoint de Documentos)

// 1. Definir a URL base da API em um lugar só

const API_BASE_URL = 'https://solarmsa.onrender.com';

// Helper function para tratar erros de API
async function handleResponse(response) {
  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({ detail: `Erro ${response.status}: ${response.statusText}` }));
    console.error("Erro na API:", errorData);
    throw new Error(errorData.detail || `Erro ${response.status}`);
  }
  if (response.status === 204) {
    return true; // Indica sucesso
  }
  return response.json();
}


// --- AUTENTICAÇÃO ---
export async function loginUser(credentials) {
  const API_URL = `${API_BASE_URL}/token`;
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(credentials).toString(),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Este usuário está inativo e não pode fazer login.');
      }
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || 'Falha na autenticação. Verifique seu usuário e senha.');
    }
    return await response.json();

  } catch (error) {
    console.error('Erro ao fazer login:', error.message);
    throw error;
  }
}


// --- GERENCIAMENTO DE USUÁRIOS ---

export async function getUsers(token, status = 'ativos') {
  const response = await fetch(`${API_BASE_URL}/users/?status=${status}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
}

export async function createUser(userData, token) {
  const response = await fetch(`${API_BASE_URL}/users/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
}

export async function getUserById(userId, token) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
}

export async function updateUser(userId, userData, token) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
}

export async function deleteUser(userId, token) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleResponse(response);
}

export const recoverUser = async (userId, token) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/recover`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleResponse(response);
};


// --- GERENCIAMENTO DE CONSUMIDORES ---

export async function getConsumidores(token, status = 'ativos', usinaId = null) {
    let url = `${API_BASE_URL}/consumidores/?status=${status}`; 
    if (usinaId) {
        url += `&usina_id=${usinaId}`;
    }
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
}

export async function getConsumidorById(consumidorId, token) {
  const response = await fetch(`${API_BASE_URL}/consumidores/${consumidorId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
}

export async function createConsumidor(consumidorData, token) {
  const response = await fetch(`${API_BASE_URL}/consumidores/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(consumidorData),
  });
  return handleResponse(response);
}

export async function updateConsumidor(consumidorId, consumidorData, token) {
  const response = await fetch(`${API_BASE_URL}/consumidores/${consumidorId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(consumidorData),
  });
  return handleResponse(response);
}

export async function deleteConsumidor(consumidorId, token) {
    const response = await fetch(`${API_BASE_URL}/consumidores/${consumidorId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
}

export async function recoverConsumidor(consumidorId, token) {
    const response = await fetch(`${API_BASE_URL}/consumidores/${consumidorId}/recover`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
}


// --- GERENCIAMENTO DE USINAS ---

export const getUsinas = async (token, filter = 'ativas') => {
  const response = await fetch(`${API_BASE_URL}/usinas/?status=${filter}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

export const recoverUsina = async (usinaId, token) => {
  const response = await fetch(`${API_BASE_URL}/usinas/${usinaId}/recover`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleResponse(response);
};

export async function getUsinaById(usinaId, token) {
  const response = await fetch(`${API_BASE_URL}/usinas/${usinaId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
}

export async function createUsina(usinaData, token) {
  const response = await fetch(`${API_BASE_URL}/usinas/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: usinaData,
  });
  return handleResponse(response);
}

export async function updateUsina(usinaId, usinaData, token) {
  const response = await fetch(`${API_BASE_URL}/usinas/${usinaId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: usinaData,
  });
  return handleResponse(response);
}

export const deleteUsina = async (usinaId, token) => {
  const response = await fetch(`${API_BASE_URL}/usinas/${usinaId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleResponse(response);
};

export async function deleteAnexoUsina(usinaId, anexoId, token) {
  const response = await fetch(`${API_BASE_URL}/usinas/${usinaId}/anexos/${anexoId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleResponse(response);
}


// =================================================================================
// --- FUNÇÕES DE FLUXO E DOCUMENTOS (ADICIONADAS PARA O DocumentosFormPage.jsx) ---
// =================================================================================

// FUNÇÃO 1: Upload e Extração de Fatura
// Endpoint: POST /consumidores/{consumidor_id}/fatura
export async function uploadFaturaConsumidor(consumidorId, formData, token) {
  const response = await fetch(`${API_BASE_URL}/consumidores/${consumidorId}/fatura`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData, 
  });

  if (!response.ok) {
    // Tenta pegar mais detalhes do erro do backend
    const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido ao processar a resposta.' }));
    throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
  }

  return response.json();
}

// FUNÇÃO 2: Calcular e Gerar Relatório
// Endpoint: POST /calculo/{fatura_id}/gerar-relatorio
export async function calcularGerarRelatorio(faturaId, token) {
  const API_URL = `${API_BASE_URL}/calculo/${faturaId}/gerar-relatorio`; 

  const response = await fetch(API_URL, {
    method: 'POST', 
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json', 
    },
    body: JSON.stringify({}) // Corpo vazio para POST de ação
  });
  
  return handleResponse(response); 
}

// FUNÇÃO 3: Criação de Boleto (Com metadados do formulário)
// Endpoint: POST /consumidores/{consumidor_id}/boleto
export async function createBoleto(consumidorId, dataToSend, token) {
  const API_URL = `${API_BASE_URL}/consumidores/${consumidorId}/boleto`;
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // FormData é usado aqui
    },
    body: dataToSend, // dataToSend é um objeto FormData (com arquivo e campos Form)
  });
  
  return handleResponse(response);
}

// FUNÇÃO 4: Criação de Relatório (Upload Manual - Se necessário)
// Endpoint: POST /consumidores/{consumidor_id}/relatorio
export async function createRelatorio(consumidorId, dataToSend, token) {
  // Assumimos que o endpoint espera FormData (com arquivo e campos Form)
  const API_URL = `${API_BASE_URL}/consumidores/${consumidorId}/relatorio`; 
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: dataToSend, // Assumimos FormData com arquivo e campos Form
  });
  
  return handleResponse(response);
}


// --- Outras Funções (Exemplo) ---
export async function getDashboardStats(token) {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
}

// Esta função chama o endpoint específico para buscar consumidores de UMA usina.
export async function getConsumidoresByUsinaId(usinaId, token) {
  const response = await fetch(`${API_BASE_URL}/usinas/${usinaId}/consumidores`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(errorData.detail || 'Falha ao buscar consumidores da usina.');
  }

  return response.json();
}
// =========================================================================

// CORREÇÃO CRÍTICA FINAL: Ajuste do endpoint para ser compatível com o backend (consumidores.py)
export const getConsumidorMonthlyDocuments = async (consumidorId, token) => {
    // CORRIGIDO: O endpoint no backend (consumidores.py) é /consumidores/{consumidorId}/documentos
    const response = await fetch(`${API_BASE_URL}/consumidores/${consumidorId}/documentos`, { 
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    // Se o backend retorna 404, tratamos como lista vazia, o que é comum para "nenhum item encontrado"
    if (response.status === 404) return { faturas: [], boletos: [], relatorios: [] }; 
    if (!response.ok) {
        const errorDetail = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(`Falha ao buscar documentos mensais: ${errorDetail.detail}`);
    }
    
    return response.json();
};