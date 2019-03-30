# builds npm package
cp package.json dist/package.json
cp builders.json dist/builders.json
cp src/rollup/schema.json dist/src/rollup/schema.json
node_modules/.bin/tsc -p tsconfig.json