const deps1 = [];
const deps2 = [1];
const hookDeps = [1];

console.log('Testing dependency comparison logic');
console.log('deps1:', deps1);
console.log('deps2:', deps2);
console.log('hookDeps:', hookDeps);

const hasChanged1 = !deps2 || !hookDeps || deps2.some((dep, i) => dep !== hookDeps[i]);
console.log('hasChanged (same deps):', hasChanged1);

const hasChanged2 = !deps2 || !deps1 || deps2.some((dep, i) => dep !== deps1[i]);
console.log('hasChanged (different deps):', hasChanged2);

console.log('Some test:', deps2.some((dep, i) => dep !== hookDeps[i]));