const fs = require('fs');
const path = './app.js';
let content = fs.readFileSync(path, 'utf8');

const oldListener = `            div.addEventListener('click', () => {
                if(p.isMixture && p.mixtureData) {
                    currentMixture = p.mixtureData.map(item => ({...item, id: Date.now() + Math.random()}));
                    updateMixtureDisplay();
                    searchInput.value = '';
                    searchResults.classList.remove('active');
                } else {
                    selectProduct(p);
                }
            });`;

const newListener = `            div.addEventListener('click', () => {
                if(p.isMixture && p.mixtureData) {
                    currentMixture = p.mixtureData.map(item => ({...item, id: Date.now() + Math.random()}));
                    updateMixtureDisplay();
                } else {
                    selectProduct(p);
                }

                // Restaurar edições personalizadas (Nome, ONU, Estado, Incompatibilidade e Pictogramas)
                if(p.isMyProduct) {
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
                    }, 50); // Timeout para rodar logo após o updateMixtureDisplay (que zera e recalcula tudo)
                }

                searchInput.value = '';
                searchResults.classList.remove('active');
            });`;

content = content.replace(oldListener, newListener);

// Also fix the loadRecipe/deleteRecipe uuid syntax error
content = content.replace(/onclick="loadRecipe\(\${recipe.id}\)"/g, `onclick="loadRecipe('\${recipe.id}')"`);
content = content.replace(/onclick="deleteRecipe\(\${recipe.id}\)"/g, `onclick="deleteRecipe('\${recipe.id}')"`);

fs.writeFileSync(path, content, 'utf8');
console.log('App patched.');
