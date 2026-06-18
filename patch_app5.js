const fs = require('fs');
const path = './app.js';
let lines = fs.readFileSync(path, 'utf8').split('\n');

const start = lines.findIndex(l => l.includes("await supabaseClient.from('meus_produtos').upsert({"));
let end = -1;
if (start !== -1) {
    for (let i = start; i < start + 20; i++) {
        if (lines[i].includes("}, { onConflict: 'user_id, nome' });")) {
            end = i;
            break;
        }
    }
}

if (start !== -1 && end !== -1) {
    const newUpsert = `            let error = null;
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
    lines.splice(start, end - start + 1, newUpsert);
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
    console.log("Replaced upsert!");
} else {
    console.log("Could not find boundaries", start, end);
}
