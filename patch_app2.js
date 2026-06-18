const fs = require('fs');
const path = './app.js';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Find the line with `function renderResults`
const renderIndex = lines.findIndex(l => l.includes('function renderResults('));
if (renderIndex === -1) throw new Error("Could not find renderResults");

// In renderResults, find the div.addEventListener('click'...
let clickStart = -1;
let clickEnd = -1;
for(let i = renderIndex; i < renderIndex + 30; i++) {
    if (lines[i].includes(`div.addEventListener('click', () => {`)) {
        clickStart = i;
    }
    // find the matching closing bracket
    if (clickStart !== -1 && lines[i].includes(`});`) && i > clickStart) {
        // wait, there might be inner closures, but in this specific block, the outer one closes at `            });`
        if (lines[i] === `            });\r` || lines[i] === `            });`) {
            clickEnd = i;
            break;
        }
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
                }

                searchInput.value = '';
                searchResults.classList.remove('active');
            });`;

    lines.splice(clickStart, clickEnd - clickStart + 1, newListener);
    
    // Also fix the loadRecipe/deleteRecipe uuid syntax error
    let content = lines.join('\n');
    content = content.replace(/onclick="loadRecipe\(\${recipe.id}\)"/g, `onclick="loadRecipe('\${recipe.id}')"`);
    content = content.replace(/onclick="deleteRecipe\(\${recipe.id}\)"/g, `onclick="deleteRecipe('\${recipe.id}')"`);
    
    fs.writeFileSync(path, content, 'utf8');
    console.log("Success");
} else {
    console.error("Could not find click listener block", clickStart, clickEnd);
}
