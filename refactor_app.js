const fs = require('fs');
const path = './app.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add myProductsCache
content = content.replace('let supabaseClient;', 'let supabaseClient;\nlet myProductsCache = [];');

// 2. Add loadMyProducts function
const loadMyProductsCode = `
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
`;
content = content.replace('async function loadUserProfile() {', loadMyProductsCode + '\nasync function loadUserProfile() {');

// 3. Call loadMyProducts inside checkSession
content = content.replace('loadUserProfile();', 'loadUserProfile();\n              await loadMyProducts();');

// 4. Update search function to use myProductsCache
const newSearchCode = `
        const myFiltered = myProductsCache.filter(p => {
            const cn = p.nome ? p.nome.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "") : "";
            return cn.includes(queryNorm);
        }).map(p => {
            let pObj = {
                Common_Name: p.nome,
                CAS_Number: p.tipo === 'residuo' ? 'Meu Banco' : 'Minha Mistura',
                isMyProduct: true,
                meuProdutoData: p,
                Pictograms_List: p.ghs_classes || []
            };
            if(p.tipo === 'mistura' && p.observacoes) {
                try {
                    const parsedData = JSON.parse(p.observacoes);
                    pObj.isMixture = true;
                    pObj.mixtureData = parsedData;
                }catch(e){}
            }
            return pObj;
        });

        const combined = [...myFiltered, ...filtered];
        if (combined.length > 0) {
            renderResults(combined);
`;

content = content.replace(`if (filtered.length > 0) {\n            renderResults(filtered);`, newSearchCode);

// 5. Update renderResults to show badge
content = content.replace(`function renderResults(list, isOnline = false) {
        searchResults.innerHTML = '';
        list.forEach(p => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = \`<strong>\${p.Common_Name}</strong> <small>(\${p.CAS_Number})</small> \${isOnline ? '<span style="color: #00875F; font-size: 0.8em; float: right;">[PubChem]</span>' : ''}\`;
            div.addEventListener('click', () => selectProduct(p));
            searchResults.appendChild(div);
        });
        searchResults.classList.add('active');
    }`, `function renderResults(list, isOnline = false) {
        searchResults.innerHTML = '';
        list.forEach(p => {
            const div = document.createElement('div');
            div.className = 'result-item';
            let badge = isOnline ? '<span style="color: #00875F; font-size: 0.8em; float: right;">[PubChem]</span>' : '';
            if (p.isMyProduct) {
                badge = \`<span style="color: #3b82f6; font-size: 0.8em; float: right;">[Meu Banco]</span>\`;
            }
            div.innerHTML = \`<strong>\${p.Common_Name}</strong> <small>(\${p.CAS_Number || ''})</small> \${badge}\`;
            div.addEventListener('click', () => {
                if(p.isMixture && p.mixtureData) {
                    currentMixture = p.mixtureData.map(item => ({...item, id: Date.now() + Math.random()}));
                    updateMixtureDisplay();
                    searchInput.value = '';
                    searchResults.classList.remove('active');
                } else {
                    selectProduct(p);
                }
            });
            searchResults.appendChild(div);
        });
        searchResults.classList.add('active');
    }`);

// 6. Update getSavedMixtures to use Supabase cache instead of local storage
const newMixturesCode = `
    function getSavedMixtures() {
        if (!currentUser) return [];
        return myProductsCache.filter(p => p.tipo === 'mistura').map(p => {
            let data = [];
            try { data = JSON.parse(p.observacoes || '[]'); }catch(e){}
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
`;

content = content.replace(`function getSavedMixtures() {
        if (!currentUser) return [];
        const saved = localStorage.getItem(\`saved_mixtures_\${currentUser.id}\`);
        return saved ? JSON.parse(saved) : [];
    }

    function saveMixtures(mixtures) {
        if (!currentUser) return;
        localStorage.setItem(\`saved_mixtures_\${currentUser.id}\`, JSON.stringify(mixtures));
    }`, newMixturesCode);

// 7. Make saveMixtures awaitable inside saveMixtureBtn click
content = content.replace(`saveMixtureBtn.addEventListener('click', () => {`, `saveMixtureBtn.addEventListener('click', async () => {`);
content = content.replace(`saveMixtures(mixtures);
            alert("Receita salva com sucesso!");`, `const originalText = saveMixtureBtn.textContent;
            saveMixtureBtn.textContent = 'Salvando...';
            await saveMixtures(mixtures);
            saveMixtureBtn.textContent = originalText;
            alert("Receita salva no Meu Banco com sucesso!");`);


// 8. Add event listener for "Salvar no Meu Banco"
const savePersonalDbCode = `
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

            const { error } = await supabaseClient.from('meus_produtos').upsert({
                user_id: currentUser.id,
                nome: nome,
                tipo: currentMixture.length > 1 ? 'mistura' : 'residuo',
                ghs_classes: ghs_classes,
                estado_fisico: estado_fisico,
                incompatibilidade: incompatibilidade,
                onu_number: onu_number,
                observacoes: JSON.stringify(currentMixture)
            }, { onConflict: 'user_id, nome' }); // Assuming we don't strictly conflict by name, Supabase upsert requires unique key. Let's just insert for now.

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
`;

content = content.replace('if(saveMixtureBtn) {', savePersonalDbCode + '\n    if(saveMixtureBtn) {');

fs.writeFileSync(path, content, 'utf8');
console.log('Refactor completed successfully!');
