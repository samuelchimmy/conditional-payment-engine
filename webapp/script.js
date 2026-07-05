
const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/USER/Downloads/conditional-p2p/webapp/src';

const sizeMap = {
    '56px': '48px',
    '36px': '32px',
    '32px': '28px',
    '28px': '24px',
    '24px': '20px',
    '20px': '18px',
    '18px': '16px',
    '16px': '14px',
    '15px': '14px',
    '14px': '13px',
    '13px': '12px',
    '12px': '11px',
    '11px': '10px'
};

const pattern = /text-\[(\d+px)\]/g;

let changedFiles = 0;

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walk(filepath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(filepath, 'utf8');
            const newContent = content.replace(pattern, (match, size) => {
                return sizeMap[size] ? 'text-[' + sizeMap[size] + ']' : match;
            });
            
            if (newContent !== content) {
                fs.writeFileSync(filepath, newContent, 'utf8');
                changedFiles++;
            }
        }
    }
}

walk(directory);
console.log('Successfully updated text sizes in ' + changedFiles + ' files.');

