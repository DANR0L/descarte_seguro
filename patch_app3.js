const fs = require('fs');
const path = './app.js';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Find the line with `let myProductsCache = [];`
const cacheIndex = lines.findIndex(l => l.includes('let myProductsCache = [];'));
if (cacheIndex !== -1) {
    lines[cacheIndex] = 'let myProductsCache = [];\nlet currentMyProductId = null;';
}

// In the search listener click event
let clickStart = -1;
let clickEnd = -1;
for(let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`div.addEventListener('click', () => {`)) {
        clickStart = i;
    }
    if (clickStart !== -1 && lines[i].includes(`            });`) && i > clickStart) {
        clickEnd = i;
        break; // found the block
    }
}

if (clickStart !== -1 && clickEnd !== -1) {
    const newListener = `            div.addEventListener('click', () => {
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
            });`;

    lines.splice(clickStart, clickEnd - clickStart + 1, newListener);
}

let content = lines.join('\n');

// Add delete button event listener next to savePersonalDbBtn
const delLogic = `
    const deletePersonalDbBtn = document.getElementById('deletePersonalDbBtn');
    if(deletePersonalDbBtn) {
        deletePersonalDbBtn.addEventListener('click', async () => {
            if(!currentMyProductId || !currentUser || !supabaseClient) return;
            if(!confirm("Tem certeza que deseja apagar esta receita/produto do seu banco de dados?")) return;
            
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
`;

content = content.replace("if(savePersonalDbBtn) {", delLogic + "\n    if(savePersonalDbBtn) {");

fs.writeFileSync(path, content, 'utf8');
console.log('App patched delete logic.');
