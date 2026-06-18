const fs = require('fs');
const path = './app.js';
let content = fs.readFileSync(path, 'utf8');

// Replace 1: savePersonalDbBtn
const oldSave = `            const incompatibilidade = document.getElementById('pdIncompatibilidade') ? document.getElementById('pdIncompatibilidade').value : '';
            
            const ghs_classes = [];
            document.querySelectorAll('#pdPictogramas .picto-item').forEach(item => {
                if (item.classList.contains('active')) {
                    // Extract ID from the image alt or title. Since we don't store ID on the div, we can match by title
                    const title = item.title;
                    const ghsObj = allGhs.find(g => g.label === title);
                    if(ghsObj) ghs_classes.push(ghsObj.id);
                }
            });

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
                    observacoes: JSON.stringify(currentMixture)
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
                    observacoes: JSON.stringify(currentMixture)
                }]);
                error = res.error;
            }`;

const newSave = `            const incompatibilidade = document.getElementById('pdIncompatibilidade') ? document.getElementById('pdIncompatibilidade').value : '';
            
            const ghs_classes = [];
            document.querySelectorAll('#pdPictogramas .picto-item').forEach(item => {
                if (item.classList.contains('active')) {
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
            }`;

content = content.replace(oldSave, newSave);

// Replace 2: getSavedMixtures
const oldGet = `    function getSavedMixtures() {
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
    }`;

const newGet = `    function getSavedMixtures() {
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
    }`;

content = content.replace(oldGet, newGet);

// Replace 3: search mapping
const oldSearchMap = `            if(p.tipo === 'mistura' && p.observacoes) {
                try {
                    const parsedData = JSON.parse(p.observacoes);
                    pObj.isMixture = true;
                    pObj.mixtureData = parsedData;
                }catch(e){}
            }`;

const newSearchMap = `            if(p.observacoes) {
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
            }`;

content = content.replace(oldSearchMap, newSearchMap);

// Replace 4: search result setTimeout restore
const oldRestore = `                        // Restaurar Pictogramas
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
                    }, 50); // Timeout para rodar logo após o updateMixtureDisplay`;

const newRestore = `                        // Restaurar Pictogramas
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
                                    document.getElementById('pdFrasesH').innerHTML = parsedObs.frases_h.map(f => \`<li>\${f}</li>\`).join('');
                                }
                                if (parsedObs.frases_p && Array.isArray(parsedObs.frases_p)) {
                                    document.getElementById('pdFrasesP').innerHTML = parsedObs.frases_p.map(f => \`<li>\${f}</li>\`).join('');
                                }
                            }
                        } catch(e) {}
                    }, 50); // Timeout para rodar logo após o updateMixtureDisplay`;

content = content.replace(oldRestore, newRestore);

fs.writeFileSync(path, content, 'utf8');
console.log('App patched successfully!');
