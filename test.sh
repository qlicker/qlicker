node_modules/.bin/eslint . --ext .js,.jsx

web=$1

if [[ -n "$web" ]]; then
  meteor test --driver-package practicalmeteor:mocha
else
  node_modules/spacejam/bin/spacejam test --driver-package practicalmeteor:mocha
fi


