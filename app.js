

const ghsSvgs = {
    ghs02_inflamavel: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="50" width="50" height="50" fill="white" stroke="#E3000F" stroke-width="6" transform="rotate(-45 50 50)" stroke-linejoin="round"/><path d="M50 20 Q40 35 45 50 Q30 55 45 75 Q60 75 60 60 Q70 55 55 40 Q65 45 50 20 Z" fill="black"/><rect x="30" y="77" width="40" height="3" fill="black"/></svg>`,
    ghs01_explosivo: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="50" width="50" height="50" fill="white" stroke="#E3000F" stroke-width="6" transform="rotate(-45 50 50)" stroke-linejoin="round"/><circle cx="50" cy="55" r="14" fill="black"/><path d="M58 45 Q65 35 70 30" fill="none" stroke="black" stroke-width="3"/><path d="M25 35 L35 45 M75 65 L65 55 M25 75 L35 65" stroke="black" stroke-width="4"/><polygon points="70,25 75,30 65,35" fill="black"/></svg>`,
    ghs03_oxidante: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="50" width="50" height="50" fill="white" stroke="#E3000F" stroke-width="6" transform="rotate(-45 50 50)" stroke-linejoin="round"/><circle cx="50" cy="65" r="10" fill="none" stroke="black" stroke-width="4"/><path d="M50 25 Q40 40 40 60 L60 60 Q60 40 50 25 Z" fill="black"/><rect x="30" y="78" width="40" height="2" fill="black"/></svg>`,
    ghs05_corrosivo: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="50" width="50" height="50" fill="white" stroke="#E3000F" stroke-width="6" transform="rotate(-45 50 50)" stroke-linejoin="round"/><rect x="25" y="70" width="50" height="4" fill="black"/><path d="M35 35 L35 60 L45 60 L45 35 Z" fill="black"/><path d="M55 35 L55 60 L65 60 L65 35 Z" fill="black"/><circle cx="40" cy="65" r="2" fill="white"/><circle cx="60" cy="65" r="2" fill="white"/></svg>`,
    ghs06_toxico: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="50" width="50" height="50" fill="white" stroke="#E3000F" stroke-width="6" transform="rotate(-45 50 50)" stroke-linejoin="round"/><circle cx="50" cy="40" r="12" fill="black"/><rect x="42" y="50" width="16" height="6" fill="black"/><path d="M30 30 L40 40 M70 30 L60 40 M30 70 L40 60 M70 70 L60 60" stroke="black" stroke-width="6" stroke-linecap="round"/></svg>`,
    ghs08_saude: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="50" width="50" height="50" fill="white" stroke="#E3000F" stroke-width="6" transform="rotate(-45 50 50)" stroke-linejoin="round"/><path d="M50 20 Q40 20 40 30 L45 35 L40 75 L60 75 L55 35 L60 30 Q60 20 50 20 Z" fill="black"/><path d="M50 40 L45 50 L55 50 Z M50 60 L45 50 L55 50 Z" fill="white"/></svg>`
};

const SUPABASE_URL = 'https://rvbfockxvjahkzaeizie.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2YmZvY2t4dmphaGt6YWVpemllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzOTkxMjcsImV4cCI6MjA5Njk3NTEyN30.OquFrwdIiyjXIE6vwhpm2mVxyviQzSoiQbFFz0rAhsc';

let supabaseClient;
let myProductsCache = [];
let currentMyProductId = null;
try {
    if (!window.supabase) {
        alert("ERRO CRÍTICO: O script do Supabase não foi carregado pela internet! Verifique sua conexão ou se há bloqueios no navegador.");
    } else {
        // Criando um storage na memória caso o navegador bloqueie o localStorage (ex: no file:///)
        const memoryStorage = {
            getItem: (key) => memoryStorage[key] || null,
            setItem: (key, value) => { memoryStorage[key] = value; },
            removeItem: (key) => { delete memoryStorage[key]; }
        };

        let storageToUse = memoryStorage;
        try {
            window.localStorage.setItem('teste_seguranca', '1');
            window.localStorage.removeItem('teste_seguranca');
            storageToUse = window.localStorage;
        } catch (e) {
            console.warn("LocalStorage bloqueado (provavelmente por estar rodando via file://). Usando Memory Storage.");
        }

        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                storage: storageToUse,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
    }
} catch (e) {
    alert("ERRO ao inicializar Supabase: " + e.message);
}

let currentUser = null;

// --- Módulo de Autenticação ---
async function checkSession() {
    if (!supabaseClient) return; // Proteção caso o script CDN não carregue
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (data && data.session) {
            currentUser = data.session.user;
            document.getElementById('authModal').classList.add('hidden');
            document.getElementById('userDisplay').textContent = currentUser.email;
            document.getElementById('logoutBtn').classList.remove('hidden');
            
            const reportsBtn = document.getElementById('reportsBtn');
            if(reportsBtn) reportsBtn.classList.remove('hidden');

            const loadMixtureBtn = document.getElementById('loadMixtureBtn');
            if(loadMixtureBtn) {
                loadMixtureBtn.style.display = 'flex';
                loadMixtureBtn.classList.remove('hidden');
            }

            // Força o cursor a piscar no campo de busca logo após o modal sumir
            setTimeout(() => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.focus();
            }, 100);
            
            // Carrega o perfil da empresa vinculado à conta
            loadUserProfile();
              await loadMyProducts();
        } else {
            document.getElementById('authModal').classList.remove('hidden');
            document.getElementById('logoutBtn').classList.add('hidden');
            const reportsBtn = document.getElementById('reportsBtn');
            if(reportsBtn) reportsBtn.classList.add('hidden');

            const loadMixtureBtn = document.getElementById('loadMixtureBtn');
            if(loadMixtureBtn) {
                loadMixtureBtn.style.display = 'none';
                loadMixtureBtn.classList.add('hidden');
            }

            document.getElementById('userDisplay').textContent = '';
        }
    } catch (e) {
        console.error("Erro no checkSession:", e);
    }
}


async function loadMyProducts() {
    if (!currentUser || !supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('meus_produtos').select('*').eq('user_id', currentUser.id);
        if (data) {
            myProductsCache = data.map(d => ({
                id_supabase: d.id,
                nome: d.nome,
                tipo: d.tipo,
                ghs_classes: d.ghs_classes,
                estado_fisico: d.estado_fisico,
                incompatibilidade: d.incompatibilidade,
                observacoes: d.observacoes,
                onu_number: d.onu_number
            }));
        }
    } catch (e) {
        console.error('Erro loadMyProducts', e);
    }
}

async function loadUserProfile() {
    if (!currentUser || !supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('perfis_empresa')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
            
        if (data) {
            document.getElementById('geradorEmpresa').value = data.empresa || '';
            document.getElementById('geradorEndereco').value = data.endereco || '';
            document.getElementById('geradorResp').value = data.responsavel || '';
            document.getElementById('geradorTel').value = data.telefone || '';
        }
    } catch (e) {
        console.warn("Nenhum perfil de empresa salvo na nuvem ainda.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    
    const authForm = document.getElementById('authForm');
    const authErrorMsg = document.getElementById('authErrorMsg');

    document.getElementById('loginBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        if (!supabaseClient) { alert("Supabase não carregado!"); return; }
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        authErrorMsg.classList.add('hidden');
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            authErrorMsg.textContent = "Erro: " + error.message;
            authErrorMsg.classList.remove('hidden');
        } else {
            checkSession();
        }
    });

    document.getElementById('registerBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!supabaseClient) { alert("Supabase não carregado!"); return; }
        
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        authErrorMsg.classList.add('hidden');
        
        if(!email || !password) {
            authErrorMsg.textContent = "Por favor, preencha E-mail e Senha para criar a conta.";
            authErrorMsg.style.color = "var(--danger)";
            authErrorMsg.classList.remove('hidden');
            return;
        }
        
        authErrorMsg.textContent = "Criando conta, aguarde...";
        authErrorMsg.style.color = "var(--text-primary)";
        authErrorMsg.classList.remove('hidden');

        try {
            const { data, error } = await supabaseClient.auth.signUp({ email, password });
            if (error) {
                authErrorMsg.style.color = "var(--danger)";
                authErrorMsg.textContent = "Erro: " + error.message;
            } else {
                authErrorMsg.style.color = "var(--accent)";
                authErrorMsg.textContent = "Conta criada com sucesso! Clique em 'Entrar' para acessar.";
            }
        } catch (err) {
            authErrorMsg.style.color = "var(--danger)";
            authErrorMsg.textContent = "Erro inesperado: " + err.message;
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        currentUser = null;
        checkSession();
    });

    // --- Lógica de Recuperação de Senha (OTP) ---
    const forgotPasswordLnk = document.getElementById('forgotPasswordLnk');
    const otpRequestForm = document.getElementById('otpRequestForm');
    const otpVerifyForm = document.getElementById('otpVerifyForm');
    const backToLoginBtn1 = document.getElementById('backToLoginBtn1');
    const backToLoginBtn2 = document.getElementById('backToLoginBtn2');

    // Mudar para tela de solicitar e-mail
    if(forgotPasswordLnk) {
        forgotPasswordLnk.addEventListener('click', (e) => {
            e.preventDefault();
            authForm.classList.add('hidden');
            otpRequestForm.classList.remove('hidden');
            const authMail = document.getElementById('authEmail').value;
            const otpMailInput = document.getElementById('otpEmail');
            otpMailInput.value = authMail;
            setTimeout(() => { otpMailInput.focus(); }, 100);
        });
    }

    // Voltar para o Login
    const resetForms = () => {
        otpRequestForm.classList.add('hidden');
        otpVerifyForm.classList.add('hidden');
        authForm.classList.remove('hidden');
        document.getElementById('otpReqErrorMsg').classList.add('hidden');
        document.getElementById('otpVerErrorMsg').classList.add('hidden');
        setTimeout(() => { document.getElementById('authEmail').focus(); }, 100);
    };
    if(backToLoginBtn1) backToLoginBtn1.addEventListener('click', resetForms);
    if(backToLoginBtn2) backToLoginBtn2.addEventListener('click', resetForms);

    // Enviar Link de Recuperação
    document.getElementById('sendOtpBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('otpEmail').value;
        const errMsg = document.getElementById('otpReqErrorMsg');
        if(!email) return;

        errMsg.classList.remove('hidden');
        errMsg.style.color = "var(--text-primary)";
        errMsg.textContent = "Enviando link, aguarde...";

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });

        if (error) {
            errMsg.style.color = "var(--danger)";
            errMsg.textContent = "Erro: " + error.message;
        } else {
            errMsg.style.color = "var(--accent)";
            errMsg.textContent = "Link de recuperação enviado! Verifique seu e-mail e clique no link.";
        }
    });

    // Escutar retorno do link de recuperação
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            document.getElementById('authModal').classList.remove('hidden');
            authForm.classList.add('hidden');
            otpRequestForm.classList.add('hidden');
            otpVerifyForm.classList.remove('hidden');
        }
    });

    // Salvar Nova Senha
    document.getElementById('verifyOtpBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        const errMsg = document.getElementById('otpVerErrorMsg');

        if(!newPassword || !confirmNewPassword) return;

        errMsg.classList.remove('hidden');

        if(newPassword.length < 6) {
            errMsg.style.color = "var(--danger)";
            errMsg.textContent = "A senha deve ter pelo menos 6 caracteres.";
            return;
        }

        if(newPassword !== confirmNewPassword) {
            errMsg.style.color = "var(--danger)";
            errMsg.textContent = "As senhas não coincidem.";
            return;
        }

        errMsg.style.color = "var(--text-primary)";
        errMsg.textContent = "Atualizando senha...";
        const { error: updateError } = await supabaseClient.auth.updateUser({ password: newPassword });

        if (updateError) {
            errMsg.style.color = "var(--danger)";
            errMsg.textContent = "Erro ao salvar nova senha: " + updateError.message;
        } else {
            alert("Sua senha foi redefinida com sucesso!");
            resetForms();
            checkSession();
        }
    });
});

