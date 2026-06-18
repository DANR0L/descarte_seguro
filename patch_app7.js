const fs = require('fs');
const path = './app.js';
let content = fs.readFileSync(path, 'utf8');

const oldDelete = `    window.deleteRecipe = function(id) {
        if(!confirm("Tem certeza que deseja apagar esta receita salva?")) return;
        let mixtures = getSavedMixtures();
        mixtures = mixtures.filter(m => m.id !== id);
        saveMixtures(mixtures);
        renderSavedMixtures();
    };`;

const newDelete = `    window.deleteRecipe = async function(id) {
        if(!confirm("Tem certeza que deseja apagar esta receita salva do seu banco de dados?")) return;
        const { error } = await supabaseClient.from('meus_produtos').delete().eq('id', id);
        if (error) {
            alert("Erro ao excluir: " + error.message);
        } else {
            await loadMyProducts();
            renderSavedMixtures();
        }
    };`;

content = content.replace(oldDelete, newDelete);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed deleteRecipe');
