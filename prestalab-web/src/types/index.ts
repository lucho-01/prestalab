export type UserRole = 'estudiante' | 'docente' | 'gestor' | 'admin';
export type UserGender = 'Masculino' | 'Femenino' | 'Otro';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  genero?: UserGender;
  rol: UserRole;
  laboratoriosAsignados?: string[]; // IDs de salas supervisadas por gestor
  departamento?: string;
  matriculaOCodigo?: string;
  createdAt?: string;
}

export type EstadoSala = 'disponible' | 'ocupado' | 'mantenimiento';

export interface Sala {
  id: string;
  nombre: string;
  codigo: string;
  edificio: string;
  capacidad: number;
  tipo: 'Hardware' | 'Software' | 'Redes' | 'Electrónica' | 'Multiuso' | 'Química' | 'Física';
  estado: EstadoSala;
  gestorResponsableId?: string;
  gestorNombre?: string;
  equiposCount?: number;
  descripcion?: string;
}

export type EstadoArticulo = 'operativo' | 'en_reparacion' | 'de_baja';
export type CondicionArticulo = 'buen_estado' | 'daniado' | 'perdido';

export interface Articulo {
  id: string;
  nombre: string;
  categoria: 'Herramientas' | 'Dispositivos' | 'Cables' | 'Redes' | 'Instrumentos' | 'Audio/Video' | 'Equipos de Medición';
  salaId: string;
  salaNombre: string;
  stock: number;
  stockTotal: number;
  estado: EstadoArticulo;
  condicion?: CondicionArticulo;
  fechaRegistro?: string;
  descripcion?: string;
  codigoActivo: string;
}

export type EstadoSolicitud = 'pendiente' | 'aprobado' | 'rechazado' | 'activo' | 'devuelto';

export interface SolicitudPrestamo {
  id: string;
  userId: string;
  userNombre: string;
  userEmail: string;
  userRol: 'estudiante' | 'docente';
  userGenero?: UserGender;
  tipoRecurso: 'articulo' | 'sala' | 'mixto';
  articuloId?: string;
  articuloNombre?: string;
  salaId: string;
  salaNombre: string;
  salaOriginalId?: string;
  salaOriginalNombre?: string;
  fueReasignada?: boolean;
  motivoReasignacion?: string;
  cantidad: number;
  fechaSolicitud: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  observaciones?: string;
  estado: EstadoSolicitud;
  gestorId?: string;
  gestorNombre?: string;
  motivoRechazo?: string;
  fechaAprobacion?: string;
  fechaRechazo?: string;
  fechaDevolucion?: string;
}

export interface ReporteUsuario {
  userId: string;
  nombre: string;
  email: string;
  rol: 'estudiante' | 'docente';
  genero?: UserGender;
  totalPrestamos: number;
  horasReservadas: number;
  prestamosActivos: number;
  prestamosDevueltos: number;
  prestamosRechazados: number;
  tasaCumplimiento: number; // Porcentaje
}

export interface ReporteSala {
  salaId: string;
  nombre: string;
  codigo: string;
  capacidad: number;
  totalReservas: number;
  horasOcupadas: number;
  tasaOcupacion: number; // Porcentaje
  estadoActual: EstadoSala;
  horaPico: string;
  articulosDisponibles: number;
}
