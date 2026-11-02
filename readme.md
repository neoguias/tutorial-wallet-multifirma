# Wallet multifirma con Solidity, Hardhat y React

Proyecto del [tutorial de la wallet multifirma de Neoguias](https://www.neoguias.com/tutorial-wallet-multifirma-solidity/). Incluye un contrato Solidity, sus pruebas y una aplicación React para proponer y aprobar transferencias de ETH.

La versión actual utiliza Hardhat 3, Ethers 6, React 19 y Vite 8. Los propietarios y el número de firmas se fijan al desplegar. Una propuesta se ejecuta cuando alcanza el umbral; quien la crea también debe aprobarla si quiere aportar su firma.

## Requisitos

Node.js 24.12 o posterior de la rama 24 y npm. El archivo `.nvmrc` permite seleccionar esa rama con NVM:

```bash
nvm install
nvm use
npm ci
```

## Compila y ejecuta las pruebas

Desde la raíz del proyecto:

```bash
npm run compile
npm test
```

La compilación exporta la ABI de `Wallet` a `frontend/src/abi/Wallet.json`. Las pruebas comprueban propietarios, umbral, depósitos, permisos, aprobaciones, envío, fondos insuficientes, destinatarios que rechazan ETH y reentrada sobre una transferencia ya ejecutada.

## Arranque local

Abre una terminal y deja el nodo local ejecutándose:

```bash
npm run node
```

En otra terminal, despliega el contrato:

```bash
npm run deploy
npm run dev
```

Abre la dirección que muestre Vite. El despliegue local utiliza los tres primeros propietarios de Hardhat, un umbral de dos firmas e ingresa 1 ETH de prueba. Genera `frontend/public/deployment.json` con la dirección, el identificador de red y el RPC público. Los fondos y cuentas del nodo local son de desarrollo.

La aplicación permite consultar el saldo y los propietarios, ingresar ETH, proponer transferencias, aprobarlas y actualizar su estado. Espera la confirmación de cada transacción antes de refrescar los datos.

## Configura MetaMask

Añade la red local con estos valores:

- URL RPC: `http://127.0.0.1:8545`.
- Identificador de cadena: `31337`.
- Símbolo: `ETH`.

Importa únicamente las cuentas de desarrollo que muestra tu nodo local. Conecta el primer propietario, crea una propuesta y apruébala. Cambia al segundo propietario, vuelve a conectar y aporta la segunda firma. La aplicación mostrará la transferencia como enviada.

Si reinicias el nodo, vuelve a ejecutar `npm run deploy` y recarga la página. La aplicación detecta direcciones de contratos que ya no existen en la red seleccionada.

## Configuración del despliegue

Puedes copiar `.env.example` a `.env`. `WALLET_OWNERS` acepta direcciones separadas por comas; `MIN_APPROVALS` define el número mínimo de firmas.

Para un despliegue propio en Sepolia, configura `SEPOLIA_RPC_URL`, `SEPOLIA_PRIVATE_KEY` y los propietarios. El contrato y los tests deben revisarse antes de utilizar el proyecto fuera del entorno de aprendizaje.

```bash
npm run deploy:sepolia
```

Este comando utiliza la cuenta configurada para desplegar en la testnet. La clave permanece en el entorno del proceso. `PUBLIC_RPC_URL` permite proporcionar al frontend una URL pública de lectura; comprueba que su uso desde el navegador esté permitido por tu proveedor.

## Compilación del frontend

```bash
npm run build
```

Los archivos publicables se guardan en `frontend/dist`. Despliega primero el contrato para que la compilación incluya el archivo público `deployment.json`. La ABI se exporta automáticamente antes de compilar React.

## Docker

```bash
docker compose run --rm frontend npm ci
docker compose up -d
docker compose exec chain npm run deploy
```

El frontend estará en `http://localhost:5178` y el nodo local en `http://127.0.0.1:8545`. Para ejecutar las pruebas:

```bash
docker compose exec chain npm test
```

## Autor y licencia

[Edu Lázaro](https://edulazaro.com). Código disponible bajo la licencia MIT. El tutorial conserva sus propios derechos.
