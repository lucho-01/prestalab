# 📱 PrestaLab Mobile — Aplicación Móvil para Estudiantes y Docentes

Aplicación móvil desarrollada en **React Native** con **Expo** y **Firebase** para el ecosistema **PrestaLab**. Permite a estudiantes y docentes consultar el inventario localizado de laboratorios en tiempo real, tramitar solicitudes de préstamo y auditar su historial completo de interacciones.

---

## 🚀 Nuevas Funcionalidades Implementadas

### 1. 🕒 Trazabilidad Completa: Pantalla de Historial (`LoanHistoryScreen`)
* Sección exclusiva accesible desde **Perfil > Historial de préstamos**.
* Filtros por estado: `Todos`, `Pendientes`, `Activos`, `Devueltos`, `Rechazados`.
* **Notificación de Reasignación:** Si el gestor modificó la sala asignada por mantenimiento o cruce de horarios, se muestra un banner distintivo con la sala original y el motivo justificado.
* **Motivo de Rechazo:** Si la solicitud fue denegada, se detalla la justificación formal ingresada por el gestor.

### 2. 🔄 Flujo Dinámico de Solicitudes y Enrutamiento al Gestor (`LoanRequestScreen`)
* **Selector de Laboratorio / Sala de Destino:** Muestra en tiempo real las salas disponibles (`LAB-201`, `LAB-104`, `SALA-302`, etc.) y su capacidad.
* **Enrutamiento en Tiempo Real:** Las solicitudes se guardan en estado **`pendiente`**, redirigiéndose de inmediato al panel web del Gestor asignado para su evaluación.

### 3. 📦 Catálogo de Inventario Localizado (`ArticulosScreen`)
* Filtro de activos por **Laboratorio Físico** (`salaId`) y por **Categoría** (`Herramientas`, `Dispositivos`, `Cables`, `Redes`).
* Identificación clara del código institucional de activo (`ACT-...`) y del laboratorio físico en cada tarjeta.

### 4. 🔔 Comunicación Proactiva en Inicio (`HomeScreen`)
* Banner de notificación de **solicitudes en revisión por el gestor** con acceso directo al historial.
* Notificación visual en las tarjetas de préstamos activos si la sala fue modificada o reasignada.

---

## 🛠️ Ejecución de la App Móvil con Expo

```bash
cd /d/movil2/prestalab-app-update

# Iniciar el servidor Metro
npx expo start
```
