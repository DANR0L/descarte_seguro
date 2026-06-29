const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

c = c.replace(/if \(data\.h_phrases && Array\.isArray\(data\.h_phrases\)[\s\S]*?else \{\s*document\.getElementById\('pdFrasesH'\)\.innerHTML = '';\s*\}/, `const finalHPhrases = (data.details && data.details.h_phrases_texts) ? data.details.h_phrases_texts : data.h_phrases;
                if (finalHPhrases && Array.isArray(finalHPhrases) && finalHPhrases.length > 0) {
                    document.getElementById('pdFrasesH').innerHTML = finalHPhrases.slice(0, 6).map(h => {
                        if (typeof h === 'object' && h.code) return '<li><strong>' + h.code + '</strong> - ' + (h.text || '') + '</li>';
                        return '<li>' + h + '</li>';
                    }).join('');
                } else {
                    document.getElementById('pdFrasesH').innerHTML = '';
                }`);

c = c.replace(/if \(data\.p_phrases && Array\.isArray\(data\.p_phrases\)[\s\S]*?else \{\s*document\.getElementById\('pdFrasesP'\)\.innerHTML = '';\s*\}/, `const finalPPhrases = (data.details && data.details.p_phrases_texts) ? data.details.p_phrases_texts : data.p_phrases;
                if (finalPPhrases && Array.isArray(finalPPhrases) && finalPPhrases.length > 0) {
                    document.getElementById('pdFrasesP').innerHTML = finalPPhrases.slice(0, 6).map(p => {
                        if (typeof p === 'object' && p.code) return '<li><strong>' + p.code + '</strong> - ' + (p.text || '') + '</li>';
                        return '<li>' + p + '</li>';
                    }).join('');
                } else {
                    document.getElementById('pdFrasesP').innerHTML = '';
                }`);

fs.writeFileSync('app.js', c);
console.log('Done');
