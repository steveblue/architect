# builds npm package
node_modules/.bin/tsc -p tsconfig.json
cp package.json dist/package.json
cp builders.json dist/builders.json
cp src/rollup/schema.json dist/src/rollup/schema.json
cp src/closure/schema.json dist/src/closure/schema.json