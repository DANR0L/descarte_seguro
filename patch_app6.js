const fs = require('fs');
const path = './app.js';
let lines = fs.readFileSync(path, 'utf8').split('\n');

const inputStart = lines.findIndex(l => l.includes("searchInput.addEventListener('input', (e) => {"));
let inputEnd = -1;
for (let i = inputStart; i < lines.length; i++) {
    if (lines[i].includes("function renderResults(list, isOnline = false")) {
        // The listener ends a few lines before renderResults
        for(let j = i - 1; j > inputStart; j--) {
            if (lines[j].includes("});")) {
                inputEnd = j;
                break;
            }
        }
        break;
    }
}

const renderStart = lines.findIndex(l => l.includes("function renderResults(list, isOnline = false"));
let renderEnd = -1;
for (let i = renderStart; i < lines.length; i++) {
    if (lines[i].includes("document.addEventListener('click', (e) => {")) {
        for(let j = i - 1; j > renderStart; j--) {
            if (lines[j].includes("}")) {
                renderEnd = j;
                break;
            }
        }
        break;
    }
}

if (inputStart !== -1 && inputEnd !== -1 && renderStart !== -1 && renderEnd !== -1) {

    const newRenderResults = `    function renderResults(list, isOnline = false, append = false) {
        if (!append) searchResults.innerHTML = '';
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
    }`;

    const newSearchListener = `    searchInput.addEventListener('input', (e) => {
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
                    const trRes = await fetch(\`https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=\${encodeURIComponent(query)}\`);
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
                const autoRes = await fetch(\`https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/\${encodeURIComponent(searchWord)}/json?limit=6\`);
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
                            div.innerHTML = \`<strong>\${term}</strong> <span style="color: #00875F; font-size: 0.8em; float: right;">[Sugestão PubChem]</span>\`;
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
    });`;

    // Replace render results
    lines.splice(renderStart, renderEnd - renderStart + 1, newRenderResults);
    
    // Have to recalculate inputStart and End because array changed length
    const newInputStart = lines.findIndex(l => l.includes("searchInput.addEventListener('input', (e) => {"));
    let newInputEnd = -1;
    for (let i = newInputStart; i < lines.length; i++) {
        if (lines[i].includes("function renderResults(list, isOnline = false")) {
            for(let j = i - 1; j > newInputStart; j--) {
                if (lines[j].includes("});")) {
                    newInputEnd = j;
                    break;
                }
            }
            break;
        }
    }

    lines.splice(newInputStart, newInputEnd - newInputStart + 1, newSearchListener);
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
    console.log("Success");
} else {
    console.log("Failed to find bounds", inputStart, inputEnd, renderStart, renderEnd);
}
