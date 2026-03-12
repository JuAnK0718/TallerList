# NexusStore — Sistema de Gestión de Pedidos

## Pasos para ejecutar

1. Instalar dependencias:
```
npm install
```

2. Compilar TypeScript a bundle.js:
```
npm run build
```

3. Abrir `public/index.html` en el navegador.

## Estructura
```
TallerWeb/
├── src/
│   ├── types/NexusTypes.ts
│   ├── models/NexusModels.ts
│   ├── services/HeliosCoreService.ts
│   ├── structures/VaultLinkedList.ts
│   └── main.ts
├── public/
│   ├── index.html
│   └── styles.css
│   └── bundle.js  ← se genera con npm run build
├── webpack.config.js
├── tsconfig.json
└── package.json
```

## Flujo del sistema (basado en el diagrama)
1. Crear Requisición (Oficina de Despacho)
2. Crear RFQ desde la requisición (Agente Comprador)
3. Aprobar/Rechazar RFQ si requiere revisión (Supervisor)
4. Crear Cotización con precios (Vendedor)
5. Aceptar/Rechazar Cotización (Agente Comprador)
6. Crear Pedido desde cotización aprobada
7. Aceptar/Rechazar Pedido (Vendedor)
8. Completar Pedido → genera Factura automáticamente
9. Registrar Pago de la Factura
10. Confirmar Entrega (Agente Receptor)
