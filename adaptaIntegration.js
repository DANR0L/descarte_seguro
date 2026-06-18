// Configuração de integração com a Adapta ONE
const ADAPTA_CONFIG = {
    skillId: "019ed83c-00bc-7790-b1ab-f301b8fb3111",
    // Usando a Vercel Serverless Function como proxy para evitar erros de CORS
    api_base_url: "/api/adapta-one/ghs-classify"
};

window.renderSafetyAlert = function(data) {
    const safetyAlert = data?.safety_alert ?? null;
    if (!safetyAlert) return;

    const existing = document.getElementById('adapta-safety-alert');
    if (existing) existing.remove();

    const alert = document.createElement('div');
    alert.id = 'adapta-safety-alert';
    alert.setAttribute('role', 'alert');
    alert.setAttribute('aria-live', 'assertive');
    alert.textContent = String(safetyAlert);

    alert.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 2147483647;
        background: #dc2626;
        color: #ffffff;
        font-weight: 800;
        font-size: 1.25rem;
        text-align: center;
        padding: 1rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        animation: adapta-safety-blink 1s infinite;
        pointer-events: auto;
    `;

    if (!document.getElementById('adapta-safety-styles')) {
        const style = document.createElement('style');
        style.id = 'adapta-safety-styles';
        style.textContent = `
            @keyframes adapta-safety-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.35; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.prepend(alert);
};

window.fetchGHSClassification = async function(mixtureArray) {
    // Preparar dados simplificados para a IA
    const contentPayload = mixtureArray.map(item => ({
        nome: item.produto.Common_Name_PT || item.produto.Common_Name,
        nome_iupac: item.produto.IUPAC_Name || "",
        cas: item.produto.CAS_Number || "N/D",
        percentual: item.percentage
    }));

    const body = {
        skill_id: ADAPTA_CONFIG.skillId,
        session_id: "user_session_" + Date.now(),
        content: contentPayload
    };

    console.log("[Adapta ONE] Enviando Payload para a IA:", JSON.stringify(body, null, 2));

    try {
        const response = await fetch(ADAPTA_CONFIG.api_base_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        // Log da resposta bruta para diagnóstico
        console.log('[Adapta ONE] Raw response from Adapta ONE:', response);

        if (!response.ok) {
            throw new Error(`Adapta ONE request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[Adapta ONE] Resposta estruturada recebida (JSON):", data);

        // Renderiza o banner vermelho fixo globalmente
        window.renderSafetyAlert(data);

        // Verificação se a resposta veio vazia ou em formato incorreto
        if (!data || Object.keys(data).length === 0) {
            console.error("[Adapta ONE] A IA retornou um objeto vazio.");
            alert("Aviso: A resposta da IA veio vazia. Verifique a configuração da Skill.");
            return null; // Interrompe o processamento na interface
        }

        return data;

    } catch (e) {
        console.error("[Adapta ONE] Erro de conexão com a IA (Normal se rodando localmente via file://):", e);
        
        // Retorna null silenciosamente.
        // Se estivermos rodando localmente (file://), a chamada de API falhará com erro de CORS/Network,
        // mas não queremos que o usuário receba popups de erro toda vez que digitar algo.
        // app.js lidará com o null ignorando o Merge e mantendo os dados originais do PubChem.
        return null;
    }
};
