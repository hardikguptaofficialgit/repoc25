
const fs = require('fs');
const content = fs.readFileSync('src/data/buildingData.js', 'utf8');
// Strip the exports
const nodesMatch = content.match(/export const nodes = ({[\s\S]*?});/);
if (nodesMatch) {
    const nodesStr = nodesMatch[1];
    // This is not perfect JSON, it's JS. We can try to eval it safely in this context
    const nodes = eval('(' + nodesStr + ')');
    let lifts = 0;
    let rooms = 0;
    for (let id in nodes) {
        const type = nodes[id].type;
        if (type === 'lift') lifts++;
        if (['classroom', 'lab', 'office', 'library', 'cafeteria', 'washroom_gents', 'washroom_ladies'].includes(type)) rooms++;
    }
    console.log(JSON.stringify({ lifts, rooms }));
} else {
    console.log('Could not find nodes object');
}
