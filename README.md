# API Gateway ACB

Único punto de entrada HTTP para los componentes de Al Colegio en Bici. El gateway
traduce el contrato público a los servicios reales, propaga `Authorization` y
`x-correlation-id`, y normaliza los errores en el formato:

```json
{
  "error": {
    "code": "...",
    "message": "...",
    "correlationId": "...",
    "service": "..."
  }
}
```

## Contrato público

| Prefijo                                            | Upstream                            | Contenido                                                                                                         |
| -------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/api/v1/auth`, `/api/v1/{guides,students,search}` | `auth` + `admin_users`              | Login, guías, estudiantes, acudientes y búsqueda de personas.                                                     |
| `/api/v1/admin/*`                                  | `admin_routes` + `admin_operations` | Colegios, rutas administrativas, matrícula, puntos de encuentro, viajes, asistencia, eventos, faltas y check-ins. |
| `/api/v1/{routes,meeting-points,imports,status}`   | `acb_path_lo` (Python)              | Rutas geográficas, puntos de encuentro, importación KMZ, validación de PE01 y reportes de estado.                 |
| `/api/v1/tracking-sessions/*`                      | `acb_gps_lo` (Go)                   | Sesiones de tracking, observaciones, posiciones, control y cierre.                                                |

Reglas de arquitectura:

- El tracking GPS pertenece **solo** al componente Go. Los routers de tracking de
  `acb_path_lo` son legado obsoleto y el gateway no los usa ni los publica.
- El GPS resuelve la geometría de una ruta llamando al gateway
  (`GPS_GATEWAY_ROUTES_PATH`, por defecto `/api/v1/routes/{route_id}`), que a su
  vez consulta a `acb_path_lo`.
- `/api/v1/routes` es siempre la ruta geográfica de Python. Las rutas
  administrativas viven bajo `/api/v1/admin/routes` para evitar colisiones.

## Alias de clientes

`presentationACB` publica dos prefijos y Nginx los reescribe así:

| Cliente        | Nginx             | Gateway                             |
| -------------- | ----------------- | ----------------------------------- |
| `/api/admin/*` | `/api/v1/admin/*` | `admin_routes` + `admin_operations` |
| `/api/geo/*`   | `/api/v1/*`       | `acb_path_lo` y `acb_gps_lo`        |

`webadminACB` llama al gateway directamente con `/api/v1/*`.

## Contratos traducidos por el gateway

Tres casos unen varios microservicios y se resuelven en orquestadores:

| Contrato público                                                                                     | Servicios                      | Traducción                                                                                                                        |
| ---------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `GET/POST /api/v1/admin/routes/{routeId}/students`                                                   | `admin_users` + `admin_routes` | Une el detalle del estudiante, su matrícula y sus puntos de encuentro. El alta crea el usuario, lo matricula y asigna los puntos. |
| `GET/POST /api/v1/admin/trips/{tripId}/attendance` y `GET /api/v1/admin/routes/{routeId}/attendance` | `admin_operations`             | Inicializa el padrón, guarda `01`/`00` por estudiante y normaliza el historial.                                                   |
| `GET /api/v1/admin/trips?date=`                                                                      | `admin_operations`             | Normaliza la entidad `Trip` al modelo de `presentationACB`.                                                                       |

Las rutas administrativas se identifican siempre por `routeId` numérico. El
`routeCode` se usa para mostrar y para las llamadas geográficas a `acb_path_lo`.

## Endpoints sin contrato backend

`presentationACB` conserva pantallas construidas contra un mock eliminado. Las
rutas que ningún microservicio implementa responden `501 FEATURE_UNAVAILABLE` en
lugar de `404`, para distinguir "no existe el contrato" de "ruta mal escrita":

- `zones`, `leaders`, `arrivals`.
- `trips/{id}/executors`.
- Ciclo de vida de ruta (`submit`, `approve`, `reject`, `status`, `reviewNotes`).
- `GET /status` y `GET /positions/latest`.
- `DELETE` de estudiantes y guías en `admin_users`.

Estas brechas se cierran en los microservicios, no en el gateway.

## Variables de entorno

| Variable                 | Descripción                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `AUTH_SERVICE_URL`       | Origen de `acb_auth`.                                                                                    |
| `USERS_SERVICE_URL`      | Origen de `acb_admin_users`.                                                                             |
| `OPERATIONS_SERVICE_URL` | Origen de `acb_admin_operation`.                                                                         |
| `ROUTES_SERVICE_URL`     | Origen de `acb_admin_routes`.                                                                            |
| `PATHS_SERVICE_URL`      | Origen de `acb_path_lo` (Python).                                                                        |
| `GPS_SERVICE_URL`        | Origen de `acb_gps_lo` (Go).                                                                             |
| `GPS_INTERNAL_TOKEN`     | Credencial interna para control/lectura del GPS. Debe coincidir con `GPS_GATEWAY_INTERNAL_TOKEN` del Go. |
| `ACB_JWT_SECRET`         | Secreto HS256 compartido con adminACB; autoriza creación/lectura/cierre de tracking.                     |
| `GPS_POLICY_ID`          | Política que el gateway impone al crear una sesión de tracking.                                          |
| `PORT`                   | Puerto del gateway (5062 por defecto).                                                                   |

`POST /api/v1/tracking-sessions` exige un JWT de guía; el gateway reemplaza
`guide_id` con el sujeto del token y `policy_id` con `GPS_POLICY_ID`. Las
observaciones siguen autenticadas únicamente con el Bearer de sesión GPS.

El componente Go debe arrancar con `GPS_CONTROL_API_ENABLED=true` y
`GPS_READ_API_ENABLED=true` para que las rutas de tracking respondan. Sin esas
banderas, el gateway reenvía la respuesta del propio GPS indicando que la API
está deshabilitada.

Al arrancar con `src/server.js`, el proceso falla de forma explícita si falta
alguna URL de servicio. Las pruebas inyectan servicios y no exigen las variables.

## Ejecutar

```sh
cp .env.example .env   # completar GPS_INTERNAL_TOKEN
npm install
npm run dev            # lee .env
```

Con Docker:

```sh
docker network create acb-net   # una sola vez
docker compose up -d --build
```

El contenedor se une a `acb-net` y usa `extra_hosts` para alcanzar los servicios
de `adminACB` publicados en el host.

## Pruebas

```sh
npm test
```

Cubren el contrato de rutas, la separación Python/Go, los alias de geoloca, los
repositorios administrativos y la documentación OpenAPI. La documentación
interactiva queda en `/docs` y el documento en `/openapi.json` cuando
`NODE_ENV !== "production"`.