// --- Módulo de Nuvem ---
async function saveChemicalToCloud(produto) {
    if (!currentUser) return; // Só salva se logado
    
    const payload = {
        cas_number: produto.CAS_Number,
        common_name: produto.Common_Name,
        iupac_name: produto.IUPAC_Name,
        un_number: produto.UN_Number,
        risk_class: produto.Risk_Class,
        pictograms_json: JSON.stringify(produto.Pictograms_List),
        phrases_json: JSON.stringify({ H: produto.H_Phrases, P: produto.P_Phrases })
    };

    if (produto.isPubChem) {
        payload.is_verified = false;
    }

    const { data, error } = await supabaseClient
        .from('produtos_quimicos')
        .upsert(payload, { onConflict: 'cas_number, common_name' });
        
    if (error) console.error("Erro ao salvar produto na nuvem:", error);
}

// Substituir a chamada "sincronizarComNuvem" por "saveChemicalToCloud" lá embaixo se existir

async function saveLabelHistory() {
    if (!currentUser) return;
    
    const empresa = document.getElementById('geradorEmpresa').value || 'Não informada';
    const volume = document.getElementById('volMaximo').value || 'Não informado';
    const dataAcumulo = document.getElementById('dataDescarte').value || new Date().toISOString().split('T')[0];
    const produtoNome = document.getElementById('pdNome').textContent;
    
    const { error } = await supabaseClient
        .from('historico_descartes')
        .insert([{
            user_id: currentUser.id,
            empresa: empresa,
            volume: volume,
            data_acumulo: dataAcumulo,
            produto_nome: produtoNome
        }]);
        
    if (error) console.error("Erro ao salvar histórico de etiqueta:", error);
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const productDetails = document.getElementById('productDetails');
    const mixtureSection = document.getElementById('mixtureSection');
    const mixtureList = document.getElementById('mixtureList');
    const mixtureError = document.getElementById('mixtureError');
    let currentMixture = [];
    
    document.getElementById('complianceBtn').addEventListener('click', () => {
        document.getElementById('complianceModal').classList.remove('hidden');
    });
    document.getElementById('closeComplianceBtn').addEventListener('click', () => {
        document.getElementById('complianceModal').classList.add('hidden');
    });

    const incompatibilityMatrix = [
        { groupA: ["Ácido", "Acid"], groupB: ["Inflamável", "Solvent", "Acetona"], error: "Incêndio / Explosão" },
        { groupA: ["Ácido", "Acid"], groupB: ["Base", "Hidróxido", "Soda"], error: "Reação Exotérmica Violenta" },
        { groupA: ["Cianeto", "Cyanide"], groupB: ["Ácido", "Acid"], error: "Liberação de Gás Cianídrico (Mortal)" },
        { groupA: ["Hipoclorito", "Cloro", "Chlorine"], groupB: ["Ácido", "Acid"], error: "Liberação de Gás Cloro (Tóxico)" },
        { groupA: ["Oxidante", "Oxidizing"], groupB: ["Orgânico", "Organic"], error: "Ignição Espontânea" }
    ];

    function checkIncompatibility() {
        let isBlocked = false;
        let errorMessage = "";
        const allNames = currentMixture.map(r => r.produto.Common_Name.toLowerCase() + " " + r.produto.IUPAC_Name.toLowerCase() + " " + (r.produto.Risk_Class || "").toLowerCase());
        
        for (const rule of incompatibilityMatrix) {
            let hasA = allNames.some(name => rule.groupA.some(k => name.includes(k.toLowerCase())));
            let hasB = allNames.some(name => rule.groupB.some(k => name.includes(k.toLowerCase())));
            if (hasA && hasB) {
                isBlocked = true;
                errorMessage = "ERRO DE SEGURANÇA: Mistura incompatível detectada (" + rule.error + "). Use recipientes separados.";
                break;
            }
        }
        
        if (isBlocked) {
            mixtureError.textContent = errorMessage;
            mixtureError.classList.remove('hidden');
            document.getElementById('printBtn').disabled = true;
            document.getElementById('printBtn').style.opacity = '0.5';
        } else {
            mixtureError.classList.add('hidden');
            document.getElementById('printBtn').disabled = false;
            document.getElementById('printBtn').style.opacity = '1';
        }
    }

    // Fallback inicial para localStorage (será sobrescrito pelo Supabase se houver dados na nuvem)
    if(localStorage.getItem('gerador_empresa')) document.getElementById('geradorEmpresa').value = localStorage.getItem('gerador_empresa');
    if(localStorage.getItem('gerador_endereco')) document.getElementById('geradorEndereco').value = localStorage.getItem('gerador_endereco');
    if(localStorage.getItem('gerador_resp')) document.getElementById('geradorResp').value = localStorage.getItem('gerador_resp');
    if(localStorage.getItem('gerador_tel')) document.getElementById('geradorTel').value = localStorage.getItem('gerador_tel');

    document.getElementById('saveDataBtn').addEventListener('click', async () => {
        const btn = document.getElementById('saveDataBtn');
        const originalText = btn.textContent;
        btn.textContent = "Salvando...";
        btn.disabled = true;

        const empresa = document.getElementById('geradorEmpresa').value;
        const endereco = document.getElementById('geradorEndereco').value;
        const resp = document.getElementById('geradorResp').value;
        const tel = document.getElementById('geradorTel').value;

        // Salva na nuvem
        if (currentUser && supabaseClient) {
            const { error } = await supabaseClient
                .from('perfis_empresa')
                .upsert({
                    user_id: currentUser.id,
                    empresa: empresa,
                    endereco: endereco,
                    responsavel: resp,
                    telefone: tel,
                    updated_at: new Date()
                });
            
            if (error) {
                console.error("Erro ao salvar perfil:", error);
                alert("Erro ao salvar na nuvem, mas guardaremos no seu navegador.");
            }
        }

        // Mantém backup local no navegador
        localStorage.setItem('gerador_empresa', empresa);
        localStorage.setItem('gerador_endereco', endereco);
        localStorage.setItem('gerador_resp', resp);
        localStorage.setItem('gerador_tel', tel);
        
        btn.textContent = originalText;
        btn.disabled = false;
        alert('Dados da empresa salvos na sua conta com sucesso!');
    });

    const allGhs = [
        { id: 'ghs01_explosivo', img: 'img/ghs01.png', label: 'EXPLOSIVO' },
        { id: 'ghs02_inflamavel', img: 'img/ghs02.png', label: 'INFLAMÁVEL' },
        { id: 'ghs03_oxidante', img: 'img/ghs03.png', label: 'OXIDANTE' },
        { id: 'ghs04_gas', img: 'img/ghs04.png', label: 'GÁS SOB PRESSÃO' },
        { id: 'ghs05_corrosivo', img: 'img/ghs05.png', label: 'CORROSIVO' },
        { id: 'ghs06_toxico', img: 'img/ghs06.png', label: 'TÓXICO' },
        { id: 'ghs07_irritante', img: 'img/ghs07.png', label: 'IRRITANTE/NOCIVO' },
        { id: 'ghs08_saude', img: 'img/ghs08.png', label: 'PERIGO À SAÚDE' },
        { id: 'ghs09_meioambiente', img: 'img/ghs09.png', label: 'MEIO AMBIENTE' }
    ];

    // Dicionário Básico de Frases P e H comuns para Padronização
const dictPhrases = {
    // Frases H - Físicos
    "H200": "H200: Explosivo instável.", "H201": "H201: Explosivo; perigo de explosão em massa.", "H202": "H202: Explosivo; perigo de projeção.", "H203": "H203: Explosivo; perigo de incêndio, sopro ou projeção.", "H204": "H204: Perigo de incêndio ou projeção.", "H205": "H205: Perigo de explosão em massa em caso de incêndio.", "H220": "H220: Gás extremamente inflamável.", "H221": "H221: Gás inflamável.", "H222": "H222: Aerossol extremamente inflamável.", "H223": "H223: Aerossol inflamável.", "H224": "H224: Líquido e vapor extremamente inflamáveis.", "H225": "H225: Líquido e vapor altamente inflamáveis.", "H226": "H226: Líquido e vapor inflamáveis.", "H227": "H227: Líquido combustível.", "H228": "H228: Sólido inflamável.", "H229": "H229: Recipiente sob pressão: risco de explosão sob a ação do calor.", "H230": "H230: Pode reagir explosivamente mesmo na ausência de ar.", "H231": "H231: Pode reagir explosivamente mesmo na ausência de ar a pressão e/ou temperatura elevadas.", "H240": "H240: Risco de explosão sob a ação do calor.", "H241": "H241: Risco de incêndio ou explosão sob a ação do calor.", "H242": "H242: Risco de incêndio sob a ação do calor.", "H250": "H250: Risco de incêndio espontâneo em contato com o ar.", "H251": "H251: Auto-aquecimento: risco de incêndio.", "H252": "H252: Auto-aquecimento em grandes quantidades: risco de incêndio.", "H260": "H260: Em contato com a água libera gases inflamáveis que podem inflamar-se espontaneamente.", "H261": "H261: Em contato com a água libera gases inflamáveis.", "H270": "H270: Pode provocar ou agravar incêndios; comburente.", "H271": "H271: Pode provocar incêndio ou explosão; muito comburente.", "H272": "H272: Pode agravar incêndios; comburente.", "H280": "H280: Contém gás sob pressão; pode explodir sob ação do calor.", "H281": "H281: Contém gás refrigerado; pode provocar queimaduras ou lesões criogênicas.", "H290": "H290: Pode ser corrosivo para os metais.",
    // Frases H - Saúde
    "H300": "H300: Fatal se ingerido.", "H301": "H301: Tóxico se ingerido.", "H302": "H302: Nocivo se ingerido.", "H303": "H303: Pode ser nocivo se ingerido.", "H304": "H304: Pode ser fatal se ingerido e penetrar nas vias respiratórias.", "H305": "H305: Pode ser nocivo se ingerido e penetrar nas vias respiratórias.", "H310": "H310: Fatal em contato com a pele.", "H311": "H311: Tóxico em contato com a pele.", "H312": "H312: Nocivo em contato com a pele.", "H313": "H313: Pode ser nocivo em contato com a pele.", "H314": "H314: Provoca queimadura severa à pele e dano ocular.", "H315": "H315: Provoca irritação à pele.", "H316": "H316: Provoca irritação moderada à pele.", "H317": "H317: Pode provocar reações alérgicas na pele.", "H318": "H318: Provoca lesões oculares graves.", "H319": "H319: Provoca irritação ocular grave.", "H320": "H320: Provoca irritação ocular.", "H330": "H330: Fatal se inalado.", "H331": "H331: Tóxico se inalado.", "H332": "H332: Nocivo se inalado.", "H333": "H333: Pode ser nocivo se inalado.", "H334": "H334: Quando inalado, pode provocar sintomas de alergia, asma ou dificuldade respiratória.", "H335": "H335: Pode provocar irritação das vias respiratórias.", "H336": "H336: Pode provocar sonolência ou vertigem.", "H340": "H340: Pode provocar defeitos genéticos.", "H341": "H341: Suspeito de provocar defeitos genéticos.", "H350": "H350: Pode provocar câncer.", "H351": "H351: Suspeito de provocar câncer.", "H360": "H360: Pode prejudicar a fertilidade ou o feto.", "H361": "H361: Suspeito de prejudicar a fertilidade ou o feto.", "H362": "H362: Pode ser nocivo para as crianças alimentadas com leite materno.", "H370": "H370: Provoca danos aos órgãos.", "H371": "H371: Pode provocar danos aos órgãos.", "H372": "H372: Provoca danos aos órgãos por exposição repetida ou prolongada.", "H373": "H373: Pode provocar danos aos órgãos por exposição repetida ou prolongada.",
    // Frases H - Meio Ambiente
    "H400": "H400: Muito tóxico para a vida aquática.", "H401": "H401: Tóxico para a vida aquática.", "H402": "H402: Nocivo para a vida aquática.", "H410": "H410: Muito tóxico para a vida aquática com efeitos prolongados.", "H411": "H411: Tóxico para a vida aquática com efeitos prolongados.", "H412": "H412: Nocivo para a vida aquática com efeitos prolongados.", "H413": "H413: Pode provocar efeitos nocivos prolongados para a vida aquática.", "H420": "H420: Prejudica a saúde pública e o meio ambiente por destruir o ozônio.",
    // Frases P - Gerais e Prevenção
    "P101": "P101: Se for necessário consultar um médico, tenha em mãos a embalagem ou o rótulo.", "P102": "P102: Mantenha fora do alcance das crianças.", "P103": "P103: Leia o rótulo antes de utilizar o produto.", "P201": "P201: Obtenha instruções específicas antes da utilização.", "P202": "P202: Não manuseie o produto antes de ter lido e compreendido todas as precauções.", "P203": "P203: Obtenha, leia e siga todas as instruções de segurança antes de usar.", "P210": "P210: Mantenha afastado do calor, faísca, chama aberta e superfícies quentes. Não fume.", "P211": "P211: Não pulverize sobre chama aberta ou outra fonte de ignição.", "P212": "P212: Evite o aquecimento em ambiente confinado ou com redução de flegmatizante.", "P220": "P220: Mantenha afastado de roupa e materiais combustíveis.", "P222": "P222: Não deixe em contato com o ar.", "P223": "P223: Evite o contato com a água.", "P230": "P230: Mantenha úmido.", "P231": "P231: Manuseie e armazene o conteúdo sob gás inerte.", "P232": "P232: Proteja da umidade.", "P233": "P233: Mantenha o recipiente hermeticamente fechado.", "P234": "P234: Conserve somente no recipiente original.", "P235": "P235: Mantenha em local fresco.", "P240": "P240: Aterre o recipiente e o equipamento receptor durante transferências.", "P241": "P241: Utilize equipamento elétrico/de ventilação/de iluminação à prova de explosão.", "P242": "P242: Utilize apenas ferramentas antifaiscantes.", "P243": "P243: Evite o acúmulo de cargas eletrostáticas.", "P244": "P244: Mantenha as válvulas e as conexões isentas de óleo e graxa.", "P250": "P250: Evite abrasão/choque/fricção.", "P251": "P251: Não fure ou queime, mesmo após o uso.", "P260": "P260: Não inale as poeiras, fumos, gases, névoas, vapores e aerossóis.", "P261": "P261: Evite inalar as poeiras, fumos, gases, vapores e aerossóis.", "P262": "P262: Evite o contato com os olhos, a pele ou a roupa.", "P263": "P263: Evite o contato durante a gravidez/amamentação.", "P264": "P264: Lave cuidadosamente após o manuseio.", "P270": "P270: Não coma, beba ou fume durante a utilização deste produto.", "P271": "P271: Utilize apenas ao ar livre ou em locais bem ventilados.", "P272": "P272: A roupa de trabalho contaminada não pode sair do local de trabalho.", "P273": "P273: Evite a liberação para o meio ambiente.", "P280": "P280: Use luvas, roupa e proteção ocular/facial.", "P282": "P282: Use luvas com isolamento térmico e proteção ocular/facial.", "P283": "P283: Use roupa resistente ao fogo/retardante de chamas.", "P284": "P284: Use equipamento de proteção respiratória.",
    // Frases P - Resposta e Primeiros Socorros
    "P301": "P301: EM CASO DE INGESTÃO:", "P302": "P302: EM CASO DE CONTATO COM A PELE:", "P303": "P303: EM CASO DE CONTATO COM A PELE (ou o cabelo):", "P304": "P304: EM CASO DE INALAÇÃO:", "P305": "P305: EM CASO DE CONTATO COM OS OLHOS:", "P306": "P306: EM CASO DE CONTATO COM A ROUPA:", "P308": "P308: EM CASO DE exposição ou suspeita de exposição:", "P310": "P310: Contate imediatamente um CENTRO DE TOXICOLOGIA ou médico.", "P311": "P311: Contate um CENTRO DE INFORMAÇÃO TOXICOLÓGICA ou um médico.", "P312": "P312: Caso sinta indisposição, contate um médico.", "P313": "P313: Consulte um médico.", "P314": "P314: Em caso de indisposição, consulte um médico.", "P315": "P315: Consulte imediatamente um médico.", "P316": "P316: Obtenha ajuda médica de emergência imediatamente.", "P317": "P317: Obtenha ajuda médica.", "P318": "P318: Se houver exposição, obtenha ajuda médica.", "P319": "P319: Se não se sentir bem, obtenha ajuda médica.", "P320": "P320: Tratamento específico urgente é exigido.", "P321": "P321: Tratamento específico.", "P330": "P330: Enxágue a boca.", "P331": "P331: NÃO provoque vômito.", "P332": "P332: Em caso de irritação cutânea:", "P333": "P333: Em caso de irritação ou erupção cutânea:", "P334": "P334: Mergulhe em água fria ou aplique compressas úmidas.", "P335": "P335: Sacuda as partículas soltas da pele.", "P336": "P336: Descongele as partes congeladas com água morna. Não friccione a área.", "P337": "P337: Caso a irritação ocular persista:", "P338": "P338: Remova as lentes de contato, se for fácil. Continue enxaguando.", "P340": "P340: Remova a pessoa para local ventilado e mantenha-a em repouso.", "P342": "P342: Em caso de sintomas respiratórios:", "P351": "P351: Enxágue cuidadosamente com água durante vários minutos.", "P352": "P352: Lave com água e sabão em abundância.", "P353": "P353: Enxágue a pele com água / tome uma ducha.", "P360": "P360: Enxágue imediatamente a roupa e a pele com água antes de tirar a roupa.", "P361": "P361: Retire imediatamente toda a roupa contaminada.", "P362": "P362: Retire a roupa contaminada e lave-a antes de usar.", "P363": "P363: Lave a roupa contaminada antes de usá-la novamente.", "P370": "P370: Em caso de incêndio:", "P371": "P371: Em caso de incêndio grave ou em grandes quantidades:", "P372": "P372: Risco de explosão em caso de incêndio.", "P373": "P373: NÃO combata o incêndio quando o fogo atingir os explosivos.", "P375": "P375: Combata o incêndio à distância, devido ao risco de explosão.", "P376": "P376: Detenha o vazamento se isso puder ser feito com segurança.", "P377": "P377: Incêndio por vazamento de gás: não apague, a menos que possa deter o vazamento.", "P378": "P378: Para a extinção utilize extintor apropriado.", "P380": "P380: Evacue a área.", "P381": "P381: Elimine todas as fontes de ignição se for seguro fazê-lo.", "P390": "P390: Absorva o produto derramado para evitar danos materiais.", "P391": "P391: Recolha o material derramado.",
    // Frases P - Combinações
    "P301+P312": "P301+P312: EM CASO DE INGESTÃO: Contate um médico caso sinta indisposição.", "P301+P316": "P301+P316: EM CASO DE INGESTÃO: Obtenha ajuda médica de emergência.", "P301+P317": "P301+P317: EM CASO DE INGESTÃO: Obtenha ajuda médica.", "P301+P330+P331": "P301+P330+P331: EM CASO DE INGESTÃO: Enxágue a boca. NÃO provoque vômito.", "P302+P352": "P302+P352: EM CASO DE CONTATO COM A PELE: Lave com água em abundância.", "P303+P361+P353": "P303+P361+P353: EM CASO DE CONTATO COM A PELE: Retire a roupa contaminada. Enxágue a pele.", "P304+P340": "P304+P340: EM CASO DE INALAÇÃO: Remova a pessoa para local ventilado.", "P305+P351+P338": "P305+P351+P338: EM CASO DE CONTATO COM OS OLHOS: Enxágue com água. Remova as lentes.", "P308+P311": "P308+P311: EM CASO DE exposição: Contate um médico.", "P308+P313": "P308+P313: EM CASO DE exposição: Consulte um médico.", "P332+P313": "P332+P313: Caso a irritação cutânea persista: Consulte um médico.", "P333+P313": "P333+P313: Em caso de irritação cutânea: Consulte um médico.", "P337+P313": "P337+P313: Caso a irritação ocular persista: Consulte um médico.", "P342+P311": "P342+P311: Em caso de sintomas respiratórios: Contate um médico.", "P370+P378": "P370+P378: Em caso de incêndio: Utilize pó químico, CO2 ou espuma para extinção.",
    // Frases P - Armazenamento e Descarte
    "P401": "P401: Armazene de acordo com a regulamentação.", "P402": "P402: Armazene em local seco.", "P403": "P403: Armazene em local bem ventilado.", "P404": "P404: Armazene em recipiente fechado.", "P405": "P405: Armazene em local fechado à chave.", "P406": "P406: Armazene num recipiente resistente à corrosão.", "P407": "P407: Deixe um espaço entre as pilhas/paletes.", "P410": "P410: Mantenha ao abrigo da luz solar.", "P411": "P411: Armazene a temperaturas não superiores a X °C.", "P412": "P412: Não exponha a temperaturas superiores a 50°C.", "P413": "P413: Armazene quantidades de material a granel superiores a X kg a temperatura controlada.", "P420": "P420: Armazene afastado de outros materiais.", "P403+P233": "P403+P233: Armazene em local bem ventilado. Mantenha o recipiente fechado.", "P403+P235": "P403+P235: Armazene em local bem ventilado. Mantenha em local fresco.", "P410+P403": "P410+P403: Mantenha ao abrigo da luz solar. Armazene em local bem ventilado.", "P410+P412": "P410+P412: Mantenha ao abrigo da luz solar. Não exponha a calor.",
    "P501": "P501: Descarte o conteúdo/recipiente conforme a legislação local de destinação de resíduos químicos.", "P502": "P502: Consulte o fabricante para obter informações sobre a recuperação/reciclagem."
};

function processPhrases(rawPhrasesArray, isP = false) {
    const extractedCodes = new Map();
    const fallbackTexts = [];
    
    rawPhrasesArray.forEach(rawStr => {
        // Encontra códigos simples (P264) ou combinações (P301+P317 ou P305 + P351)
        const codesMatches = rawStr.match(/[HP]\d{3}(?:\s*\+\s*[HP]\d{3})*/g);
        if (codesMatches) {
            codesMatches.forEach(c => {
                const code = c.replace(/\s+/g, '');
                if (!extractedCodes.has(code)) {
                    extractedCodes.set(code, rawStr.replace(/\[.*?\]/g, '').trim());
                }
            });
        } else {
            const clean = rawStr.replace(/\[.*?\]/g, '').trim(); 
            if(clean.length > 5) fallbackTexts.push(clean);
        }
    });

    let processed = [];
    extractedCodes.forEach((rawString, code) => {
        let translation = dictPhrases[code];
        if (translation) {
            // Se a tradução terminar com ":" (como "P301: EM CASO DE INGESTÃO:"), e a string original tiver mais conteúdo, preservamos o complemento
            if (translation.trim().endsWith(':')) {
                let parts = rawString.split(':');
                if (parts.length > 1) {
                    translation = translation + " " + parts.slice(1).join(':').trim();
                } else {
                    translation = translation + " " + rawString.replace(code, '').trim();
                }
            }
            processed.push(translation);
        } else {
            processed.push(rawString); 
        }
    });
    
    if (processed.length === 0) processed = fallbackTexts;

    const uniqueMap = new Map();
    processed.forEach(phrase => {
        const lower = phrase.toLowerCase();
        let shouldAdd = true;
        for (let [existingLower, existingOrig] of uniqueMap.entries()) {
            if (existingLower.includes(lower)) {
                shouldAdd = false;
                break;
            } else if (lower.includes(existingLower)) {
                uniqueMap.delete(existingLower);
                break;
            }
        }
        if (shouldAdd) uniqueMap.set(lower, phrase);
    });

    let finalArray = Array.from(uniqueMap.values());
    
    // Função de peso de importância (menor = mais importante)
    function getImportance(str) {
        let match = str.match(/[HP](\d{3})/);
        if (!match) return 999;
        let num = parseInt(match[1]);
        let type = str.charAt(0);
        
        // Regras específicas de prioridade
        if (type === 'P') {
            if (num === 501 || num === 502) return 10; // Descarte é crucial para resíduos
            if (num === 280 || num === 282 || num === 284) return 20; // EPIs são essenciais
            if (num >= 300 && num < 400) return 30 + num; // Primeiros socorros
            if (num >= 200 && num < 300) return 400 + num; // Prevenção
            if (num >= 400 && num < 500) return 500 + num; // Armazenamento
        } else if (type === 'H') {
            // Para frases H, numeração menor geralmente é mais grave no mesmo grupo (H300 > H302)
            // Mas físicos (200), saúde (300), meio ambiente (400)
            if (num >= 300 && num < 400) return 100 + num; // Saúde prioridade 1
            if (num >= 200 && num < 300) return 200 + num; // Físicos prioridade 2
            if (num >= 400) return 300 + num; // Meio ambiente prioridade 3
        }
        return num;
    }

    finalArray.sort((a, b) => getImportance(a) - getImportance(b));

    if (finalArray.length > 6) {
        finalArray = finalArray.slice(0, 6);
    }
    
    return finalArray.length > 0 ? finalArray : ["Nenhuma frase encontrada"];
}

async function searchPubChem(query) {
        try {
            const cidRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${query}/cids/JSON`);
            if (!cidRes.ok) return null;
            const cidData = await cidRes.json();
            const cid = cidData.IdentifierList.CID[0];

            const propRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName,MolecularFormula/JSON`);
            const propData = await propRes.json();
            const props = propData.PropertyTable.Properties[0];

            let casNumber = "N/A";
            try {
                const synRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`);
                if (synRes.ok) {
                    const synData = await synRes.json();
                    const synonyms = synData.InformationList.Information[0].Synonym || [];
                    const casRegex = /^\d{2,7}-\d{2}-\d$/;
                    const foundCas = synonyms.find(s => casRegex.test(s));
                    if (foundCas) casNumber = foundCas;
                }
            } catch (e) {
                if (ghsData.Record && ghsData.Record.Section) {
                    function findGhsSection(sections) {
                        for (const section of sections) {
                            if (section.TOCHeading && section.TOCHeading.includes('GHS Classification')) {
                                return section;
                            }
                            if (section.Section) {
                                const found = findGhsSection(section.Section);
                                if (found) return found;
                            }
                        }
                        return null;
                    }

                    const ghsSection = findGhsSection(ghsData.Record.Section);
                    if (ghsSection && ghsSection.Information) {
                        for (const item of ghsSection.Information) {
                            if (item.Name && item.Name.toLowerCase().includes('pictogram')) {
                                if(item.Value.StringWithMarkup) {
                                    const dictGhs = {
                                        "ghs01": "ghs01_explosivo", "exploding bomb": "ghs01_explosivo",
                                        "ghs02": "ghs02_inflamavel", "flame": "ghs02_inflamavel",
                                        "ghs03": "ghs03_oxidante", "flame over circle": "ghs03_oxidante",
                                        "ghs04": "ghs04_gas", "gas cylinder": "ghs04_gas",
                                        "ghs05": "ghs05_corrosivo", "corrosion": "ghs05_corrosivo",
                                        "ghs06": "ghs06_toxico", "skull and crossbones": "ghs06_toxico",
                                        "ghs07": "ghs07_irritante", "exclamation mark": "ghs07_irritante",
                                        "ghs08": "ghs08_saude", "health hazard": "ghs08_saude",
                                        "ghs09": "ghs09_meioambiente", "environment": "ghs09_meioambiente"
                                    };
                                    item.Value.StringWithMarkup.forEach(p => {
                                        if (p.Markup) {
                                            p.Markup.forEach(m => {
                                                if (m.URL) {
                                                    const matchUrl = m.URL.toLowerCase().match(/ghs\d{2}/);
                                                    if (matchUrl && dictGhs[matchUrl[0]]) {
                                                        pictograms.add(dictGhs[matchUrl[0]]);
                                                    }
                                                }
                                                if (m.Extra) {
                                                    const extraStr = m.Extra.toLowerCase();
                                                    for (let key in dictGhs) {
                                                        if (extraStr.includes(key)) pictograms.add(dictGhs[key]);
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                            if (item.Name && item.Name.includes('Signal')) {
                                if(item.Value.StringWithMarkup && item.Value.StringWithMarkup[0].String.toUpperCase() === 'DANGER') {
                                    warningWord = "PERIGO";
                                }
                            }
                            if (item.Name && item.Name.includes('GHS Hazard Statements')) {
                                if (item.Value.StringWithMarkup) {
                                    item.Value.StringWithMarkup.forEach(h => hazardsH.push(h.String));
                                }
                            }
                            if (item.Name && item.Name.includes('Precautionary Statement Codes')) {
                                 if (item.Value.StringWithMarkup) {
                                    item.Value.StringWithMarkup.forEach(p => hazardsP.push(p.String));
                                }
                            }
                        }
                    }
                }
            }

            const ghsRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`);
            let hazardsH = [];
            let hazardsP = [];
            let pictograms = new Set();
            let warningWord = "ATENÇÃO";

            if (ghsRes.ok) {
                const ghsData = await ghsRes.json();
                try {
                    function findGhsSection(sections) {
                        for (const section of sections) {
                            if (section.TOCHeading && section.TOCHeading.includes('GHS Classification') && section.Information) {
                                return section;
                            }
                            if (section.Section) {
                                const found = findGhsSection(section.Section);
                                if (found) return found;
                            }
                        }
                        return null;
                    }

                    const ghsSection = findGhsSection(ghsData.Record.Section);
                    if (ghsSection && ghsSection.Information) {
                        for (const item of ghsSection.Information) {
                            if (item.Name && item.Name.toLowerCase().includes('pictogram')) {
                                if(item.Value.StringWithMarkup) {
                                    const dictGhs = {
                                                "ghs01": "ghs01_explosivo", "exploding bomb": "ghs01_explosivo",
                                                "ghs02": "ghs02_inflamavel", "flame": "ghs02_inflamavel",
                                                "ghs03": "ghs03_oxidante", "flame over circle": "ghs03_oxidante",
                                                "ghs04": "ghs04_gas", "gas cylinder": "ghs04_gas",
                                                "ghs05": "ghs05_corrosivo", "corrosion": "ghs05_corrosivo",
                                                "ghs06": "ghs06_toxico", "skull and crossbones": "ghs06_toxico",
                                                "ghs07": "ghs07_irritante", "exclamation mark": "ghs07_irritante",
                                                "ghs08": "ghs08_saude", "health hazard": "ghs08_saude",
                                                "ghs09": "ghs09_meioambiente", "environment": "ghs09_meioambiente"
                                            };
                                            item.Value.StringWithMarkup.forEach(p => {
                                                if (p.Markup) {
                                                    p.Markup.forEach(m => {
                                                        if (m.URL) {
                                                            const matchUrl = m.URL.toLowerCase().match(/ghs\d{2}/);
                                                            if (matchUrl && dictGhs[matchUrl[0]]) {
                                                                pictograms.add(dictGhs[matchUrl[0]]);
                                                            }
                                                        }
                                                        if (m.Extra) {
                                                            const extraStr = m.Extra.toLowerCase();
                                                            for (let key in dictGhs) {
                                                                if (extraStr.includes(key)) pictograms.add(dictGhs[key]);
                                                            }
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                    if (item.Name && item.Name.includes('Signal')) {
                                        if(item.Value.StringWithMarkup && item.Value.StringWithMarkup[0].String.toUpperCase() === 'DANGER') {
                                            warningWord = "PERIGO";
                                        }
                                    }
                                    if (item.Name && item.Name.includes('GHS Hazard Statements')) {
                                        if (item.Value.StringWithMarkup) {
                                            item.Value.StringWithMarkup.forEach(h => hazardsH.push(h.String));
                                        }
                                    }
                                    if (item.Name && item.Name.includes('Precautionary Statement Codes')) {
                                         if (item.Value.StringWithMarkup) {
                                            item.Value.StringWithMarkup.forEach(p => hazardsP.push(p.String));
                                        }
                                    }
                            }
                        }
                } catch (e) { console.error("GHS parse error", e); }
            }

            const nameLower = query.toLowerCase() + " " + (props.IUPACName || '').toLowerCase();
            const isStrongAcid = nameLower.includes('sulfuric') || nameLower.includes('sulfúrico') || 
                                 nameLower.includes('nitric') || nameLower.includes('nítrico') || 
                                 nameLower.includes('hydrochloric') || nameLower.includes('clorídrico') || 
                                 nameLower.includes('hydrofluoric') || nameLower.includes('fluorídrico');
            
            if (isStrongAcid) {
                if (!hazardsH.find(h => h.includes('H331'))) hazardsH.push("H331: Tóxico se inalado.");
                if (!hazardsH.find(h => h.includes('H290'))) hazardsH.push("H290: Pode ser corrosivo para os metais.");
            }

            let classesArr = [];
            if (pictograms.has("ghs02_inflamavel")) classesArr.push("3 (Inflamável)");
            if (pictograms.has("ghs06_toxico") || pictograms.has("ghs08_saude")) classesArr.push("6.1 (Tóxico)");
            if (pictograms.has("ghs05_corrosivo")) classesArr.push("8 (Corrosivo)");
            if (pictograms.has("ghs04_gas")) classesArr.push("2 (Gás)");
            if (pictograms.has("ghs09_meioambiente")) classesArr.push("9 (Ambiental)");

            let inferredRiskClass = classesArr.length > 0 ? classesArr.join(" + ") : "A definir";
            
            let inferredUN = "A definir";
            let cStr = classesArr.join(",");
            if (cStr.includes("3") && cStr.includes("6.1") && cStr.includes("8")) inferredUN = "3286";
            else if (cStr.includes("3") && cStr.includes("6.1")) inferredUN = "1992";
            else if (cStr.includes("3") && cStr.includes("8")) inferredUN = "2924";
            else if (cStr.includes("6.1") && cStr.includes("8")) inferredUN = "2922";
            else if (cStr.includes("3")) inferredUN = "1993";
            else if (cStr.includes("8")) inferredUN = "1760";
            else if (cStr.includes("6.1")) inferredUN = "2810";
            else if (cStr.includes("2")) inferredUN = "1956";

            const finalH = processPhrases(hazardsH, false);
            const finalP = processPhrases(hazardsP, true);

            const novoProduto = {
                CAS_Number: casNumber,
                IUPAC_Name: props.IUPACName || "N/A",
                Common_Name: query.toUpperCase(),
                Molecular_Formula: props.MolecularFormula || "N/A",
                UN_Number: inferredUN,
                Risk_Class: inferredRiskClass,
                Hazard_Code: "A definir",
                RDC222_Group: "Grupo B",
                Warning_Word: warningWord,
                H_Phrases: finalH,
                P_Phrases: finalP,
                Pictograms_List: Array.from(pictograms)
            };
            
            sincronizarComNuvem(novoProduto);
            return novoProduto;
        } catch (e) {
            console.error("PubChem fetch error", e);
            return null;
        }
    }

    // Função de Sync Universal (Firebase/Supabase)
    function sincronizarComNuvem(produto) {
        console.log("☁️ [SYNC CLOUD] Enviando novo produto para o Supabase:", produto.Common_Name);
        saveChemicalToCloud(produto);
        
        // Salvamento local temporário (cache na sessão atual)
        db.push(produto);
    }

    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        const queryNorm = query.toLowerCase();

        if (query.length === 0) {
            searchResults.classList.remove('active');
            return;
        }

        // Primeiro procura no banco interno unificado (db hardcoded + meu banco)
        let filtered = db.filter(p => 
            p.Common_Name.toLowerCase().includes(queryNorm) || 
            (p.CAS_Number && p.CAS_Number.includes(queryNorm))
        ).slice(0, 5); // Limit to 5 local matches
        
        let myFiltered = myProductsCache.filter(p => p.nome.toLowerCase().includes(queryNorm)).map(p => {
            let pObj = {
                Common_Name: p.nome,
                Common_Name_PT: p.nome,
                H_Phrases: [],
                P_Phrases: [],
                CAS_Number: p.tipo === 'residuo' ? 'Meu Banco' : 'Minha Mistura',
                isMyProduct: true,
                meuProdutoData: p,
                Pictograms_List: p.ghs_classes || []
            };
            if(p.observacoes) {
                try {
                    const parsedData = JSON.parse(p.observacoes);
                    if (p.tipo === 'mistura') {
                        pObj.isMixture = true;
                        if (Array.isArray(parsedData)) {
                            pObj.mixtureData = parsedData;
                        } else {
                            pObj.mixtureData = parsedData.mixtureData;
                        }
                    }
                }catch(e){}
            }
            return pObj;
        });

        const combined = [...myFiltered, ...filtered];
        if (combined.length > 0) {
            renderResults(combined, false, false);
        } else {
            searchResults.innerHTML = '<div class="result-item loading-online" style="color: #666;"><i class="fas fa-spinner fa-spin"></i> Buscando sugestões online...</div>';
            searchResults.classList.add('active');
        }

        searchTimeout = setTimeout(async () => {
            if (combined.length > 0) {
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'result-item loading-online';
                loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando online...';
                searchResults.appendChild(loadingDiv);
            } else {
                searchResults.innerHTML = '<div class="result-item loading-online" style="color: #666;"><i class="fas fa-spinner fa-spin"></i> Buscando correspondência exata...</div>';
            }
            
            // 1. Tenta busca exata no PubChem (que já possui muitos sinônimos em Português)
            let onlineResult = await searchPubChem(query);
            let searchWord = queryNorm;

            // 2. Se falhar, tenta traduzir e buscar exato
            if (!onlineResult) {
                const loader = searchResults.querySelector('.loading-online');
                if(loader) loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traduzindo termo para busca internacional...';
                try {
                    const trRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=${encodeURIComponent(query)}`);
                    if (trRes.ok) {
                        const trData = await trRes.json();
                        if (trData && trData[0] && trData[0][0] && trData[0][0][0]) {
                            searchWord = trData[0][0][0].toLowerCase();
                            onlineResult = await searchPubChem(searchWord);
                        }
                    }
                } catch(e) { console.warn("Erro ao traduzir busca", e); }
            }

            const loader = searchResults.querySelector('.loading-online');
            if(loader) loader.remove();

            if (onlineResult) {
                onlineResult.Common_Name_PT = query.toUpperCase();
                // Check if we already have it in combined to avoid exact duplicates
                if (!combined.some(c => c.Common_Name.toUpperCase() === onlineResult.Common_Name_PT.toUpperCase())) {
                    renderResults([onlineResult], true, true);
                }
                return;
            }

            // 3. Se tudo falhar, exibe autocomplete para o termo traduzido
            const autoLoader = document.createElement('div');
            autoLoader.className = 'result-item loading-online';
            autoLoader.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando sugestões online...';
            searchResults.appendChild(autoLoader);

            try {
                const autoRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(searchWord)}/json?limit=6`);
                if (autoRes.ok) {
                    const autoData = await autoRes.json();
                    const terms = autoData.dictionary_terms?.compound;
                    autoLoader.remove();
                    if (terms && terms.length > 0) {
                        // Se for append, não apaga o innerHTML
                        if (combined.length === 0) searchResults.innerHTML = '';
                        terms.forEach(term => {
                            const div = document.createElement('div');
                            div.className = 'result-item';
                            div.innerHTML = `<strong>${term}</strong> <span style="color: #00875F; font-size: 0.8em; float: right;">[Sugestão PubChem]</span>`;
                            div.addEventListener('click', async (event) => {
                                event.stopPropagation();
                                searchInput.value = term;
                                searchResults.innerHTML = '<div class="result-item" style="color: #666;"><i class="fas fa-spinner fa-spin"></i> Baixando ficha química e GHS...</div>';
                                const clickResult = await searchPubChem(term);
                                if (clickResult) {
                                    clickResult.Common_Name_PT = query.toUpperCase();
                                    selectProduct(clickResult);
                                } else {
                                    searchResults.innerHTML = '<div class="result-item" style="color: #E3000F;">Erro ao processar dados GHS deste produto.</div>';
                                }
                            });
                            searchResults.appendChild(div);
                        });
                        return; // Wait for user click
                    }
                }
            } catch(e) { console.error("Autocomplete error", e); }
            
            if (combined.length === 0) {
                searchResults.innerHTML = '<div class="result-item" style="color: #E3000F;">Nenhum resultado encontrado (Local ou PubChem).</div>';
            }
        }, 500); // 500ms debounce
    });

    function renderResults(list, isOnline = false, append = false) {
        if (!append) searchResults.innerHTML = '';
        list.forEach(p => {
            const div = document.createElement('div');
            div.className = 'result-item';
            let badge = isOnline ? '<span style="color: #00875F; font-size: 0.8em; float: right;">[PubChem]</span>' : '';
            if (p.isMyProduct) {
                badge = `<span style="color: #3b82f6; font-size: 0.8em; float: right;">[Meu Banco]</span>`;
            }
            div.innerHTML = `<strong>${p.Common_Name}</strong> <small>(${p.CAS_Number || ''})</small> ${badge}`;
            div.addEventListener('click', () => {
                if(p.isMixture && p.mixtureData) {
                    currentMixture = p.mixtureData.map(item => ({...item, id: Date.now() + Math.random()}));
                    updateMixtureDisplay();
                } else {
                    selectProduct(p);
                }

                // Restaurar edições personalizadas (Nome, ONU, Estado, Incompatibilidade e Pictogramas)
                if(p.isMyProduct) {
                    currentMyProductId = p.meuProdutoData.id_supabase;
                    const delBtn = document.getElementById('deletePersonalDbBtn');
                    if(delBtn) delBtn.classList.remove('hidden');

                    setTimeout(() => {
                        const data = p.meuProdutoData;
                        if(data.nome) document.getElementById('pdNome').textContent = data.nome;
                        if(data.onu_number) document.getElementById('pdOnu').textContent = (data.onu_number.toUpperCase().startsWith('ONU') ? '' : 'ONU: ') + data.onu_number;
                        if(data.estado_fisico && document.getElementById('pdEstado')) document.getElementById('pdEstado').value = data.estado_fisico;
                        if(data.incompatibilidade && document.getElementById('pdIncompatibilidade')) document.getElementById('pdIncompatibilidade').value = data.incompatibilidade;
                        
                        // Restaurar Pictogramas
                        if(data.ghs_classes && Array.isArray(data.ghs_classes)) {
                            selectedPictograms.clear();
                            data.ghs_classes.forEach(cls => selectedPictograms.add(cls));
                            
                            // Re-renderizar UI dos pictogramas
                            const picContainer = document.getElementById('pdPictogramas');
                            if (picContainer) {
                                picContainer.querySelectorAll('.picto-item').forEach(item => {
                                    const title = item.title;
                                    const ghsObj = allGhs.find(g => g.label === title);
                                    if(ghsObj && data.ghs_classes.includes(ghsObj.id)) {
                                        item.classList.add('active');
                                    } else {
                                        item.classList.remove('active');
                                    }
                                });
                            }
                        }

                        // Restaurar Frases H e P
                        try {
                            const parsedObs = JSON.parse(data.observacoes || '{}');
                            if (!Array.isArray(parsedObs)) {
                                if (parsedObs.frases_h && Array.isArray(parsedObs.frases_h)) {
                                    document.getElementById('pdFrasesH').innerHTML = parsedObs.frases_h.map(f => `<li>${f}</li>`).join('');
                                }
                                if (parsedObs.frases_p && Array.isArray(parsedObs.frases_p)) {
                                    document.getElementById('pdFrasesP').innerHTML = parsedObs.frases_p.map(f => `<li>${f}</li>`).join('');
                                }
                            }
                        } catch(e) {}
                    }, 50); // Timeout para rodar logo após o updateMixtureDisplay
                } else {
                    currentMyProductId = null;
                    const delBtn = document.getElementById('deletePersonalDbBtn');
                    if(delBtn) delBtn.classList.add('hidden');
                }

                searchInput.value = '';
                searchResults.classList.remove('active');
            });
            searchResults.appendChild(div);
        });
        searchResults.classList.add('active');
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-section')) searchResults.classList.remove('active');
    });

    let selectedPictograms = new Set();

    function selectProduct(produto) {
        // Agora selectProduct apenas adiciona à mistura
        addResiduo(produto);
        searchInput.value = '';
        searchResults.classList.remove('active');
        document.getElementById('dataDescarte').valueAsDate = new Date();
    }

    function addResiduo(produto) {
        let sumCurrent = 0;
        currentMixture.forEach(m => sumCurrent += m.percentage);
        let remaining = 100 - sumCurrent;
        if (remaining < 0) remaining = 0;

        const newItem = {
            id: Date.now() + Math.random(),
            produto: { ...produto, Common_Name_PT: produto.Common_Name_PT || produto.Common_Name }, // Default to English initially
            percentage: remaining
        };
        currentMixture.push(newItem);
        updateMixtureDisplay();

        // Tenta traduzir automaticamente para Português usando API gratuita se não tiver sido traduzido antes
        if (produto.Common_Name_PT === produto.Common_Name) {
            fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(produto.Common_Name)}&langpair=en|pt`)
                .then(res => res.json())
                .then(data => {
                    if(data && data.responseData && data.responseData.translatedText) {
                        const translated = data.responseData.translatedText;
                        // Atualiza no array
                        const itemToUpdate = currentMixture.find(m => m.id === newItem.id);
                        if(itemToUpdate) {
                            itemToUpdate.produto.Common_Name_PT = translated;
                            updateMixtureDisplay();
                        }
                    }
                })
                .catch(err => console.error("Erro na tradução automática:", err));
        }
    }

    window.removeResiduo = function(id) {
        currentMixture = currentMixture.filter(m => m.id !== id);
        updateMixtureDisplay();
    };

    window.updatePercentage = function(id, value) {
        const item = currentMixture.find(m => m.id === id);
        if (item) {
            let newVal = parseFloat(value) || 0;
            if (newVal < 0) newVal = 0;
            
            let sumOthers = 0;
            currentMixture.forEach(m => {
                if (m.id !== id) sumOthers += m.percentage;
            });
            
            if (sumOthers + newVal > 100) {
                newVal = 100 - sumOthers;
                alert(`A soma das concentrações não pode ultrapassar 100%. Valor ajustado para ${newVal}%.`);
            }
            
            item.percentage = newVal;
            updateMixtureDisplay();
        }
    };

    window.updateNamePT = function(id, value) {
        const item = currentMixture.find(m => m.id === id);
        if (item) {
            item.produto.Common_Name_PT = value;
        }
    };

    function updateMixtureDisplay() {
        if (currentMixture.length === 0) {
            mixtureSection.classList.add('hidden');
            productDetails.classList.add('hidden');
            return;
        }

        mixtureSection.classList.remove('hidden');
        productDetails.classList.remove('hidden');

        // Renderiza a lista do carrinho
        mixtureList.innerHTML = '';
        currentMixture.forEach(m => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.gap = '0.5rem';
            div.style.alignItems = 'center';
            div.style.background = 'var(--surface)';
            div.style.padding = '0.5rem';
            div.style.borderRadius = '6px';
            div.style.border = '1px solid var(--border)';
            
            div.innerHTML = `
                <div style="flex: 1; display: flex; flex-direction: column; gap: 0.2rem;">
                    <input type="text" onchange="updateNamePT(${m.id}, this.value)" value="${m.produto.Common_Name_PT || m.produto.Common_Name}" style="background: var(--bg-dark); border: 1px solid var(--border); color: var(--text-primary); padding: 0.4rem; border-radius: 4px; font-weight: bold; width: 100%; font-size: 0.9rem;" title="Nome do Produto (Deve ser em Português)">
                    <small style="color: var(--text-secondary); font-size: 0.75rem;">CAS: ${m.produto.CAS_Number || 'N/A'}</small>
                </div>
                <div style="display: flex; align-items: center; gap: 0.25rem;">
                    <input type="number" value="${m.percentage}" onchange="updatePercentage(${m.id}, this.value)" style="width: 60px; padding: 0.2rem; border-radius: 4px; border: 1px solid var(--border);" min="0" max="100">
                    <span style="font-size: 0.9rem; color: var(--text-secondary)">%</span>
                </div>
                <button type="button" onclick="removeResiduo(${m.id})" style="background: none; border: none; color: var(--danger); cursor: pointer; padding: 0.2rem 0.5rem; font-weight: bold;">X</button>
            `;
            mixtureList.appendChild(div);
        });

        checkIncompatibility();
        calculateUnifiedLabel();
    }

    function calculateUnifiedLabel() {
        let isPureForONU = currentMixture.length === 1 || currentMixture.some(m => parseFloat(m.percentage) >= 90);
        let pureComponent = currentMixture.find(m => parseFloat(m.percentage) >= 90) || currentMixture[0];
        
        const formatName = name => (name || "").toUpperCase();

        let isSingle = currentMixture.length === 1;
        let unifiedName = isSingle ? formatName(currentMixture[0].produto.Common_Name_PT || currentMixture[0].produto.Common_Name) : "MISTURA: " + currentMixture.map(m => formatName(m.produto.Common_Name_PT || m.produto.Common_Name)).join(" + ");
        let unifiedComp = "COMPOSIÇÃO: " + currentMixture.map(m => `${formatName(m.produto.Common_Name_PT || m.produto.Common_Name)} (CAS: ${m.produto.CAS_Number || 'N/A'})`).join(" / ");
        
        let unifiedOnu = "N/A";
        let unifiedClass = "N/A";
        let names = currentMixture.map(m => formatName(m.produto.Common_Name_PT || m.produto.Common_Name)).join(", ");
        
        if (isSingle) {
            unifiedOnu = currentMixture[0].produto.UN_Number || "N/A";
            unifiedClass = currentMixture[0].produto.Risk_Class || "N/A";
        } else {
            let classesObj = { 1: false, 5.2: false, 7: false, 3: false, 6: false, 8: false, 2: false, 9: false };
            let hasInhalationToxicity = false;

            currentMixture.forEach(m => {
                const cls = m.produto.Risk_Class || "";
                if (cls.includes("1") && !cls.includes("6.1")) classesObj[1] = true;
                if (cls.includes("5.2")) classesObj[5.2] = true;
                if (cls.includes("7")) classesObj[7] = true;
                if (cls.includes("3")) classesObj[3] = true;
                if (cls.includes("6.1") || cls.includes("6")) {
                    classesObj[6] = true;
                    let hList = JSON.stringify(m.produto.H_Phrases || []).toLowerCase();
                    if (hList.includes("h330") || hList.includes("h331")) {
                        hasInhalationToxicity = true;
                    }
                }
                if (cls.includes("8")) classesObj[8] = true;
                if (cls.includes("2")) classesObj[2] = true;
                if (cls.includes("9")) classesObj[9] = true;
            });
            
            if (classesObj[1] || classesObj[5.2] || classesObj[7]) {
                unifiedOnu = `ONU CLASSE ESPECIAL (VERIFICAR FICHA DE EMERGÊNCIA) (${names})`;
                unifiedClass = "1, 5.2 ou 7";
            } else if (classesObj[3] && classesObj[6] && classesObj[8]) {
                unifiedOnu = `ONU 3286 LÍQUIDO INFLAMÁVEL, TÓXICO, CORROSIVO, N.E. (${names})`;
                unifiedClass = "3, 6.1, 8";
            } else if (classesObj[3] && classesObj[6]) {
                unifiedOnu = `ONU 1992 LÍQUIDO INFLAMÁVEL, TÓXICO, N.E. (${names})`;
                unifiedClass = "3, 6.1";
            } else if (classesObj[3] && classesObj[8]) {
                unifiedOnu = `ONU 2924 LÍQUIDO INFLAMÁVEL, CORROSIVO, N.E. (${names})`;
                unifiedClass = "3, 8";
            } else if (classesObj[8] && classesObj[6]) {
                if (hasInhalationToxicity) {
                    unifiedOnu = `ONU 2927 LÍQUIDO TÓXICO, CORROSIVO, ORGÂNICO, N.E. (${names})`;
                    unifiedClass = "6.1, 8";
                } else {
                    unifiedOnu = `ONU 2922 LÍQUIDO CORROSIVO, TÓXICO, N.E. (${names})`;
                    unifiedClass = "8, 6.1";
                }
            } else if (classesObj[3]) {
                unifiedOnu = `ONU 1993 LÍQUIDO INFLAMÁVEL, N.E. (${names})`;
                unifiedClass = "3";
            } else if (classesObj[8]) {
                unifiedOnu = `ONU 3264 LÍQUIDO CORROSIVO, ÁCIDO, INORGÂNICO, N.E. (${names})`;
                unifiedClass = "8";
            } else if (classesObj[6]) {
                unifiedOnu = `ONU 2810 LÍQUIDO TÓXICO, ORGÂNICO, N.E. (${names})`;
                unifiedClass = "6.1";
            } else if (classesObj[2]) {
                unifiedOnu = `ONU 1956 GÁS COMPRIMIDO, N.E. (${names})`;
                unifiedClass = "2";
            } else if (classesObj[9]) {
                unifiedOnu = `ONU 3082 SUBSTÂNCIA QUE APRESENTA RISCO PARA O MEIO AMBIENTE, LÍQUIDA, N.E. (${names})`;
                unifiedClass = "9";
            } else {
                unifiedOnu = `ONU MISTURA N.E. (${names})`;
                unifiedClass = "Mistura Multirrisco";
            }
        }
        
        let hasDanger = currentMixture.some(m => (m.produto.Warning_Word || "").toUpperCase() === "PERIGO");
        let unifiedAdvertencia = hasDanger ? "PERIGO" : "ATENÇÃO";

        // Regra de Aditividade GHS (Exemplo: Corrosão > 10%)
        let sumCorrosive = 0;
        let sumToxic = 0;
        let hasStrongAcid = false;
        let allH = [];
        let allP = [];
        selectedPictograms.clear();

        currentMixture.forEach(m => {
            const p = m.produto;
            const perc = m.percentage;
            
            if (p.Pictograms_List) p.Pictograms_List.forEach(id => selectedPictograms.add(id));
            if (p.H_Phrases) allH = allH.concat(p.H_Phrases);
            if (p.P_Phrases) allP = allP.concat(p.P_Phrases);

            // Verifica se é corrosivo para somar (busca por H314 ou GHS05)
            if (p.Pictograms_List && p.Pictograms_List.includes('ghs05_corrosivo')) sumCorrosive += perc;
            if (p.Pictograms_List && p.Pictograms_List.includes('ghs06_toxico')) sumToxic += perc;

            // Trava de Ácidos Fortes
            const nameLower = (p.Common_Name_PT || p.Common_Name || "").toLowerCase();
            if (nameLower.includes("ácido nítrico") || nameLower.includes("acido nitrico") ||
                nameLower.includes("ácido sulfúrico") || nameLower.includes("acido sulfurico") ||
                nameLower.includes("ácido clorídrico") || nameLower.includes("acido cloridrico") ||
                nameLower.includes("nitric acid") || nameLower.includes("sulfuric acid") || nameLower.includes("hydrochloric acid")) {
                hasStrongAcid = true;
            }
        });

        // Trava de Ácidos Fortes: injeta obrigatoriamente H290 e H331
        if (hasStrongAcid) {
            selectedPictograms.add('ghs05_corrosivo');
            selectedPictograms.add('ghs06_toxico');
            hasDanger = true;
            unifiedAdvertencia = "PERIGO";
            if (!allH.some(h => h.toLowerCase().includes("h290"))) allH.push("H290 - Pode ser corrosivo para os metais.");
            if (!allH.some(h => h.toLowerCase().includes("h331"))) allH.push("H331 - Tóxico se inalado.");
        }

        // Aditividade: Se soma corrosiva > 10%, força Corrosivo
        if (sumCorrosive > 10) {
            selectedPictograms.add('ghs05_corrosivo');
            if (!allH.some(h => h.includes("H314"))) allH.push("H314 - Provoca queimadura severa à pele e dano aos olhos.");
            hasDanger = true;
            unifiedAdvertencia = "PERIGO";
        }

        // Aditividade: Se soma tóxica > 1%, força Tóxico
        if (sumToxic > 1) {
            selectedPictograms.add('ghs06_toxico');
            hasDanger = true;
            unifiedAdvertencia = "PERIGO";
        }

        // Se for UN 3286 (Triplo perigo), forçamos os 4 pictogramas essenciais para a mistura
        if (unifiedOnu && unifiedOnu.includes("3286")) {
            selectedPictograms.add('ghs02_inflamavel');
            selectedPictograms.add('ghs06_toxico');
            selectedPictograms.add('ghs05_corrosivo');
            selectedPictograms.add('ghs08_saude');
        }

        // Regras de Precedência GHS para limpeza visual
        if (selectedPictograms.has('ghs06_toxico')) {
            selectedPictograms.delete('ghs07_irritante');
        }
        if (selectedPictograms.has('ghs05_corrosivo')) {
            selectedPictograms.delete('ghs07_irritante');
        }

        document.getElementById('pdNome').textContent = unifiedName;
        document.getElementById('pdComposicao').textContent = unifiedComp;
        let onuDisplay = unifiedOnu.toUpperCase().startsWith("ONU") ? unifiedOnu : `ONU: ${unifiedOnu}`;
        document.getElementById('pdOnu').textContent = onuDisplay;
        document.getElementById('pdClasse').textContent = unifiedClass;
        document.getElementById('pdAdvertencia').textContent = unifiedAdvertencia;

        const picContainer = document.getElementById('pdPictogramas');
        picContainer.innerHTML = '';
        allGhs.forEach(ghs => {
            const div = document.createElement('div');
            div.className = `picto-item ${selectedPictograms.has(ghs.id) ? 'active' : ''}`;
            
            div.innerHTML = `<img src="${ghs.img}" alt="${ghs.label}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiPklNQUdFTTwvdGV4dD48L3N2Zz4='">`;
            div.title = ghs.label;
            
            // Se for a exclamação e houver Caveira/Corrosivo, deixa ela visualmente opaca/bloqueada
            if (ghs.id === 'ghs07_irritante' && (selectedPictograms.has('ghs06_toxico') || selectedPictograms.has('ghs05_corrosivo'))) {
                div.style.opacity = '0.3';
                div.style.cursor = 'not-allowed';
            }

            div.addEventListener('click', () => {
                // Trava de Precedência no momento do clique
                if (ghs.id === 'ghs07_irritante' && (selectedPictograms.has('ghs06_toxico') || selectedPictograms.has('ghs05_corrosivo'))) {
                    alert("A Exclamação (GHS07) não pode ser ativada pois a mistura já possui Toxicidade Aguda (Caveira) ou Corrosão. A norma GHS exige a supressão da Exclamação nestes casos.");
                    return;
                }

                if (selectedPictograms.has(ghs.id)) {
                    selectedPictograms.delete(ghs.id);
                    div.classList.remove('active');
                } else {
                    selectedPictograms.add(ghs.id);
                    div.classList.add('active');
                    
                    // Validação em tempo real: se ativou Caveira ou Corrosivo manualmente, desativa a Exclamação
                    if (ghs.id === 'ghs06_toxico' || ghs.id === 'ghs05_corrosivo') {
                        if (selectedPictograms.has('ghs07_irritante')) {
                            selectedPictograms.delete('ghs07_irritante');
                            // Para atualizar a interface visualmente, refaz a grade:
                            calculateUnifiedLabel();
                            return; // Previne dupla execução do clique
                        }
                    }
                }
            });
            picContainer.appendChild(div);
        });

        // processPhrases já garante máximo de 6 e ordenação
        const displayH = processPhrases(allH, false);
        const displayP = processPhrases(allP, true);
        
        document.getElementById('pdFrasesH').innerHTML = displayH.map(f => `<li>${f}</li>`).join('');
        document.getElementById('pdFrasesP').innerHTML = displayP.map(f => `<li>${f}</li>`).join('');
    }

    document.getElementById('printBtn').addEventListener('click', () => {
        if (currentMixture.length === 0) return;
        saveLabelHistory();
        
        const empresa = document.getElementById('geradorEmpresa') ? document.getElementById('geradorEmpresa').value : '-';
        const endereco = document.getElementById('geradorEndereco') ? document.getElementById('geradorEndereco').value : '-';
        const resp = document.getElementById('geradorResp') ? document.getElementById('geradorResp').value : '-';
        const tel = document.getElementById('geradorTel') ? document.getElementById('geradorTel').value : '-';

        const data = document.getElementById('dataDescarte').value;
        const dataFormatada = data ? new Date(data).toLocaleDateString('pt-BR') : '___/___/_____';
        const estado = document.getElementById('estadoFisico') ? document.getElementById('estadoFisico').value : 'Sólido';
        const vol = document.getElementById('volMaximo') ? document.getElementById('volMaximo').value : '___ L';
        const configVol = document.getElementById('volEmbalagem').value;
        const qtdEtiquetas = document.getElementById('qtdEtiquetas') ? parseInt(document.getElementById('qtdEtiquetas').value) || 1 : 1;

        let labelWidth = "150mm";
        let labelHeight = "100mm";
        if(configVol === "A") { labelWidth = "74mm"; labelHeight = "52mm"; }
        else if(configVol === "B") { labelWidth = "105mm"; labelHeight = "74mm"; }
        else if(configVol === "C") { labelWidth = "148mm"; labelHeight = "105mm"; }
        else if(configVol === "D") { labelWidth = "210mm"; labelHeight = "148mm"; }

        const dynamicCSS = `
            @media print {
                @page { size: A4 landscape; margin: 10mm !important; }
                html, body { 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    background: white !important; 
                    width: 100% !important; 
                    height: 100% !important; 
                }
                .print-page {
                    display: block !important;
                    width: 100% !important;
                }
                .form-container { 
                    width: ${labelWidth} !important; 
                    height: ${labelHeight} !important; 
                    margin: 0 5mm 5mm 0 !important; 
                    padding: 2mm !important; 
                    border: 1px solid black !important; 
                    border-radius: 2mm !important;
                    box-sizing: border-box !important;
                    page-break-inside: avoid !important;
                    display: inline-flex !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                    vertical-align: top !important;
                }
            }
        `;
        document.getElementById('dynamicPrintStyle').innerHTML = dynamicCSS;

        let pictogramsHtml = '';
        let pictoCount = 0;
        allGhs.forEach(ghs => {
            if (selectedPictograms.has(ghs.id) && pictoCount < 4) {
                pictogramsHtml += `<img src="${ghs.img}" onerror="this.style.display='none'">`;
                pictoCount++;
            }
        });

        const printArea = document.getElementById('printArea');
        const unifiedName = document.getElementById('pdNome').textContent;
        const unifiedComp = document.getElementById('pdComposicao').textContent;
        const unifiedAdv = document.getElementById('pdAdvertencia').textContent;
        const unifiedOnu = document.getElementById('pdOnu') ? document.getElementById('pdOnu').textContent : '';
        const unifiedClass = document.getElementById('pdClasse') ? document.getElementById('pdClasse').textContent : '';
        
        let maxP = 6;

        const hLisNodes = Array.from(document.getElementById('pdFrasesH').children);
        const pLisNodes = Array.from(document.getElementById('pdFrasesP').children);
        
        const hLis = hLisNodes.slice(0, maxP).map(li => li.outerHTML).join('');
        const pLis = pLisNodes.slice(0, maxP).map(li => li.outerHTML).join('');

        let onuOnly = unifiedOnu;
        if (unifiedOnu.toUpperCase().startsWith("ONU") && unifiedOnu.split(" ").length > 1) {
            onuOnly = unifiedOnu.split(" ")[1];
        }

        const singleForm = `
        <div class="form-container size-${configVol}">
            <div class="print-title">${unifiedName.toUpperCase()}</div>
            <div class="print-subtitle">(${unifiedComp})</div>
            <div class="print-subtitle" style="font-weight: bold; margin-top: 1mm;">${unifiedOnu}</div>
            
            <div class="print-warning-banner">
                <div style="flex: 1;"></div>
                <div style="flex: 2; text-align: center;">${unifiedAdv}</div>
                <div style="flex: 1; text-align: right; font-size: 0.6em; line-height: 1.1; padding-right: 2mm;">
                    <div style="font-weight: normal;">ONU: <span style="font-weight: bold;">${onuOnly}</span></div>
                    <div style="font-weight: normal;">Classe: <span style="font-weight: bold;">${unifiedClass}</span></div>
                </div>
            </div>
            
            <div class="print-pictograms">
                ${pictogramsHtml}
            </div>

            <div class="print-grid-2col phrases-grid">
                <div>
                    <div class="print-box-title">FRASES DE PERIGO:</div>
                    <div class="print-phrases">
                        <ul>${hLis}</ul>
                    </div>
                </div>
                <div>
                    <div class="print-box-title">FRASES DE PRECAUÇÃO:</div>
                    <div class="print-phrases">
                        <ul>${pLis}</ul>
                    </div>
                </div>
            </div>

            <div class="print-grid-2col info-grid">
                <div>
                    <div class="print-box-title">INFORMAÇÕES DO RESÍDUO:</div>
                    <div class="print-info-text">
                        <strong>Data de Início do Acúmulo:</strong> ${dataFormatada}<br>
                        <strong>Estado Físico:</strong> ${estado}<br>
                        <strong>Volume Máximo:</strong> ${vol}
                    </div>
                </div>
                <div>
                    <div class="print-box-title">IDENTIFICAÇÃO DO GERADOR:</div>
                    <div class="print-info-text">
                        <strong>Empresa/Setor:</strong> ${empresa}<br>
                        <strong>Endereço:</strong> ${endereco}<br>
                        <strong>Responsável Técnico:</strong> ${resp}<br>
                        <strong>Telefone de Emergência (24h):</strong> ${tel}
                    </div>
                </div>
            </div>
        </div>`;

        let formsHtml = '';
        for (let i = 0; i < qtdEtiquetas; i++) {
            formsHtml += singleForm;
        }

        printArea.innerHTML = `<div class="print-page">\n${formsHtml}\n</div>`;

        window.print();
    });

    // --- Lógica do Relatório (Dashboard) ---
    const reportsBtn = document.getElementById('reportsBtn');
    const closeReportsBtn = document.getElementById('closeReportsBtn');
    const dashboardModal = document.getElementById('dashboardModal');
    const reportsTableBody = document.getElementById('reportsTableBody');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const selectAllReports = document.getElementById('selectAllReports');

    function updateDeleteBtnVisibility() {
        const anyChecked = Array.from(document.querySelectorAll('.report-checkbox')).some(cb => cb.checked);
        if (anyChecked) deleteSelectedBtn.classList.remove('hidden');
        else deleteSelectedBtn.classList.add('hidden');
    }

    if(selectAllReports) {
        selectAllReports.addEventListener('change', (e) => {
            document.querySelectorAll('.report-checkbox').forEach(cb => {
                cb.checked = e.target.checked;
            });
            updateDeleteBtnVisibility();
        });
    }

    if(deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', async () => {
            const checkedBoxes = Array.from(document.querySelectorAll('.report-checkbox:checked'));
            const idsToDelete = checkedBoxes.map(cb => cb.value);
            
            if (idsToDelete.length === 0) return;
            if (!confirm(`Tem certeza que deseja apagar ${idsToDelete.length} registro(s)? Essa ação não pode ser desfeita.`)) return;

            deleteSelectedBtn.textContent = 'Apagando...';
            deleteSelectedBtn.disabled = true;

            try {
                const { data, error } = await supabaseClient
                    .from('historico_descartes')
                    .delete()
                    .in('id', idsToDelete)
                    .select();

                if (error) throw error;
                
                if (data && data.length === 0) {
                    alert("Atenção: A exclusão foi bloqueada pelo banco de dados. \n\nIsso ocorre porque a tabela 'historico_descartes' no seu Supabase precisa de uma política de segurança (RLS - Row Level Security) permitindo a operação 'DELETE' para usuários autenticados. Por favor, adicione essa política no painel do Supabase para ativar a exclusão.");
                }

                // Recarregar relatórios
                if(reportsBtn) reportsBtn.click();
            } catch(err) {
                alert("Erro ao apagar registros: " + err.message);
            } finally {
                deleteSelectedBtn.textContent = '🗑 Excluir';
                deleteSelectedBtn.disabled = false;
            }
        });
    }

    if(reportsBtn) {
        reportsBtn.addEventListener('click', async () => {
            dashboardModal.classList.remove('hidden');
            reportsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Carregando dados da nuvem...</td></tr>';
            if(selectAllReports) selectAllReports.checked = false;
            if(deleteSelectedBtn) deleteSelectedBtn.classList.add('hidden');
            
            try {
                const { data, error } = await supabaseClient
                    .from('historico_descartes')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (!data || data.length === 0) {
                    reportsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma etiqueta impressa ainda.</td></tr>';
                    return;
                }

                reportsTableBody.innerHTML = '';
                data.forEach(item => {
                    const dataImpressao = new Date(item.created_at).toLocaleString('pt-BR');
                    const dataAcumuloParts = item.data_acumulo ? item.data_acumulo.split('-') : [];
                    const dataAcumuloStr = dataAcumuloParts.length === 3 ? `${dataAcumuloParts[2]}/${dataAcumuloParts[1]}/${dataAcumuloParts[0]}` : item.data_acumulo;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td style="text-align: center;"><input type="checkbox" class="report-checkbox" value="${item.id}"></td>
                        <td>${dataAcumuloStr || '-'}</td>
                        <td style="font-weight: 600;">${item.produto_nome || '-'}</td>
                        <td>${item.volume || '-'}</td>
                        <td>${item.empresa || '-'}</td>
                        <td style="color: var(--text-secondary); font-size: 0.8rem;">${dataImpressao}</td>
                    `;
                    
                    const cb = row.querySelector('.report-checkbox');
                    cb.addEventListener('change', updateDeleteBtnVisibility);
                    
                    reportsTableBody.appendChild(row);
                });
            } catch (err) {
                reportsTableBody.innerHTML = `<tr><td colspan="6" style="color: var(--danger); text-align: center;">Erro ao carregar relatórios: ${err.message}</td></tr>`;
            }
        });
    }

    if(closeReportsBtn) {
        closeReportsBtn.addEventListener('click', () => {
            dashboardModal.classList.add('hidden');
        });
    }

    // --- Lógica de Receitas Salvas (Misturas Frequentes) ---
    const saveMixtureBtn = document.getElementById('saveMixtureBtn');
    const loadMixtureBtn = document.getElementById('loadMixtureBtn');
    const savedMixturesModal = document.getElementById('savedMixturesModal');
    const closeSavedMixturesBtn = document.getElementById('closeSavedMixturesBtn');
    const savedMixturesList = document.getElementById('savedMixturesList');

    
    function getSavedMixtures() {
        if (!currentUser) return [];
        return myProductsCache.filter(p => p.tipo === 'mistura').map(p => {
            let data = [];
            try { 
                const parsed = JSON.parse(p.observacoes || '[]'); 
                if (Array.isArray(parsed)) {
                    data = parsed;
                } else if (parsed && parsed.mixtureData) {
                    data = parsed.mixtureData;
                }
            }catch(e){}
            return {
                id: p.id_supabase,
                name: p.nome,
                data: data
            };
        });
    }

    async function saveMixtures(mixtures) {
        if (!currentUser || !supabaseClient) return;
        
        // This is called when saving a NEW mixture. We find the latest one added.
        const latest = mixtures[mixtures.length - 1];
        if(!latest) return;
        
        const { data, error } = await supabaseClient.from('meus_produtos').insert([{
            user_id: currentUser.id,
            nome: latest.name,
            tipo: 'mistura',
            observacoes: JSON.stringify(latest.data)
        }]);
        
        await loadMyProducts(); // reload cache
    }


    
    const deletePersonalDbBtn = document.getElementById('deletePersonalDbBtn');
    if(deletePersonalDbBtn) {
        deletePersonalDbBtn.addEventListener('click', async () => {
            if(!currentMyProductId || !currentUser || !supabaseClient) return;
            if(!confirm("Tem certeza que deseja apagar este item do seu banco de dados?")) return;
            
            const originalText = deletePersonalDbBtn.innerHTML;
            deletePersonalDbBtn.textContent = "Excluindo...";
            
            const { error } = await supabaseClient.from('meus_produtos').delete().eq('id', currentMyProductId);
            
            deletePersonalDbBtn.innerHTML = originalText;
            
            if(error) {
                alert("Erro ao excluir: " + error.message);
            } else {
                alert("Item excluído com sucesso!");
                await loadMyProducts();
                document.getElementById('productDetails').classList.add('hidden');
                currentMixture = [];
                updateMixtureDisplay();
            }
        });
    }

    const savePersonalDbBtn = document.getElementById('savePersonalDbBtn');
    if(savePersonalDbBtn) {
        savePersonalDbBtn.addEventListener('click', async () => {
            if (!currentUser || !supabaseClient) {
                alert("Você precisa estar logado para salvar no Meu Banco.");
                return;
            }
            
            const originalText = savePersonalDbBtn.innerHTML;
            savePersonalDbBtn.textContent = "Salvando...";
            
            const nome = document.getElementById('pdNome').textContent.trim();
            const onu_number = document.getElementById('pdOnu').textContent.replace('ONU: ', '').trim();
            const estado_fisico = document.getElementById('pdEstado') ? document.getElementById('pdEstado').value : '';
            const incompatibilidade = document.getElementById('pdIncompatibilidade') ? document.getElementById('pdIncompatibilidade').value : '';
            
            const ghs_classes = [];
            document.querySelectorAll('#pdPictogramas .picto-item').forEach(item => {
                if (item.classList.contains('active')) {
                    // Extract ID from the image alt or title. Since we don't store ID on the div, we can match by title
                    const title = item.title;
                    const ghsObj = allGhs.find(g => g.label === title);
                    if(ghsObj) ghs_classes.push(ghsObj.id);
                }
            });

            const frases_h = Array.from(document.getElementById('pdFrasesH').children).map(li => li.textContent);
            const frases_p = Array.from(document.getElementById('pdFrasesP').children).map(li => li.textContent);

            const payload_observacoes = {
                mixtureData: currentMixture,
                frases_h: frases_h,
                frases_p: frases_p
            };

            let error = null;
            if (currentMyProductId) {
                // Atualiza um item existente do próprio usuário
                const res = await supabaseClient.from('meus_produtos').update({
                    nome: nome,
                    tipo: currentMixture.length > 1 ? 'mistura' : 'residuo',
                    ghs_classes: ghs_classes,
                    estado_fisico: estado_fisico,
                    incompatibilidade: incompatibilidade,
                    onu_number: onu_number,
                    observacoes: JSON.stringify(payload_observacoes)
                }).eq('id', currentMyProductId);
                error = res.error;
            } else {
                // Cria um novo item no banco do usuário
                const res = await supabaseClient.from('meus_produtos').insert([{
                    user_id: currentUser.id,
                    nome: nome,
                    tipo: currentMixture.length > 1 ? 'mistura' : 'residuo',
                    ghs_classes: ghs_classes,
                    estado_fisico: estado_fisico,
                    incompatibilidade: incompatibilidade,
                    onu_number: onu_number,
                    observacoes: JSON.stringify(payload_observacoes)
                }]);
                error = res.error;
            }

            await loadMyProducts();
            
            savePersonalDbBtn.innerHTML = originalText;
            
            if (error) {
                console.error("Erro ao salvar no Meu Banco:", error);
                alert("Erro ao salvar: " + error.message);
            } else {
                alert(nome + " salvo no Meu Banco com sucesso!");
            }
        });
    }

    if(saveMixtureBtn) {
        saveMixtureBtn.addEventListener('click', async () => {
            if (currentMixture.length === 0) return;
            const recipeName = prompt("Digite um nome para esta Receita/Mistura (ex: Mistura HPLC):");
            if (!recipeName) return;

            const mixtures = getSavedMixtures();
            mixtures.push({
                id: Date.now(),
                name: recipeName,
                data: currentMixture
            });
            const originalText = saveMixtureBtn.textContent;
            saveMixtureBtn.textContent = 'Salvando...';
            await saveMixtures(mixtures);
            saveMixtureBtn.textContent = originalText;
            alert("Receita salva no Meu Banco com sucesso!");
        });
    }

    if(loadMixtureBtn) {
        loadMixtureBtn.addEventListener('click', () => {
            savedMixturesModal.classList.remove('hidden');
            renderSavedMixtures();
        });
    }

    if(closeSavedMixturesBtn) {
        closeSavedMixturesBtn.addEventListener('click', () => {
            savedMixturesModal.classList.add('hidden');
        });
    }

    window.loadRecipe = function(id) {
        const mixtures = getSavedMixtures();
        const recipe = mixtures.find(m => m.id === id);
        if (recipe) {
            // Re-gerar IDs para os itens do carrinho para evitar conflitos futuros
            currentMixture = recipe.data.map(item => ({
                ...item,
                id: Date.now() + Math.random()
            }));
            updateMixtureDisplay();
            savedMixturesModal.classList.add('hidden');
        }
    };

    window.deleteRecipe = async function(id) {
        if(!confirm("Tem certeza que deseja apagar esta receita salva do seu banco de dados?")) return;
        const { error } = await supabaseClient.from('meus_produtos').delete().eq('id', id);
        if (error) {
            alert("Erro ao excluir: " + error.message);
        } else {
            await loadMyProducts();
            renderSavedMixtures();
        }
    };

    function renderSavedMixtures() {
        const mixtures = getSavedMixtures();
        if (mixtures.length === 0) {
            savedMixturesList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhuma receita salva ainda.</p>';
            return;
        }

        savedMixturesList.innerHTML = '';
        mixtures.forEach(recipe => {
            const div = document.createElement('div');
            div.style.background = 'var(--surface)';
            div.style.padding = '1rem';
            div.style.borderRadius = '8px';
            div.style.border = '1px solid var(--border)';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';

            // Construção da string de Composição unificada (usando os nomes em Português)
            const composicaoText = recipe.data.map(m => `${m.produto.Common_Name_PT || m.produto.Common_Name} (${m.percentage}%)`).join(' + ');

            div.innerHTML = `
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 0.5rem 0;">${recipe.name}</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${composicaoText}</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="loadRecipe('${recipe.id}')" class="primary-btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Carregar</button>
                    <button onclick="deleteRecipe('${recipe.id}')" class="secondary-btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-color: var(--danger); color: var(--danger);">Excluir</button>
                </div>
            `;
            savedMixturesList.appendChild(div);
        });
    }

});
