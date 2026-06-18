const fs = require('fs');
const path = './app.js';
let content = fs.readFileSync(path, 'utf8');

const oldUpsert = `            const { error } = await supabaseClient.from('meus_produtos').upsert({
                user_id: currentUser.id,
                nome: nome,
                tipo: currentMixture.length > 1 ? 'mistura' : 'residuo',
                ghs_classes: ghs_classes,
                estado_fisico: estado_fisico,
                incompatibilidade: incompatibilidade,
                onu_number: onu_number,
                observacoes: JSON.stringify(currentMixture)
            }, { onConflict: 'user_id, nome' }); // Assuming we don't strictly conflict by name, Supabase upsert requires unique key. Let's just insert for now.`;

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

content = content.replace(oldUpsert, newUpsert);
fs.writeFileSync(path, content, 'utf8');
console.log('Upsert logic fixed.');
