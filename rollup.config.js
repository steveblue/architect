import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

class ResolveRxjs {
    resolveId(importee, importer) {
        if (importee.startsWith('rxjs')) {
            let pkg = importee.replace('rxjs', '');
            if (importee.includes('/')) {
                return `node_modules/rxjs/_esm2015${pkg}/index.js`;
            } else {
                return `node_modules/rxjs/_esm2015/${pkg}index.js`;
            }
        }
    }
}


class ResolveAngular {
    resolveId(importee, importer) {
        if (importee.startsWith('@angular')) {
            let pkg = importee.replace('@angular', '');
            if (importee.split('/').length > 2) {
                return `node_modules/${importee.split('/')[0]}/${importee.split('/')[1]}/fesm2015/${importee.split('/')[2]}.js`;
            } else {
                return `node_modules/${importee}/fesm2015${pkg}.js`;
            }
        }
    }
}


export default [{
    input: ['out-tsc/app/src/main.js',
            'out-tsc/app/src/app/routes/lazy1/lazy1.module.ngfactory.js',
            'out-tsc/app/src/app/routes/lazy2/lazy2.module.ngfactory.js',
            'out-tsc/app/src/app/routes/lazy3/lazy3.module.ngfactory.js'
    ],
    treeshake: true,
    output: {
        dir: 'dist/build_repo',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        new ResolveRxjs(),
        new ResolveAngular(),
        nodeResolve(),
        terser()
    ],
    onwarn: function (message) {

        console.log(message);

    }
},
{
    input: 'src/polyfills.ts',
    treeshake: true,
    output: {
        name: 'polyfills',
        file: 'dist/build_repo/polyfills.js',
        format: 'iife'
    },
    plugins: [
        nodeResolve(),
        typescript(),
        terser()
    ],
    onwarn: function (message) {

        console.log(message);

    }
}]